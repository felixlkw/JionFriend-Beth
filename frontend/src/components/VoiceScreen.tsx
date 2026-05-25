import { useEffect, useRef } from 'react'
import BethAvatar from './BethAvatar'
import type { BethStatus, TranscriptEntry } from '../services/webrtc'

interface Props {
  status: BethStatus
  transcript: TranscriptEntry[]
  isStandby: boolean
  onStart: () => void
  onStop: () => void
  onBack: () => void
  onSleep: () => void
  onWakeManual: () => void
}

const STATUS_KO: Record<BethStatus, string> = {
  idle: '버튼을 눌러서 베스랑 이야기해요',
  connecting: '베스가 깨어나고 있어요...',
  listening: '베스가 듣고 있어요',
  thinking: '베스가 생각 중이에요',
  speaking: '베스가 이야기하고 있어요',
}

export default function VoiceScreen({
  status,
  transcript,
  isStandby,
  onStart,
  onStop,
  onBack,
  onSleep,
  onWakeManual,
}: Props) {
  const isActive = !isStandby && status !== 'idle'
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [transcript])

  function handleMainPress() {
    if (isActive) onStop()
    else onStart()
  }

  function handleEnd() {
    if (isActive) onStop()
    onBack()
  }

  return (
    <div className="min-h-screen w-full bg-magic-grad-warm flex flex-col">
      <header className="px-5 pt-6 pb-2 flex items-center gap-2">
        <button
          onClick={onBack}
          aria-label="홈으로 돌아가기"
          className="w-11 h-11 rounded-full bg-m3-surface/80 backdrop-blur text-m3-primary
            shadow-squishy-soft flex items-center justify-center
            hover:-translate-y-0.5 active:translate-y-0.5 transition-all"
        >
          <span className="material-symbols-outlined" aria-hidden>arrow_back</span>
        </button>
        <h1 className="flex-1 text-center font-display font-bold text-m3-primary text-xl pr-11">
          Chatting with Jion
        </h1>
      </header>

      {isStandby && (
        <div className="mx-auto mt-1 mb-2 px-3 py-1.5 rounded-full bg-m3-surface/85 backdrop-blur
          flex items-center gap-2 shadow-squishy-soft" aria-live="polite">
          <span className="material-symbols-outlined !text-base text-m3-secondary" aria-hidden>
            mic
          </span>
          <span className="text-sm font-semibold text-m3-on-surface/80">
            마이크가 켜져 있어요 · 음성은 베스 서버로 안 가요
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 min-h-0">
        {isStandby ? (
          <button
            onClick={onWakeManual}
            aria-label="베스 깨우기"
            className="rounded-full focus:outline-none focus:ring-4 focus:ring-m3-tertiary/30"
          >
            <BethAvatar variant="sleeping" sizePx={200} />
          </button>
        ) : (
          <BethAvatar variant="voice" status={status} sizePx={200} />
        )}
        <p className="text-m3-on-primary-container font-display font-semibold text-lg text-center min-h-[1.75rem] max-w-xs">
          {isStandby
            ? "베스가 자고 있어요. '베스야' 하고 부르면 깨어나"
            : STATUS_KO[status]}
        </p>
      </div>

      {!isStandby && (
        <div
          ref={scrollRef}
          className="w-full max-w-xl mx-auto px-5 max-h-[28vh] overflow-y-auto space-y-2 mb-2"
        >
          {transcript.map((entry, i) => (
            <div
              key={i}
              className={`text-base leading-relaxed px-4 py-2 rounded-2xl ${
                entry.who === 'beth'
                  ? 'bg-m3-surface/85 text-m3-primary mr-8 shadow-squishy-soft'
                  : 'bg-m3-primary-container/80 text-m3-on-primary-container ml-8 text-right shadow-squishy-soft'
              }`}
            >
              <span className="font-bold mr-1">
                {entry.who === 'beth' ? 'Beth' : 'Jion'}:
              </span>
              {entry.text}
            </div>
          ))}
        </div>
      )}

      <div className="px-6 pb-10 pt-2 flex items-center justify-center gap-6">
        {isStandby ? (
          <button
            onClick={onSleep}
            className="px-8 py-4 rounded-3xl bg-m3-tertiary text-white font-display font-bold text-lg
              shadow-squishy flex items-center gap-2
              hover:-translate-y-0.5 active:translate-y-1 active:shadow-squishy-active transition-all"
            aria-label="베스 재우고 홈으로 가기"
          >
            <span className="material-symbols-outlined" aria-hidden>bedtime</span>
            베스 재우기
          </button>
        ) : (
          <>
            <button
              onClick={handleEnd}
              className="w-16 h-16 rounded-full bg-m3-surface/85 text-m3-primary shadow-squishy
                flex flex-col items-center justify-center gap-0.5
                hover:-translate-y-0.5 active:translate-y-1 active:shadow-squishy-active transition-all"
              aria-label="대화 끝내고 대기 모드로"
            >
              <span className="material-symbols-outlined !text-2xl" aria-hidden>pause</span>
              <span className="text-[10px] font-bold tracking-wide">End</span>
            </button>

            <button
              onClick={handleMainPress}
              aria-label={isActive ? '대화 잠시 멈추기' : '대화 시작하기'}
              className={`w-24 h-24 rounded-full shadow-squishy flex items-center justify-center text-white
                transition-all duration-200
                hover:-translate-y-1 active:translate-y-1 active:shadow-squishy-active
                ${isActive ? 'bg-m3-tertiary animate-wiggle' : 'bg-m3-primary'}`}
            >
              <span className="material-symbols-outlined !text-5xl" aria-hidden>
                {isActive ? 'graphic_eq' : 'mic'}
              </span>
            </button>

            <button
              disabled
              className="w-16 h-16 rounded-full bg-m3-surface/55 text-m3-tertiary/60 shadow-squishy-soft
                flex flex-col items-center justify-center gap-0.5 cursor-not-allowed"
              aria-label="선물 (곧 만나요)"
            >
              <span className="material-symbols-outlined !text-2xl" aria-hidden>card_giftcard</span>
              <span className="text-[10px] font-bold tracking-wide">Gift</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
