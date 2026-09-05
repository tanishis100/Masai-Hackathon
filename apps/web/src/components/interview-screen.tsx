"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@repo/ui/button"

import { useDictation, useSpeaker } from "@/hooks/use-speech"
import type { Answer, Question } from "@/lib/types"

function clock(total: number) {
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0")
  const s = (total % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

const KIND_LABEL: Record<string, string> = {
  intro: "Warm-up",
  technical: "Technical",
  behavioural: "Behavioural",
  "system-design": "System design",
  "role-fit": "Role fit",
}

export function InterviewScreen({
  roleTitle,
  company,
  questions,
  onFinish,
  onAbort,
}: {
  roleTitle: string
  company: string
  questions: Question[]
  onFinish: (answers: Answer[]) => void
  onAbort: () => void
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [text, setText] = useState("")
  const [elapsed, setElapsed] = useState(0)
  const [questionStart, setQuestionStart] = useState(0)
  const taRef = useRef<HTMLTextAreaElement | null>(null)

  const current = questions[index]
  const last = index === questions.length - 1

  const { speak, cancel, speaking, enabled, setEnabled } = useSpeaker()
  const appendFinal = useCallback((chunk: string) => {
    setText((prev) => (prev ? `${prev.trimEnd()} ${chunk.trim()}` : chunk.trim()))
  }, [])
  const mic = useDictation(appendFinal)

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Ask the question aloud whenever we move to a new one. The per-question clock
  // is stamped in commit() instead, so no state is set from inside this effect.
  useEffect(() => {
    if (current) speak(current.text)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  function commit() {
    if (!current) return
    const answer: Answer = {
      questionId: current.id,
      text,
      seconds: Math.max(0, elapsed - questionStart),
    }
    const next = [...answers.filter((a) => a.questionId !== current.id), answer]
    setAnswers(next)
    setText("")
    mic.stop()
    cancel()
    if (last) {
      onFinish(next)
    } else {
      setQuestionStart(elapsed)
      setIndex((i) => i + 1)
    }
  }

  if (!current) return null

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-8">
      {/* Call header */}
      <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-lg font-semibold text-white">
            {(company || "AI").slice(0, 2).toUpperCase()}
          </div>
          {speaking ? (
            <span className="absolute -right-0.5 -bottom-0.5 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500" />
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{roleTitle || "Phone screen"}</p>
          <p className="truncate text-sm text-neutral-500">
            {company ? `${company} · ` : ""}
            {speaking ? "speaking…" : "listening"}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg tabular-nums">{clock(elapsed)}</p>
          <p className="text-xs text-neutral-500">
            {index + 1} of {questions.length}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-3 flex gap-1.5">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className={`h-1 flex-1 rounded-full ${
              i < index
                ? "bg-brand-600"
                : i === index
                  ? "bg-brand-400"
                  : "bg-neutral-200 dark:bg-neutral-800"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="mt-8">
        <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
          {KIND_LABEL[current.kind] ?? current.kind}
        </span>
        <p className="mt-3 text-2xl leading-snug font-medium">{current.text}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <button
            className="text-brand-600 underline"
            onClick={() => speak(current.text)}
          >
            Say it again
          </button>
          <button
            className="text-neutral-500 underline"
            onClick={() => {
              setEnabled(!enabled)
              if (enabled) cancel()
            }}
          >
            {enabled ? "Mute interviewer" : "Unmute interviewer"}
          </button>
        </div>
      </div>

      {/* Answer */}
      <div className="mt-6 flex-1">
        <textarea
          ref={taRef}
          value={text + (mic.interim ? ` ${mic.interim}` : "")}
          onChange={(e) => setText(e.target.value)}
          rows={9}
          placeholder={
            mic.supported
              ? "Speak your answer, or type it here…"
              : "Type your answer here…"
          }
          className="w-full resize-y rounded-lg border border-neutral-300 bg-white p-4 text-base leading-relaxed outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
          <span>
            {text.trim() ? `${text.trim().split(/\s+/).length} words` : "no answer yet"}
          </span>
          <span>{clock(Math.max(0, elapsed - questionStart))} on this question</span>
        </div>
        {mic.error ? <p className="mt-2 text-xs text-amber-600">{mic.error}</p> : null}
      </div>

      {/* Controls */}
      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-3 border-t border-neutral-200 bg-white py-4 dark:border-neutral-800 dark:bg-neutral-950">
        {mic.supported ? (
          <button
            onClick={mic.listening ? mic.stop : mic.start}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
              mic.listening
                ? "bg-red-600 text-white"
                : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-200"
            }`}
            aria-label={mic.listening ? "Stop recording" : "Start recording"}
          >
            {mic.listening ? (
              <span className="h-3.5 w-3.5 rounded-sm bg-white" />
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
              </svg>
            )}
          </button>
        ) : null}

        <Button onClick={commit} className="px-6 py-2.5">
          {last ? "Finish & get feedback" : "Next question"}
        </Button>

        {!last ? (
          <Button variant="ghost" onClick={commit}>
            Skip
          </Button>
        ) : null}

        <button
          className="ml-auto text-sm text-neutral-500 underline hover:text-red-600"
          onClick={() => {
            mic.stop()
            cancel()
            onAbort()
          }}
        >
          End call
        </button>
      </div>
    </div>
  )
}
