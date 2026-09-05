"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"

import { useDictation, useSpeaker } from "@/hooks/use-speech"
import type { Answer, Question } from "@/lib/types"

const TOTAL_QUESTIONS = 5

function clock(total: number) {
  const minutes = Math.floor(total / 60).toString().padStart(2, "0")
  const seconds = (total % 60).toString().padStart(2, "0")
  return `${minutes}:${seconds}`
}

function Wave({ active }: { active: boolean }) {
  return (
    <span className="flex h-4 items-center gap-0.5" aria-hidden="true">
      {[0, 1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={`w-0.5 rounded-full bg-current ${active ? "animate-pulse" : "h-1.5"}`}
          style={active ? { height: `${8 + ((bar + 1) % 3) * 4}px`, animationDelay: `${bar * 90}ms` } : undefined}
        />
      ))}
    </span>
  )
}

function CameraIcon({ off = false }: { off?: boolean }) {
  return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true"><path d="M3 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3z" /><path d="m16 10 5-3v10l-5-3z" />{off ? <path d="M3 3 21 21" /> : null}</svg>
}

function AudioIcon({ muted = false }: { muted?: boolean }) {
  return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4z" />{muted ? <path d="M17 9l4 6m0-6-4 6" /> : <path d="M17 9a4 4 0 0 1 0 6M20 6a8 8 0 0 1 0 12" />}</svg>
}

function MicIcon({ active }: { active: boolean }) {
  return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" />{active ? <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /> : <path d="M4 4 20 20M6 11a6 6 0 0 0 9.5 4.9" />}</svg>
}

