import os
import httpx
from fastapi import HTTPException
from loguru import logger
from typing import Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from . import prompt


OPENAI_REALTIME_SESSIONS_URL = "https://api.openai.com/v1/realtime/sessions"
OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions"

OPENAI_REALTIME_MODEL = "gpt-4o-realtime-preview"
OPENAI_TRANSCRIPTION_MODEL = "whisper-1"

# 8세 아이용 따뜻한 여성 음성. Task #7에서 다른 voice (shimmer/ballad/sage 등)와
# A/B 후 확정. coral은 비교적 밝고 부드러운 톤.
BETH_VOICE = "coral"

OPENAI_REALTIME_TIMEOUT = 10.0
OPENAI_TRANSCRIPTION_TIMEOUT = 60.0


def _api_key() -> str:
    k = os.getenv("OPENAI_API_KEY")
    if not k:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not configured.",
        )
    return k


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type": "application/json",
    }


async def generate_webrtc_key() -> str:
    """Mint an ephemeral client_secret for OpenAI Realtime WebRTC."""
    payload = {
        "model": OPENAI_REALTIME_MODEL,
        "voice": BETH_VOICE,
        "instructions": prompt.BETH_SYSTEM_PROMPT,
        "modalities": ["audio", "text"],
        "input_audio_transcription": {
            "model": OPENAI_TRANSCRIPTION_MODEL,
            "language": "ko",
        },
        "turn_detection": {
            "type": "server_vad",
            "threshold": 0.5,
            "prefix_padding_ms": 300,
            "silence_duration_ms": 600,
        },
        "temperature": 0.85,
    }

    async with httpx.AsyncClient(timeout=OPENAI_REALTIME_TIMEOUT) as client:
        try:
            r = await client.post(
                OPENAI_REALTIME_SESSIONS_URL,
                headers=_headers(),
                json=payload,
            )
        except httpx.HTTPError as exc:
            logger.error(f"realtime session: network error: {exc!r}")
            raise HTTPException(status_code=502, detail="OpenAI Realtime unreachable.") from exc

    if r.status_code != 200:
        logger.error(f"realtime session: {r.status_code} {r.text[:300]}")
        raise HTTPException(status_code=r.status_code, detail="Failed to mint ephemeral key.")

    data = r.json()
    key = (data.get("client_secret") or {}).get("value")
    if not key:
        logger.error(f"realtime session: missing client_secret.value in response: {data}")
        raise HTTPException(status_code=500, detail="Malformed Realtime session response.")
    return key


async def transcribe_audio(
    filename: Optional[str],
    file_bytes: bytes,
    content_type: Optional[str],
) -> dict:
    """Whisper STT fallback for the /api/transcribe endpoint."""
    files = {
        "file": (filename or "audio.webm", file_bytes, content_type or "audio/webm"),
    }
    data = {"model": OPENAI_TRANSCRIPTION_MODEL, "language": "ko"}
    async with httpx.AsyncClient(timeout=OPENAI_TRANSCRIPTION_TIMEOUT) as client:
        r = await client.post(
            OPENAI_TRANSCRIPTION_URL,
            headers={"Authorization": f"Bearer {_api_key()}"},
            data=data,
            files=files,
        )
    if r.status_code != 200:
        logger.error(f"transcription: {r.status_code} {r.text[:300]}")
        raise HTTPException(status_code=r.status_code, detail="Transcription failed.")
    return r.json()
