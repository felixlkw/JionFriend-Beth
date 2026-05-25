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


# GA 엔드포인트 (2026-05 기준).
# Beta: /v1/realtime/sessions  →  GA: /v1/realtime/client_secrets
OPENAI_REALTIME_CLIENT_SECRETS_URL = "https://api.openai.com/v1/realtime/client_secrets"
OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions"

# GA 정식 모델 ID. Beta 시절 "gpt-4o-realtime-preview" 는 sunset 됨.
# 필요 시 "gpt-realtime-2" 또는 날짜 픽스 버전("gpt-realtime-2025-08-28" 등) 으로 교체.
OPENAI_REALTIME_MODEL = "gpt-realtime"
OPENAI_TRANSCRIPTION_MODEL = "whisper-1"

# 8세 아이용 따뜻한 여성 음성. Task #7에서 다른 voice (shimmer/ballad/sage 등)와
# A/B 후 확정. coral은 비교적 밝고 부드러운 톤. GA에서도 coral 유효.
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
    """Mint an ephemeral client_secret for OpenAI Realtime WebRTC (GA API).

    GA 변경 요약 (Beta → GA):
      - 엔드포인트: /v1/realtime/sessions  →  /v1/realtime/client_secrets
      - Payload 구조: flat  →  { session: { type:"realtime", ... } } 래핑
      - modalities  →  session.output_modalities
      - voice  →  session.audio.output.voice
      - input_audio_transcription  →  session.audio.input.transcription
      - turn_detection  →  session.audio.input.turn_detection
      - 응답: data.client_secret.value  →  data.value (최상위)
    """
    # GA payload: session 필드 안에 type:"realtime" 필수.
    # audio.input.transcription / audio.input.turn_detection 으로 이동.
    # temperature 는 GA에서 더 이상 session 직속 파라미터가 아님 — 제거.
    payload = {
        "session": {
            "type": "realtime",
            "model": OPENAI_REALTIME_MODEL,
            "instructions": prompt.BETH_SYSTEM_PROMPT,
            "output_modalities": ["audio"],   # GA: "text"와 동시 불가 — audio 단독이 기본
            "audio": {
                "output": {
                    "voice": BETH_VOICE,
                },
                "input": {
                    "transcription": {
                        "model": OPENAI_TRANSCRIPTION_MODEL,
                        "language": "ko",
                    },
                    "turn_detection": {
                        "type": "server_vad",
                        "threshold": 0.5,
                        "prefix_padding_ms": 300,
                        "silence_duration_ms": 600,
                    },
                },
            },
        }
    }

    async with httpx.AsyncClient(timeout=OPENAI_REALTIME_TIMEOUT) as client:
        try:
            r = await client.post(
                OPENAI_REALTIME_CLIENT_SECRETS_URL,
                headers=_headers(),
                json=payload,
            )
        except httpx.HTTPError as exc:
            logger.error(f"realtime client_secret: network error: {exc!r}")
            raise HTTPException(status_code=502, detail="OpenAI Realtime unreachable.") from exc

    if r.status_code != 200:
        logger.error(f"realtime client_secret: {r.status_code} {r.text[:300]}")
        raise HTTPException(status_code=r.status_code, detail="Failed to mint ephemeral key.")

    data = r.json()
    # GA 응답: { "value": "ek_...", "expires_at": ..., "session": {...} }
    # Beta 응답이었던 data.client_secret.value 는 더 이상 사용하지 않음.
    key = data.get("value")
    if not key:
        logger.error(f"realtime client_secret: missing value in response: {data}")
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
