"use client"

import { useState } from "react"
import { Button } from "@repo/ui/button"

import { EXPERIENCE_LEVELS, type ExperienceLevel } from "@/lib/types"

type Props = {
  jobDescription: string
  setJobDescription: (v: string) => void
  resume: string
  setResume: (v: string) => void
  level: ExperienceLevel
  setLevel: (v: ExperienceLevel) => void
  rounds: number
  setRounds: (n: number) => void
  hasKey: boolean
  onOpenSettings: () => void
  onStart: () => void
  busy: boolean
  error: string | null
}

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  minChars,
}: {
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  minChars: number
}) {
  const short = value.trim().length > 0 && value.trim().length < minChars
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className={`text-xs ${short ? "text-amber-600" : "text-neutral-500"}`}>
          {value.trim().length === 0
            ? hint
            : short
              ? `a bit thin — ${minChars - value.trim().length} more chars helps`
              : `${value.trim().length} chars`}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={10}
        className="mt-1.5 resize-y rounded-lg border border-neutral-300 bg-white p-3 text-sm leading-relaxed outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
      />
    </div>
  )
}

export function SetupScreen(props: Props) {
  const [showSample, setShowSample] = useState(false)
  const ready = props.jobDescription.trim().length > 80 && props.resume.trim().length > 80

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium text-brand-600">Mock interview</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Paste the job, paste your resume.
        </h1>
        <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">
          You&apos;ll get a phone-style screen written against that specific role, a
          scored breakdown of how you did, and a cheat sheet of what to revise before the
          real thing.
        </p>
      </header>

      {!props.hasKey ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Add your Gemini API key to begin. It stays in this browser.
          </p>
          <Button onClick={props.onOpenSettings}>Add API key</Button>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Field
          label="LinkedIn job description"
          hint="paste the full posting"
          value={props.jobDescription}
          onChange={props.setJobDescription}
          minChars={200}
          placeholder={
            "Senior Frontend Engineer at Acme\n\nAbout the role...\nRequirements:\n- 4+ years with React and TypeScript\n- Experience with Next.js App Router\n..."
          }
        />
        <Field
          label="Your resume"
          hint="paste the text of your CV"
          value={props.resume}
          onChange={props.setResume}
          minChars={200}
          placeholder={
            "Raj Gohil — Frontend Engineer\n\nExperience\nAcme (2022–now) — built the design system...\n\nSkills\nReact, TypeScript, Node..."
          }
        />
      </div>

      <div className="mt-8">
        <p className="text-sm font-medium">Experience level</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {EXPERIENCE_LEVELS.map((l) => {
            const active = props.level === l.value
            return (
              <button
                key={l.value}
                onClick={() => props.setLevel(l.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  active
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                    : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800"
                }`}
              >
                <span className="block text-sm font-semibold">{l.label}</span>
                <span className="mt-0.5 block text-xs text-neutral-500">{l.hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-end gap-6">
        <div>
          <label className="text-sm font-medium" htmlFor="rounds">
            Questions
          </label>
          <select
            id="rounds"
            value={props.rounds}
            onChange={(e) => props.setRounds(Number(e.target.value))}
            className="mt-1.5 block rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {[4, 5, 6, 8].map((n) => (
              <option key={n} value={n}>
                {n} questions {n <= 5 ? "· quick" : "· full screen"}
              </option>
            ))}
          </select>
        </div>

        <Button
          className="px-6 py-2.5"
          onClick={props.onStart}
          disabled={!ready || props.busy || !props.hasKey}
        >
          {props.busy ? "Writing your interview…" : "Start interview"}
        </Button>

        {!ready ? (
          <p className="text-sm text-neutral-500">
            Paste both the job description and your resume to continue.
          </p>
        ) : null}
      </div>

      {props.error ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {props.error}
        </p>
      ) : null}

      <button
        className="mt-8 text-sm text-neutral-500 underline"
        onClick={() => setShowSample((s) => !s)}
      >
        {showSample ? "Hide" : "No posting handy? Load a sample"}
      </button>
      {showSample ? (
        <div className="mt-3">
          <Button
            variant="secondary"
            onClick={() => {
              props.setJobDescription(SAMPLE_JD)
              props.setResume(SAMPLE_RESUME)
            }}
          >
            Fill both fields with a sample
          </Button>
        </div>
      ) : null}
    </div>
  )
}

const SAMPLE_JD = `Frontend Engineer (Intermediate) — Nimbus Analytics, Bengaluru (Hybrid)

Nimbus builds real-time dashboards for logistics teams. We are looking for a frontend
engineer to own our charting surface end to end.

What you'll do
- Build and maintain data-dense React interfaces used by operations teams daily
- Own the performance budget of a dashboard rendering 50k+ live rows
- Work with the design system team to keep our component library consistent
- Partner with backend on WebSocket contracts for live telemetry

Requirements
- 2-4 years building production React applications
- Strong TypeScript; you understand generics and discriminated unions
- Experience with Next.js App Router and server components
- Comfortable profiling and fixing render performance issues
- Familiarity with a charting library (D3, visx, or similar)
- Bonus: experience with WebSockets and optimistic UI`

const SAMPLE_RESUME = `Priya Nair — Frontend Engineer
Bengaluru · priya.nair@example.com

Experience
Zeta Commerce (2022 - present) — Frontend Engineer
- Built the seller analytics dashboard in React + TypeScript, used by 4k sellers
- Cut initial bundle from 890kB to 310kB by code-splitting routes and lazy charts
- Migrated 40 components from styled-components to Tailwind
- Added a WebSocket order feed with optimistic updates and reconnect backoff

Freshworks (2021 - 2022) — Junior Frontend Engineer
- Maintained internal admin tooling in React 17
- Wrote the team's first Playwright end-to-end suite

Skills
React, TypeScript, Next.js (Pages Router), Tailwind, Redux Toolkit, Jest, Playwright,
some D3. Learning server components.

Education
B.E. Computer Science, RVCE, 2021`
