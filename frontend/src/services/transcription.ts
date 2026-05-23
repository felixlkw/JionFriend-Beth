// Whisper STT fallback — only used when Realtime audio path is unavailable.

export async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('file', blob, 'audio.webm');
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) return '';
  const data = await res.json();
  return data.text || '';
}
