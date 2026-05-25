// Wake word listener — 브라우저 Web Speech API 기반.
// "베스야"/"hey beth" 등을 듣고 onWake 콜백을 호출.
// 오디오는 브라우저 내부 STT만 사용하며 OpenAI 서버로 전송되지 않음.

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string; confidence: number }
  }>
  resultIndex: number
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onend: ((ev: Event) => void) | null
  onerror: ((ev: Event) => void) | null
  onstart: ((ev: Event) => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
}

const WAKE_PATTERN = /(베스야|베스 안녕|헤이\s?베스|hey\s?beth|hi\s?beth)/i

export type WakeStatus = 'inactive' | 'starting' | 'listening' | 'unsupported' | 'error'

export interface WakeWordOptions {
  onWake: (matchedText: string) => void
  onStatusChange?: (status: WakeStatus) => void
  onError?: (err: Error) => void
}

export function isWakeWordSupported(): boolean {
  return typeof window !== 'undefined' &&
    (window.SpeechRecognition !== undefined || window.webkitSpeechRecognition !== undefined)
}

export class WakeWordListener {
  private recognition: SpeechRecognitionInstance | null = null
  private opts: WakeWordOptions
  private wantRunning = false
  private restartTimer: number | null = null

  constructor(opts: WakeWordOptions) {
    this.opts = opts
  }

  start(): void {
    if (this.wantRunning) return
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!Ctor) {
      this.opts.onStatusChange?.('unsupported')
      return
    }
    this.wantRunning = true
    this.opts.onStatusChange?.('starting')
    this.spawn(Ctor)
  }

  stop(): void {
    this.wantRunning = false
    if (this.restartTimer !== null) {
      window.clearTimeout(this.restartTimer)
      this.restartTimer = null
    }
    if (this.recognition) {
      try { this.recognition.abort() } catch { /* noop */ }
      this.recognition = null
    }
    this.opts.onStatusChange?.('inactive')
  }

  private spawn(Ctor: SpeechRecognitionCtor): void {
    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'ko-KR'
    rec.maxAlternatives = 2

    rec.onstart = () => {
      this.opts.onStatusChange?.('listening')
    }

    rec.onresult = (ev) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i]
        if (!res) continue
        const text = res[0]?.transcript ?? ''
        if (WAKE_PATTERN.test(text)) {
          this.wantRunning = false
          try { rec.abort() } catch { /* noop */ }
          this.recognition = null
          this.opts.onStatusChange?.('inactive')
          this.opts.onWake(text.trim())
          return
        }
      }
    }

    rec.onerror = (ev) => {
      const errType = (ev as unknown as { error?: string }).error ?? 'unknown'
      // 'no-speech', 'aborted' 등은 정상 재시작 케이스로 처리.
      if (errType !== 'no-speech' && errType !== 'aborted' && errType !== 'audio-capture') {
        this.opts.onStatusChange?.('error')
        this.opts.onError?.(new Error(`wake word error: ${errType}`))
      }
    }

    rec.onend = () => {
      this.recognition = null
      if (!this.wantRunning) return
      this.restartTimer = window.setTimeout(() => {
        this.restartTimer = null
        if (this.wantRunning) this.spawn(Ctor)
      }, 350)
    }

    this.recognition = rec
    try {
      rec.start()
    } catch (err) {
      this.opts.onError?.(err instanceof Error ? err : new Error(String(err)))
      this.opts.onStatusChange?.('error')
    }
  }
}
