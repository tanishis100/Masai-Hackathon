"use client"

import { useEffect, useMemo, useState } from "react"

const STEPS: Record<string, string[]> = {
  questions: ["Reading the job description", "Cross-referencing your resume", "Choosing what to probe", "Writing the questions"],
  grading: ["Replaying the transcript", "Scoring each answer", "Weighing it against the role", "Writing your feedback"],
  "job-scan": [
    "Understanding your resume",
    "Finding the right companies for your target role",
    "Checking role requirements and experience signals",
    "Preparing your tailored job matches",
  ],
  cheatsheet: ["Finding what cost you most", "Pulling the topics to revise", "Gathering reference links", "Laying out the sheet"],
}

function ProgressRing({ progress }: { progress: number }) {
  const radius = 76
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference
  return (
    <div className="relative h-48 w-48">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 184 184" aria-hidden="true">
        <circle cx="92" cy="92" r={radius} fill="none" strokeWidth="10" className="stroke-neutral-200" />
        <circle cx="92" cy="92" r={radius} fill="none" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="stroke-brand-600 transition-[stroke-dashoffset] duration-200" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-bold tabular-nums text-neutral-950">{progress}%</span>
        <span className="mt-1 text-xs font-medium text-neutral-500">Profile scan</span>
      </div>
    </div>
  )
}

export function Thinking({ kind }: { kind: keyof typeof STEPS | string }) {
  const steps = STEPS[kind] ?? STEPS.questions!
  const isJobScan = kind === "job-scan"
  const [progress, setProgress] = useState(0)
  const activeStep = useMemo(
    () => Math.min(steps.length - 1, Math.floor((progress / 100) * steps.length)),
    [progress, steps.length],
  )

  useEffect(() => {
    if (!isJobScan) return
    const timer = window.setInterval(() => setProgress((value) => Math.min(value + 5, 100)), 150)
    return () => window.clearInterval(timer)
  }, [isJobScan])

  if (isJobScan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f9f8] px-6 py-12">
        <div className="w-full max-w-md text-center">
          <ProgressRing progress={progress} />
          <h1 className="mt-8 text-2xl font-bold text-neutral-950">Building your role matches</h1>
          <p className="mt-3 min-h-6 text-sm font-medium text-brand-700">{steps[activeStep]}</p>
          <div className="mt-8 space-y-3 text-left">
            {steps.map((step, index) => (
              <div key={step} className={`flex items-center gap-3 text-sm transition-colors ${index <= activeStep ? "text-neutral-900" : "text-neutral-400"}`}>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${index < activeStep ? "bg-emerald-500 text-white" : index === activeStep ? "bg-brand-600 text-white" : "bg-neutral-200 text-neutral-500"}`}>{index < activeStep ? "✓" : index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="flex gap-1.5">{[0, 1, 2].map((index) => <span key={index} className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand-500" style={{ animationDelay: `${index * 140}ms` }} />)}</div>
      <ul className="mt-8 space-y-2.5 text-sm text-neutral-500">{steps.map((step, index) => <li key={step} className="animate-pulse" style={{ animationDelay: `${index * 400}ms` }}>{step}</li>)}</ul>
      <p className="mt-8 text-xs text-neutral-400">This usually takes a few seconds.</p>
    </div>
  )
}
