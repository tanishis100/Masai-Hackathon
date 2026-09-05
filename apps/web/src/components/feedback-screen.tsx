"use client"

import { Button } from "@repo/ui/button"

import type { Answer, Feedback, Question } from "@/lib/types"

function tone(score: number) {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400"
  if (score >= 50) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function bar(score: number) {
  if (score >= 75) return "bg-emerald-500"
  if (score >= 50) return "bg-amber-500"
  return "bg-red-500"
}

function Ring({ score }: { score: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="12"
          className="stroke-neutral-200 dark:stroke-neutral-800"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(100, Math.max(0, score)) / 100) * c}
          className={
            score >= 75
              ? "stroke-emerald-500"
              : score >= 50
                ? "stroke-amber-500"
                : "stroke-red-500"
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${tone(score)}`}>{Math.round(score)}</span>
        <span className="text-xs text-neutral-500">out of 100</span>
      </div>
    </div>
  )
}

export function FeedbackScreen({
  feedback,
  questions,
  answers,
  onCheatSheet,
  onRestart,
  onRetry,
  cheatBusy,
}: {
  feedback: Feedback
  questions: Question[]
  answers: Answer[]
  onCheatSheet: () => void
  onRestart: () => void
  onRetry: (questionId: string) => void
  cheatBusy: boolean
}) {
  return (
    <div className="relative mx-auto max-w-5xl px-6 py-10">
      <div className="pointer-events-none absolute -top-24 left-0 -z-10 h-80 w-80 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-900/20" />
      <p className="text-sm font-medium text-brand-700 dark:text-brand-400">
        Complete interview report
      </p>
      <h1 className="mt-1 text-5xl font-black leading-tight">Interview readiness</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Evidence from {questions.length} questions, including your strongest answers and
        the claims that need another pass.
      </p>

      <div className="mt-6 flex flex-col gap-6 rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-center dark:border-neutral-800 dark:bg-neutral-900/70">
        <Ring score={feedback.overall} />
        <div className="min-w-0">
          <p className="text-xl font-semibold">{feedback.headline}</p>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            {feedback.summary}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {feedback.dimensions.map((d) => (
          <div
            key={d.name}
            className="rounded-[1.5rem] border border-white/70 bg-white/65 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/55"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{d.name}</span>
              <span className={`font-mono text-sm ${tone(d.score)}`}>
                {Math.round(d.score)}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className={`h-1.5 rounded-full ${bar(d.score)}`}
                style={{ width: `${Math.min(100, Math.max(0, d.score))}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              {d.note}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-emerald-200 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-emerald-900 dark:bg-emerald-950/40">
          <h3 className="font-semibold text-emerald-800 dark:text-emerald-300">
            What worked
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-emerald-900 dark:text-emerald-200">
            {feedback.strengths.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[1.5rem] border border-red-200 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-red-900 dark:bg-red-950/40">
          <h3 className="font-semibold text-red-800 dark:text-red-300">What cost you</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-red-900 dark:text-red-200">
            {feedback.gaps.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Question by question</h2>
      <div className="mt-4 space-y-3">
        {questions.map((q, i) => {
          const s = feedback.perQuestion.find((p) => p.questionId === q.id)
          const a = answers.find((x) => x.questionId === q.id)
          return (
            <details
              key={q.id}
              className="rounded-[1.5rem] border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/65"
            >
              <summary className="flex cursor-pointer items-start gap-3">
                <span
                  className={`mt-0.5 font-mono text-sm ${tone(s?.score ?? 0)} shrink-0`}
                >
                  {Math.round(s?.score ?? 0)}
                </span>
                <span className="flex-1 font-medium">
                  Q{i + 1}. {q.text}
                </span>
              </summary>
              <div className="mt-3 space-y-3 border-t border-neutral-200 pt-3 text-sm dark:border-neutral-800">
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase">
                    You said
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                    {a?.text?.trim() || "(skipped)"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-500 uppercase">
                    Verdict
                  </p>
                  <p className="mt-1">{s?.verdict}</p>
                </div>
                {s?.missed?.length ? (
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 uppercase">
                      A strong answer would have hit
                    </p>
                    <ul className="mt-1 space-y-1">
                      {s.missed.map((m, j) => (
                        <li key={j}>• {m}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <Button variant="secondary" onClick={() => onRetry(q.id)}>
                  Retry this question
                </Button>
              </div>
            </details>
          )
        })}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button className="px-6 py-2.5" onClick={onCheatSheet} disabled={cheatBusy}>
          {cheatBusy ? "Building your cheat sheet…" : "Get my cheat sheet"}
        </Button>
        <Button variant="secondary" onClick={onRestart}>
          New interview
        </Button>
      </div>
    </div>
  )
}
