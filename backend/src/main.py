from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import os

from . import llm

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": "beth", "version": "0.0.1"}


@app.post("/api/webrtc-key")
async def generate_webrtc_key():
    """Mint an OpenAI Realtime ephemeral key with Beth's session config."""
    key = await llm.generate_webrtc_key()
    return {"key": key}


@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Whisper STT fallback when Realtime audio path is unavailable."""
    file_bytes = await file.read()
    return await llm.transcribe_audio(file.filename, file_bytes, file.content_type)


# ---------------------------------------------------------------------------
# Frontend static serving — supports both layouts:
#   dev:    backend/src/main.py -> ../../frontend/dist
#   Docker: /app/src/main.py    -> /app/frontend/dist
# ---------------------------------------------------------------------------
def _resolve_frontend_dist() -> str:
    base = os.path.dirname(__file__)
    for rel in (("..", "..", "frontend", "dist"), ("..", "frontend", "dist")):
        path = os.path.normpath(os.path.join(base, *rel))
        if os.path.isdir(path):
            return path
    return os.path.normpath(os.path.join(base, "..", "..", "frontend", "dist"))


frontend_dist = _resolve_frontend_dist()

if os.path.isdir(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
    logger.info(f"Frontend dist mounted from {frontend_dist}")
else:
    logger.warning(f"Frontend dist not found at {frontend_dist}")


@app.get("/")
async def serve_index():
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path, media_type="text/html")
    raise HTTPException(status_code=404, detail="index.html not found.")


@app.get("/{full_path:path}")
async def serve_spa(_: Request, full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API route not found.")
    file_path = os.path.join(frontend_dist, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path, media_type="text/html")
    raise HTTPException(status_code=404, detail="Not found.")
