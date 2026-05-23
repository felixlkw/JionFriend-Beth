import { useState, useRef } from 'react'
import { BethSession, type BethStatus, type TranscriptEntry } from './services/webrtc'

const STATUS_TEXT: Record<BethStatus, string> = {
  idle: '동그라미를 눌러서 베스랑 이야기해요',
  connecting: '베스가 깨어나고 있어요...',
  listening: '베스가 듣고 있어요',
  thinking: '베스가 생각 중이에요',
  speaking: '베스가 이야기하고 있어요',
}

export default function App() {
  const [status, setStatus] = useState<BethStatus>('idle')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const sessionRef = useRef<BethSession | null>(null)
  const audioElRef = useRef<HTMLAudioElement>(null)

  async function handleStart() {
    if (sessionRef.current) return
    const session = new BethSession({
      onStatusChange: setStatus,
      onTranscript: (entry) => setTranscript((prev) => [...prev, entry]),
      onError: (err) => {
        console.error('Beth session error', err)
      },
    })
    sessionRef.current = session
    try {
      await session.start(audioElRef.current!)
    } catch {
      sessionRef.current = null
    }
  }

  function handleStop() {
    sessionRef.current?.stop()
    sessionRef.current = null
  }

  const isActive = status !== 'idle'

  const circleClass = (() => {
    switch (status) {
      case 'speaking':
        return 'animate-pulse-fast bg-beth-pink'
      case 'listening':
        return 'animate-pulse-slow bg-beth-lavender'
      case 'thinking':
        return 'animate-pulse-slow bg-beth-sky'
      case 'connecting':
        return 'animate-pulse-slow bg-beth-lavender opacity-70'
      default:
        return 'bg-beth-pink hover:scale-105'
    }
  })()

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-gradient-to-br from-beth-pink-light via-beth-lavender-light to-beth-sky-light">
      <header className="pt-2 text-center">
        <h1 className="text-5xl font-display text-beth-purple">Beth</h1>
        <p className="text-beth-purple-soft text-sm mt-1">지온이의 친구</p>
      </header>

      <main className="flex flex-col items-center gap-6 flex-1 justify-center">
        <button
          onClick={isActive ? handleStop : handleStart}
          className={`w-60 h-60 rounded-full transition-all duration-500 ease-out shadow-xl flex items-center justify-center text-white text-2xl font-bold ${circleClass}`}
          aria-label={isActive ? '이야기 끝내기' : '이야기 시작하기'}
        >
          {isActive ? '끝내기' : '시작'}
        </button>
        <p className="text-beth-purple text-base">{STATUS_TEXT[status]}</p>
      </main>

      <section className="w-full max-w-md max-h-48 overflow-y-auto space-y-2 pb-4 px-2">
        {transcript.map((entry, i) => (
          <div
            key={i}
            className={`text-sm leading-relaxed ${
              entry.who === 'beth'
                ? 'text-beth-purple'
                : 'text-beth-ink text-right'
            }`}
          >
            <span className="font-semibold">{entry.who === 'beth' ? '베스: ' : '지온: '}</span>
            {entry.text}
          </div>
        ))}
      </section>

      <audio ref={audioElRef} autoPlay />
    </div>
  )
}
