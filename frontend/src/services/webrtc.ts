// Beth Realtime WebRTC session — single-purpose wrapper around
// OpenAI Realtime API for one streaming voice conversation with Beth.

export type BethStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking';

export type TranscriptEntry = {
  who: 'beth' | 'jion';
  text: string;
};

export interface BethSessionOptions {
  onStatusChange?: (status: BethStatus) => void;
  onTranscript?: (entry: TranscriptEntry) => void;
  onError?: (err: Error) => void;
}

async function getEphemeralKey(): Promise<string> {
  const res = await fetch('/api/webrtc-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) {
    throw new Error(`Failed to mint ephemeral key (${res.status})`);
  }
  const { key } = await res.json();
  return key;
}

export class BethSession {
  private conn: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioStream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private opts: BethSessionOptions;
  private currentBethTranscript = '';

  constructor(opts: BethSessionOptions = {}) {
    this.opts = opts;
  }

  async start(audioEl: HTMLAudioElement): Promise<void> {
    this.opts.onStatusChange?.('connecting');
    this.audioEl = audioEl;

    try {
      this.conn = new RTCPeerConnection();

      this.conn.ontrack = (e) => {
        if (this.audioEl) this.audioEl.srcObject = e.streams[0];
      };

      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioStream.getTracks().forEach((t) => this.conn!.addTrack(t, this.audioStream!));

      this.dataChannel = this.conn.createDataChannel('oai-events');
      this.dataChannel.onmessage = (e) => this.handleEvent(JSON.parse(e.data));
      this.dataChannel.onopen = () => {
        this.opts.onStatusChange?.('listening');
        // Trigger Beth's first greeting so she speaks first.
        this.send({
          type: 'response.create',
          response: { modalities: ['audio', 'text'] },
        });
      };

      const offer = await this.conn.createOffer();
      await this.conn.setLocalDescription(offer);

      const key = await getEphemeralKey();
      const sdpRes = await fetch('https://api.openai.com/v1/realtime', {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/sdp',
        },
      });
      if (!sdpRes.ok) {
        throw new Error(`Realtime SDP exchange failed (${sdpRes.status})`);
      }
      const answer: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: await sdpRes.text(),
      };
      await this.conn.setRemoteDescription(answer);
    } catch (err) {
      this.opts.onError?.(err instanceof Error ? err : new Error(String(err)));
      this.stop();
      throw err;
    }
  }

  private handleEvent(evt: { type: string; [k: string]: unknown }): void {
    switch (evt.type) {
      case 'input_audio_buffer.speech_started':
        this.opts.onStatusChange?.('listening');
        break;
      case 'conversation.item.input_audio_transcription.completed': {
        const transcript = (evt.transcript as string | undefined) || '';
        if (transcript.trim()) {
          this.opts.onTranscript?.({ who: 'jion', text: transcript });
        }
        break;
      }
      case 'response.created':
        this.opts.onStatusChange?.('thinking');
        this.currentBethTranscript = '';
        break;
      case 'response.audio.delta':
      case 'response.output_audio.delta':
        this.opts.onStatusChange?.('speaking');
        break;
      case 'response.audio_transcript.delta':
      case 'response.output_audio_transcript.delta':
        this.currentBethTranscript += (evt.delta as string | undefined) || '';
        break;
      case 'response.audio_transcript.done':
      case 'response.output_audio_transcript.done':
        if (this.currentBethTranscript.trim()) {
          this.opts.onTranscript?.({ who: 'beth', text: this.currentBethTranscript });
        }
        break;
      case 'response.done':
        this.opts.onStatusChange?.('listening');
        break;
    }
  }

  private send(event: object): void {
    if (this.dataChannel?.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(event));
    }
  }

  stop(): void {
    try {
      this.dataChannel?.close();
    } catch { /* noop */ }
    try {
      this.conn?.close();
    } catch { /* noop */ }
    this.audioStream?.getTracks().forEach((t) => t.stop());
    if (this.audioEl) this.audioEl.srcObject = null;
    this.conn = null;
    this.dataChannel = null;
    this.audioStream = null;
    this.opts.onStatusChange?.('idle');
  }
}
