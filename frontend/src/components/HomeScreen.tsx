import BethAvatar from './BethAvatar'

interface Props {
  onTalk: () => void
}

interface ActionCard {
  icon: string
  label: string
  sub: string
  bg: string
  ring: string
  text: string
  disabled?: boolean
}

const CARDS: ActionCard[] = [
  {
    icon: 'chat_bubble',
    label: "Let's Talk",
    sub: '베스랑 이야기하기',
    bg: 'bg-m3-primary-container',
    ring: 'ring-m3-primary/20',
    text: 'text-m3-on-primary-container',
  },
  {
    icon: 'extension',
    label: 'Play a Game',
    sub: '곧 만나요',
    bg: 'bg-m3-secondary-fixed',
    ring: 'ring-m3-secondary/15',
    text: 'text-m3-on-secondary-fixed',
    disabled: true,
  },
  {
    icon: 'menu_book',
    label: 'Read a Story',
    sub: '곧 만나요',
    bg: 'bg-m3-tertiary-container',
    ring: 'ring-m3-tertiary/15',
    text: 'text-m3-on-tertiary-container',
    disabled: true,
  },
]

export default function HomeScreen({ onTalk }: Props) {
  return (
    <div className="min-h-screen w-full bg-magic-grad px-6 pt-10 pb-14 flex flex-col items-center">
      <header className="text-center">
        <p className="text-m3-tertiary font-display font-semibold tracking-wide text-sm">
          Hi, Jion!
        </p>
        <h1 className="text-m3-primary font-display font-bold text-5xl mt-1">
          Jion's World
        </h1>
        <p className="text-m3-on-surface/70 mt-2 text-base">
          오늘은 베스랑 뭐 할까?
        </p>
      </header>

      <div className="mt-6 mb-2">
        <BethAvatar variant="home" />
      </div>

      <section className="w-full max-w-md mt-4 grid grid-cols-1 gap-4">
        {CARDS.map((c) => (
          <button
            key={c.label}
            onClick={() => {
              if (c.disabled) return
              if (c.label === "Let's Talk") onTalk()
            }}
            disabled={c.disabled}
            className={`group relative ${c.bg} ${c.text} rounded-3xl px-6 py-5 flex items-center gap-4 text-left
              shadow-squishy ring-1 ${c.ring}
              transition-all duration-150 ease-out
              ${c.disabled ? 'opacity-60 cursor-not-allowed' : 'hover:-translate-y-0.5 active:translate-y-1 active:shadow-squishy-active'}`}
          >
            <span className="material-symbols-outlined !text-3xl shrink-0" aria-hidden>
              {c.icon}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-display font-bold text-2xl leading-tight">
                {c.label}
              </span>
              <span className="block text-sm opacity-80 mt-0.5">{c.sub}</span>
            </span>
            {!c.disabled && (
              <span className="material-symbols-outlined opacity-70" aria-hidden>
                arrow_forward
              </span>
            )}
            {c.disabled && (
              <span className="text-xs uppercase tracking-wider font-bold opacity-70 shrink-0">
                Soon
              </span>
            )}
          </button>
        ))}
      </section>

      <section className="w-full max-w-md mt-6 bg-m3-surface/80 backdrop-blur rounded-3xl px-5 py-4 shadow-squishy-soft ring-1 ring-m3-outline/10">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display font-bold text-m3-tertiary text-lg">
            Sticker Book
          </span>
          <span className="material-symbols-outlined text-m3-tertiary opacity-70" aria-hidden>
            auto_awesome
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="aspect-square rounded-2xl bg-m3-surface-variant/60 border-2 border-dashed border-m3-outline/30 flex items-center justify-center text-m3-outline/40"
              aria-label="비어 있는 스티커 자리"
            >
              <span className="material-symbols-outlined text-2xl" aria-hidden>
                add
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-m3-on-surface/50 mt-3 text-center">
          베스랑 이야기하면 스티커가 모여요
        </p>
      </section>
    </div>
  )
}
