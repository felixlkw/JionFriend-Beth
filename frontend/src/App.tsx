import { useEffect, useRef, useState } from 'react'
import { BethSession, type BethStatus, type TranscriptEntry } from './services/webrtc'
import { WakeWordListener, isWakeWordSupported } from './services/wakeWord'
import HomeScreen from './components/HomeScreen'
import VoiceScreen from './components/VoiceScreen'
import ParentNoticeModal from './components/ParentNoticeModal'

type Screen = 'home' | 'voice'
type Mode = 'live' | 'standby'

const PARENT_NOTICE_KEY = 'beth-wake-notice-seen-v1'
const WAKE_REPLY_TIMEOUT_MS = 12000

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [mode, setMode] = useState<Mode>('live')
  const [status, setStatus] = useState<BethStatus>('idle')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [showParentNotice, setShowParentNotice] = useState(false)

  const sessionRef = useRef<BethSession | null>(null)
  const wakeRef = useRef<WakeWordListener | null>(null)
  const audioElRef = useRef<HTMLAudioElement>(null)
  const cameFromWakeRef = useRef(false)
  const fallbackTimerRef = useRef<number | null>(null)

  function clearFallbackTimer() {
    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
  }

  async function startSession() {
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

  function stopSession() {
    sessionRef.current?.stop()
    sessionRef.current = null
    setStatus('idle')
  }

  function startWakeListener() {
    if (wakeRef.current) return
    if (!isWakeWordSupported()) {
      console.warn('Web Speech API not supported — wake word disabled.')
      return
    }
    const listener = new WakeWordListener({
      onWake: () => {
        handleWakeDetected()
      },
      onError: (err) => {
        console.warn('Wake listener error', err)
      },
    })
    wakeRef.current = listener
    listener.start()
  }

  function stopWakeListener() {
    wakeRef.current?.stop()
    wakeRef.current = null
  }

  function handleTalk() {
    cameFromWakeRef.current = false
    clearFallbackTimer()
    setScreen('voice')
    setMode('live')
    void startSession()
  }

  function handleEnd() {
    clearFallbackTimer()
    cameFromWakeRef.current = false
    stopSession()
    setMode('standby')
    startWakeListener()
    if (!localStorage.getItem(PARENT_NOTICE_KEY)) {
      setShowParentNotice(true)
    }
  }

  function handleSleep() {
    clearFallbackTimer()
    cameFromWakeRef.current = false
    stopWakeListener()
    stopSession()
    setMode('live')
    setScreen('home')
    setTranscript([])
  }

  function handleBackHome() {
    clearFallbackTimer()
    cameFromWakeRef.current = false
    stopWakeListener()
    stopSession()
    setMode('live')
    setScreen('home')
    setTranscript([])
  }

  function handleWakeDetected() {
    stopWakeListener()
    cameFromWakeRef.current = true
    setMode('live')
    void startSession()
  }

  function handleWakeManual() {
    stopWakeListener()
    cameFromWakeRef.current = false
    setMode('live')
    void startSession()
  }

  function dismissParentNotice() {
    localStorage.setItem(PARENT_NOTICE_KEY, '1')
    setShowParentNotice(false)
  }

  useEffect(() => {
    if (mode !== 'live' || !cameFromWakeRef.current) {
      clearFallbackTimer()
      return
    }
    if (transcript.some((e) => e.who === 'jion')) {
      cameFromWakeRef.current = false
      clearFallbackTimer()
      return
    }
    clearFallbackTimer()
    fallbackTimerRef.current = window.setTimeout(() => {
      fallbackTimerRef.current = null
      if (cameFromWakeRef.current) handleEnd()
    }, WAKE_REPLY_TIMEOUT_MS)
    return clearFallbackTimer
  }, [mode, transcript])

  useEffect(() => {
    return () => {
      clearFallbackTimer()
      stopWakeListener()
      stopSession()
    }
  }, [])

  return (
    <>
      {screen === 'home' ? (
        <HomeScreen onTalk={handleTalk} />
      ) : (
        <VoiceScreen
          status={status}
          transcript={transcript}
          isStandby={mode === 'standby'}
          onStart={startSession}
          onStop={stopSession}
          onBack={handleBackHome}
          onSleep={handleSleep}
          onWakeManual={handleWakeManual}
        />
      )}
      {showParentNotice && <ParentNoticeModal onClose={dismissParentNotice} />}
      <audio ref={audioElRef} autoPlay />
    </>
  )
}
