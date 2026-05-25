import type { BethStatus } from '../services/webrtc'

type Variant = 'home' | 'voice' | 'sleeping'

interface Props {
  variant: Variant
  status?: BethStatus
  sizePx?: number
}

const RING_BY_STATUS: Record<BethStatus, { color: string; speed: 'slow' | 'fast' } | null> = {
  idle: null,
  connecting: { color: 'bg-m3-primary-container/60', speed: 'slow' },
  listening: { color: 'bg-m3-tertiary/55', speed: 'slow' },
  thinking: { color: 'bg-m3-secondary-fixed/70', speed: 'slow' },
  speaking: { color: 'bg-m3-primary-container/80', speed: 'fast' },
}

export default function BethAvatar({ variant, status = 'idle', sizePx }: Props) {
  const size = sizePx ?? (variant === 'home' ? 220 : 180)
  const ring = variant === 'voice' ? RING_BY_STATUS[status] : null
  const isSleeping = variant === 'sleeping'
  const floatClass = isSleeping
    ? ''
    : variant === 'home' || status === 'idle'
    ? 'animate-float'
    : ''

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {ring && (
        <>
          <span
            className={`absolute inset-0 rounded-full ${ring.color} ${
              ring.speed === 'fast' ? 'animate-pulse-ring-fast' : 'animate-pulse-ring'
            }`}
          />
          <span
            className={`absolute inset-0 rounded-full ${ring.color} ${
              ring.speed === 'fast' ? 'animate-pulse-ring-fast' : 'animate-pulse-ring'
            }`}
            style={{ animationDelay: ring.speed === 'fast' ? '0.55s' : '1.2s' }}
          />
        </>
      )}
      <img
        src="/screen_mm.png"
        alt="Beth"
        draggable={false}
        className={`relative w-full h-full object-contain drop-shadow-[0_18px_22px_rgba(134,77,97,0.22)] transition-all duration-500 ${floatClass} ${
          isSleeping ? 'opacity-70 saturate-50' : ''
        }`}
      />

      {isSleeping && (
        <>
          <span
            className="absolute top-2 right-3 text-m3-tertiary font-display font-bold opacity-65 select-none"
            style={{ fontSize: Math.round(size * 0.13) }}
            aria-hidden
          >
            z z z
          </span>
          <span
            className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-m3-surface/85 backdrop-blur rounded-full pl-1.5 pr-2.5 py-1 shadow-squishy-soft"
            aria-label="마이크가 듣고 있어요"
          >
            <span className="relative flex w-2.5 h-2.5">
              <span className="absolute inset-0 rounded-full bg-m3-secondary-fixed opacity-70 animate-pulse-slow" />
              <span className="relative rounded-full bg-m3-secondary-fixed w-2.5 h-2.5" />
            </span>
            <span className="text-[10px] font-bold text-m3-on-secondary-fixed tracking-wide">
              MIC
            </span>
          </span>
        </>
      )}
    </div>
  )
}
