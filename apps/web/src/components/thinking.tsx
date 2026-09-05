"use client"

import { useEffect, useState } from "react"

const STEPS: Record<string, string[]> = {
  questions: [
    "Reading the job description",
    "Cross-referencing your resume",
    "Choosing what to probe",
    "Writing the questions",
  ],
  grading: [
    "Replaying the transcript",
    "Scoring each answer",
    "Weighing it against the role's bar",
    "Writing your feedback",
  ],
  "job-scan": [
    "Reading your LinkedIn profile",
    "Scanning current LinkedIn job descriptions",
    "Comparing skills, seniority, and role signals",
    "Preparing your strongest matches",
  ],
  "linkedin-loading": [
    "Connecting to LinkedIn",
    "Reading your profile signals",
    "Personalizing your preparation",
  ],
  cheatsheet: [
    "Finding what cost you most",
    "Pulling the topics to revise",
    "Gathering reference links",
    "Laying out the sheet",
  ],
}

export function Thinking({ kind }: { kind: keyof typeof STEPS | string }) {
  const steps = STEPS[kind] ?? STEPS.questions!
  const isJobScan = kind === "job-scan"
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isJobScan) return
    const timer = window.setInterval(() => setProgress((value) => Math.min(value + 4, 96)), 125)
    return () => window.clearInterval(timer)
  }, [isJobScan])
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand-500"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
      {isJobScan ? (
        <div className="mt-8 w-full max-w-sm text-left">
          <div className="flex items-end justify-between gap-4 text-sm">
            <span className="font-semibold text-neutral-950">Understanding your profile and finding the right jobs</span>
            <span className="font-mono text-brand-600">{progress}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full rounded-full bg-brand-600 transition-[width] duration-150" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-xs text-neutral-500">Matching experience, seniority, location, and skills against current LinkedIn job descriptions.</p>
        </div>
      ) : null}
      <ul className={`${isJobScan ? "mt-6" : "mt-8"} space-y-2.5 text-sm text-neutral-500`}>
        {steps.map((s, i) => (
          <li
            key={s}
            className="animate-pulse"
            style={{ animationDelay: `${i * 400}ms` }}
          >
            {s}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs text-neutral-400">
        {kind === "linkedin-loading"
          ? "Securely preparing your profile."
          : "This usually takes 5–20 seconds."}
      </p>
    </div>
  )
}
