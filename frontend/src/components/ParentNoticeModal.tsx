interface Props {
  onClose: () => void
}

export default function ParentNoticeModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/35 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="parent-notice-title"
    >
      <div className="w-full max-w-sm bg-m3-surface rounded-3xl shadow-squishy p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-m3-tertiary" aria-hidden>info</span>
          <h2
            id="parent-notice-title"
            className="font-display font-bold text-m3-primary text-lg"
          >
            부모님께
          </h2>
        </div>
        <div className="space-y-3 text-sm text-m3-on-surface/85 leading-relaxed">
          <p>
            "End"를 누르면 베스는 대화는 멈추지만, "베스야" 라고 부르면 다시 깨어나도록
            <b className="text-m3-primary"> 마이크는 켜진 상태</b>로 둡니다.
          </p>
          <p>
            대기 중 음성은 <b className="text-m3-primary">브라우저 안에서만 처리</b>되고
            베스 서버나 외부로 전송되지 않습니다.
          </p>
          <p>
            완전히 끄려면 화면 아래 <b>"베스 재우기"</b> 버튼을 눌러주세요.
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-2xl bg-m3-primary text-white font-display font-bold
            shadow-squishy hover:-translate-y-0.5 active:translate-y-1 active:shadow-squishy-active transition-all"
        >
          알겠어요
        </button>
      </div>
    </div>
  )
}