export function InterviewScreen({
  roleTitle,
  company,
  interviewer,
  interviewerRole,
  technicalInterviewer,
  technicalInterviewerRole,
  candidateName,
  questions,
  onNextQuestion,
  onFinish,
  onAbort,
}: {
  roleTitle: string
  company: string
  interviewer: string
  interviewerRole: string
  technicalInterviewer: string
  technicalInterviewerRole: string
  candidateName: string
  questions: Question[]
  onNextQuestion: (answers: Answer[]) => Promise<Question>
  onFinish: (answers: Answer[]) => void
  onAbort: () => void
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [text, setText] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const [questionStart, setQuestionStart] = useState(0)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const current = questions[index]
  const technicalQuestion = current?.kind === "technical" || current?.kind === "system-design"
  const { speak, cancel, speaking, enabled, setEnabled } = useSpeaker()
  const appendFinal = useCallback((chunk: string) => {
    setText((previous) => (previous ? `${previous.trimEnd()} ${chunk.trim()}` : chunk.trim()))
  }, [])
  const mic = useDictation(appendFinal)

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let mounted = true
    async function connectCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access is not available in this browser.")
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        })
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        if (mounted) setCameraError("Camera and microphone access is unavailable. You can still complete the interview by typing.")
      }
    }
    void connectCamera()
    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!current) return
    let resumed = false
    const resumeMic = () => {
      if (resumed) return
      resumed = true
      mic.start()
    }

    // Pause recognition only while the interviewer is speaking, then resume it
    // automatically so the mic stays active for every candidate response.
    mic.stop()
    speak(current.text, resumeMic)
    // Some browser voices do not emit an end event. Do not leave captions
    // disabled if that happens; questions are intentionally short.
    const fallbackStart = window.setTimeout(resumeMic, 7_000)
    return () => {
      resumed = true
      window.clearTimeout(fallbackStart)
    }
    // A new Gemini question is the only event that should trigger a spoken prompt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current?.id])

  async function submitAnswer() {
    if (!current || loadingQuestion) return
    const answer: Answer = {
      questionId: current.id,
      text: text.trim(),
      seconds: Math.max(0, elapsed - questionStart),
    }
    const nextAnswers = [...answers, answer]
    setAnswers(nextAnswers)
    setText("")
    cancel()

    if (index === TOTAL_QUESTIONS - 1) {
      mic.stop()
      onFinish(nextAnswers)
      return
    }

    setLoadingQuestion(true)
    try {
      await onNextQuestion(nextAnswers)
      setQuestionStart(elapsed)
      setIndex((value) => value + 1)
    } catch {
      setText(answer.text)
      setAnswers(answers)
    } finally {
      setLoadingQuestion(false)
    }
  }

  if (!current) return null

  return (
    <main className="min-h-screen bg-[#171819] p-3 text-white sm:p-5">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1500px] flex-col">
        <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 py-2 sm:py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold sm:text-base">{roleTitle || "Live interview"}</p>
            <p className="truncate text-xs text-white/55">{company || "Gemini interview panel"}</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-sm tabular-nums text-white/75">{clock(elapsed)}</p>
            <p className="mt-1 text-xs font-semibold text-white/65">Question {index + 1} / {TOTAL_QUESTIONS}</p>
          </div>
          <div className="flex justify-end"><button onClick={onAbort} className="rounded-full bg-red-500/90 px-3 py-2 text-xs font-semibold hover:bg-red-500 sm:px-4">End call</button></div>
        </header>

        <div className="mx-auto mb-3 flex w-full max-w-xl gap-1.5" aria-label={`Interview progress: question ${index + 1} of ${TOTAL_QUESTIONS}`}>
          {Array.from({ length: TOTAL_QUESTIONS }, (_, item) => <span key={item} className={`h-1 flex-1 rounded-full ${item < index ? "bg-emerald-400" : item === index ? "bg-white" : "bg-white/20"}`} />)}
        </div>

        <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-3">
          <div className={`relative min-h-64 overflow-hidden rounded-lg bg-[#303134] md:min-h-0 ${speaking && !technicalQuestion ? "ring-2 ring-emerald-400" : ""}`}>
            <Image src="/interviewer-profile.png" alt={interviewer} fill priority className="object-cover object-center" sizes="(min-width: 1024px) 70vw, 100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-3 py-2 text-xs backdrop-blur">
              <div className="flex items-center gap-2"><span>{interviewer} ({interviewerRole})</span>{speaking && !technicalQuestion ? <span className="flex items-center gap-1.5 rounded-full bg-emerald-400 px-2 py-1 text-xs text-neutral-950"><Wave active />Speaking</span> : null}</div>
              {!technicalQuestion ? <p className="mt-1 line-clamp-3 leading-5 text-white/90">{current.text}</p> : null}
            </div>
          </div>

          <div className={`relative min-h-64 overflow-hidden rounded-lg bg-[#303134] md:min-h-0 ${mic.listening ? "ring-2 ring-sky-400" : ""}`}>
            {cameraEnabled && !cameraError ? <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-white/60">Camera off</div>}
            <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-3 py-2 text-xs backdrop-blur"><div className="flex items-center justify-between"><span>{candidateName} ({roleTitle || "Candidate"})</span>{mic.listening ? <span className="flex items-center gap-1.5 text-sky-300"><Wave active />Speaking</span> : <span className="text-white/55">Mic paused</span>}</div>{text || mic.interim ? <p className="mt-1 line-clamp-2 leading-5 text-white/90">{text}{mic.interim ? `${text ? " " : ""}${mic.interim}` : ""}</p> : null}</div>
          </div>
          <div className={`relative min-h-64 overflow-hidden rounded-lg bg-[#303134] md:min-h-0 ${speaking && technicalQuestion ? "ring-2 ring-emerald-400" : ""}`}>
            <Image src="/interviewer-sana.png" alt="Technical interviewer" fill className="object-cover" sizes="(min-width: 768px) 33vw, 100vw" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/55 px-3 py-2 text-xs backdrop-blur"><div className="flex items-center gap-2"><span>{technicalInterviewer} ({technicalInterviewerRole})</span>{speaking && technicalQuestion ? <span className="flex items-center gap-1.5 rounded-full bg-emerald-400 px-2 py-1 text-xs text-neutral-950"><Wave active />Speaking</span> : null}</div>{technicalQuestion ? <p className="mt-1 line-clamp-3 leading-5 text-white/90">{current.text}</p> : null}</div>
          </div>
        </section>

        <section className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="rounded-lg bg-[#252627] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wide text-white/50">{candidateName}&apos;s live caption</p><span className={`flex items-center gap-1.5 text-xs ${mic.listening ? "text-sky-300" : "text-white/45"}`}>{mic.listening ? <><Wave active />Listening</> : "Microphone paused"}</span></div>
            <textarea value={text + (mic.interim ? `${text ? " " : ""}${mic.interim}` : "")} onChange={(event) => setText(event.target.value)} rows={3} maxLength={600} placeholder="Your speech will appear here live." className="mt-3 w-full resize-none rounded-md bg-white/5 px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-white/35 focus:bg-white/10" />
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-[#252627] p-3">
            <div className="flex items-center gap-2">
              <button onClick={mic.listening ? mic.stop : mic.start} title={mic.listening ? "Pause microphone" : "Start microphone"} className={`flex h-11 w-11 items-center justify-center rounded-full ${mic.listening ? "bg-sky-500 text-white" : "bg-white/15 hover:bg-white/25"}`} aria-label={mic.listening ? "Pause microphone" : "Start microphone"}><MicIcon active={mic.listening} /></button>
              <button onClick={() => setCameraEnabled((value) => !value)} title={cameraEnabled ? "Turn camera off" : "Turn camera on"} className={`flex h-11 w-11 items-center justify-center rounded-full ${cameraEnabled ? "bg-white/15 hover:bg-white/25" : "bg-red-500/80"}`} aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}><CameraIcon off={!cameraEnabled} /></button>
              <button onClick={() => { setEnabled(!enabled); if (enabled) cancel() }} title={enabled ? "Mute interviewer audio" : "Unmute interviewer audio"} className={`flex h-11 w-11 items-center justify-center rounded-full ${enabled ? "bg-white/15 hover:bg-white/25" : "bg-red-500/80"}`} aria-label={enabled ? "Mute interviewer audio" : "Unmute interviewer audio"}><AudioIcon muted={!enabled} /></button>
            </div>
            <button onClick={() => void submitAnswer()} disabled={loadingQuestion} className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60">{loadingQuestion ? "Preparing follow-up..." : index === TOTAL_QUESTIONS - 1 ? "Finish interview" : "Next question"}</button>
          </div>
        </section>
        {mic.error || cameraError ? <p className="mt-2 text-center text-xs text-amber-300">{mic.error ?? cameraError}</p> : null}
      </div>
    </main>
  )
}
