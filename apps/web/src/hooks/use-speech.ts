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

/** Continuous dictation that appends final chunks and exposes the interim tail. */
export function useDictation(onFinalChunk: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState("")
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<RecognitionLike | null>(null)
  const wanted = useRef(false)
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
    ref.current?.stop()
    setListening(false)
    setInterim("")
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    setError(null)

    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = "en-US"

    rec.onresult = (e) => {
      let tail = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (!r) continue
        const text = r[0]?.transcript ?? ""
        if (r.isFinal) cb.current(text)
        else tail += text
      }
      setInterim(tail)
    }

    rec.onerror = (e) => {
      if (e.error === "not-allowed") {
        setError("Microphone blocked. Allow mic access, or just type your answer.")
        wanted.current = false
        setListening(false)
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setError(`Mic error: ${e.error}`)
      }
    }

    // Chrome ends the session every few seconds of silence; restart while wanted.
    rec.onend = () => {
      if (wanted.current) {
        try {
          rec.start()
        } catch {
          setListening(false)
        }
      } else {
        setListening(false)
      }
    }

    ref.current = rec
    wanted.current = true
    try {
      rec.start()
      setListening(true)
    } catch {
      setError("Could not start the microphone.")
    }
  }, [])

  useEffect(() => {
    return () => {
      wanted.current = false
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
    (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return
      if (!enabled) return
      window.speechSynthesis.cancel()

      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1.02
      u.pitch = 1
      const voice = window.speechSynthesis
        .getVoices()
        .find((v) => /en-(US|GB)/.test(v.lang) && /google|samantha|daniel/i.test(v.name))
      if (voice) u.voice = voice
      u.onend = () => setSpeaking(false)
      u.onerror = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(u)
    },
    [enabled],
  )

  useEffect(() => cancel, [cancel])

  return { speak, cancel, speaking, enabled, setEnabled }
}
