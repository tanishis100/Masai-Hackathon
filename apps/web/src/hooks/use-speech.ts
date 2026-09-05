"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

/* The Web Speech API is still vendor-prefixed and absent from lib.dom, so the
   surface we rely on is declared locally rather than pulled from a polyfill. */
interface RecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult:
    | ((e: {
        resultIndex: number
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
      }) => void)
    | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => RecognitionLike

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

function cleanTranscript(value: string) {
  const words = value.replace(/\s+/g, " ").trim().split(" ")
  const deduped = words.filter((word, index) => index === 0 || word.toLowerCase() !== words[index - 1]?.toLowerCase())
  const sentence = deduped.join(" ").replace(/\bi\b/g, "I").trim()
  if (!sentence) return ""
  const capitalized = `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}`
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`
}

/** Continuous dictation that appends final chunks and exposes the interim tail. */
export function useDictation(onFinalChunk: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState("")
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<RecognitionLike | null>(null)
  const wanted = useRef(false)
  const restartTimer = useRef<number | null>(null)
  const cb = useRef(onFinalChunk)

  // Written in an effect rather than during render, so a concurrent re-render
  // that never commits cannot leave the ref pointing at a stale callback.
  useEffect(() => {
    cb.current = onFinalChunk
  }, [onFinalChunk])

  const supported = useSyncExternalStore(
    () => () => {},
    () => getRecognitionCtor() !== null,
    () => false,
  )

  const stop = useCallback(() => {
    wanted.current = false
    if (restartTimer.current !== null) window.clearTimeout(restartTimer.current)
    restartTimer.current = null
    ref.current?.stop()
    setListening(false)
    setInterim("")
  }, [])

  const start = useCallback(() => {
    if (wanted.current) return
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      setError("Live captions are not supported by this browser. Open the app in Chrome or Edge and allow microphone access.")
      return
    }
    setError(null)
    wanted.current = true

    const beginSession = () => {
      if (!wanted.current) return
      const rec = new Ctor()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = "en-US"

      rec.onresult = (e) => {
        let tail = ""
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i]
          if (!result) continue
          const text = result[0]?.transcript ?? ""
          if (result.isFinal) cb.current(cleanTranscript(text))
          else tail += text
        }
        setError(null)
        setInterim(tail)
      }

      rec.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setError("Microphone access is blocked. Allow microphone access in your browser, then tap the mic icon.")
          wanted.current = false
          setListening(false)
        } else if (e.error === "audio-capture") {
          setError("No microphone input is available. Check your selected microphone, then tap the mic icon.")
          wanted.current = false
          setListening(false)
        }
        // "network", "no-speech", and "aborted" end events are recovered by
        // creating a fresh recognition session below.
      }

      rec.onend = () => {
        if (ref.current !== rec) return
        setInterim("")
        if (!wanted.current) {
          setListening(false)
          return
        }
        restartTimer.current = window.setTimeout(beginSession, 250)
      }

      ref.current = rec
      try {
        rec.start()
        setListening(true)
      } catch {
        restartTimer.current = window.setTimeout(beginSession, 250)
      }
    }

    beginSession()
  }, [])

  useEffect(() => {
    return () => {
      wanted.current = false
      if (restartTimer.current !== null) window.clearTimeout(restartTimer.current)
      ref.current?.abort()
    }
  }, [])

  return { listening, interim, supported, error, start, stop }
}

/** Speaks the interviewer's question so the round feels like a real call. */
export function useSpeaker() {
  const [speaking, setSpeaking] = useState(false)
  const [enabled, setEnabled] = useState(true)

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    (text: string, onComplete?: () => void) => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        onComplete?.()
        return
      }
      if (!enabled) {
        onComplete?.()
        return
      }
      window.speechSynthesis.cancel()

      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1.02
      u.pitch = 1
      const voice = window.speechSynthesis
        .getVoices()
        .find((v) => /en-(US|GB)/.test(v.lang) && /google|samantha|daniel/i.test(v.name))
      if (voice) u.voice = voice
      u.onend = () => {
        setSpeaking(false)
        onComplete?.()
      }
      u.onerror = () => {
        setSpeaking(false)
        onComplete?.()
      }
      setSpeaking(true)
      window.speechSynthesis.speak(u)
    },
    [enabled],
  )

  useEffect(() => cancel, [cancel])

  return { speak, cancel, speaking, enabled, setEnabled }
}
