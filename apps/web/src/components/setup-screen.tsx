"use client"

import Image from "next/image"
import { useState } from "react"
import { Button } from "@repo/ui/button"

import type { ExperienceLevel, InterviewMode } from "@/lib/types"

type Props = {
  jobDescription: string
  setJobDescription: (v: string) => void
  resume: string
  setResume: (v: string) => void
  level: ExperienceLevel
  setLevel: (v: ExperienceLevel) => void
  mode: InterviewMode
  setMode: (v: InterviewMode) => void
  rounds: number
  setRounds: (n: number) => void
  hasKey: boolean
  onOpenSettings: () => void
  onLinkedIn: () => void
  onStart: () => void
  busy: boolean
  error: string | null
}

export function SetupScreen(props: Props) {
  const [showManual, setShowManual] = useState(false)
  const [linkedInConnected, setLinkedInConnected] = useState(false)
  const ready = props.jobDescription.trim().length > 80 && props.resume.trim().length > 80

  function loadLinkedInDemo() {
    props.setJobDescription(SAMPLE_JD)
    props.setResume(SAMPLE_RESUME)
    props.setLevel("intermediate")
    props.setMode("pressure")
    props.setRounds(5)
    setLinkedInConnected(true)
  }

  return (
    <div className="relative min-h-[calc(100vh-65px)] overflow-hidden bg-white">
      <main className="grid min-h-[calc(100vh-65px)] md:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden md:block">
          <Image
            src="/welcome-interview-v2.png"
            alt="Candidate greeting interviewers"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,95,70,0.08),rgba(14,165,233,0.12)),radial-gradient(circle_at_20%_12%,rgba(255,255,255,0.4),transparent_30%)]" />
          <div className="absolute left-8 top-8 flex items-center gap-2 rounded-full bg-white/78 px-4 py-2 text-sm font-semibold text-neutral-950 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Real interview practice
          </div>
          <div className="absolute inset-x-8 bottom-8 rounded-[1.75rem] border border-white/35 bg-white/18 p-5 text-white shadow-2xl backdrop-blur-md">
            <p className="text-xs font-bold uppercase tracking-wide text-white/75">
              Profile insight
            </p>
            <p className="mt-2 max-w-xl text-2xl font-semibold leading-tight">
              Know which parts of your profile will be challenged before the real call.
            </p>
          </div>
        </section>

        <section className="relative flex min-h-[calc(100vh-65px)] flex-col items-center justify-center overflow-hidden px-6 py-8 sm:px-8 md:px-10 md:py-10">
          <div className="relative w-full max-w-md text-center">
          <h1 className="text-6xl font-black leading-[0.88] tracking-normal text-neutral-950 sm:text-7xl">
            Get that
            <span className="block text-brand-600">job.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg leading-8 text-neutral-600">
            The most realistic and honest interview practice platform to help you get
            any job.
          </p>

          <div className="mx-auto mt-7">
            <Button
              className="mx-auto h-12 w-auto min-w-[220px] gap-3 bg-[#0a66c2] px-5 text-sm text-white shadow-[0_18px_45px_rgba(10,102,194,0.22)] hover:bg-[#004182] focus-visible:outline-[#0a66c2] dark:bg-[#0a66c2] dark:text-white dark:hover:bg-[#004182]"
              onClick={props.onLinkedIn}
              disabled={props.busy}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-sm font-bold text-[#0a66c2]">
                in
              </span>
              Connect LinkedIn
            </Button>
            <p className="mt-3 text-center text-xs leading-5 text-neutral-500">
              We use your profile to detect risky claims, role gaps, and the questions
              interviewers are most likely to ask.
            </p>
          </div>

          {!props.hasKey ? (
            <div className="mx-auto mt-5 flex max-w-md flex-col items-stretch gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-left shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-amber-800 dark:bg-amber-950">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                Add your Gemini key before analysis.
              </p>
              <Button
                variant="secondary"
                className="shrink-0 whitespace-nowrap px-5"
                onClick={props.onOpenSettings}
              >
                Add key
              </Button>
            </div>
          ) : null}

          {linkedInConnected && ready ? (
            <div className="mx-auto mt-5 flex max-w-md flex-col gap-3 sm:flex-row">
              <Button
                className="h-12 flex-1"
                onClick={props.onStart}
                disabled={props.busy || !props.hasKey}
              >
                {props.busy ? "Mapping your risks..." : "Start pressure prep"}
              </Button>
              <Button
                variant="secondary"
                className="h-12"
                onClick={() => setShowManual((s) => !s)}
              >
                Edit details
              </Button>
            </div>
          ) : !showManual ? (
            <button
              className="mt-5 text-sm font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
              onClick={() => setShowManual((s) => !s)}
            >
              Use manual demo inputs
            </button>
          ) : null}

          {props.error ? (
            <p className="mx-auto mt-4 max-w-md rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {props.error}
            </p>
          ) : null}

          {showManual ? (
            <div className="mt-6 rounded-[1.5rem] border border-white/70 bg-white/75 p-4 text-left shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/75">
              <div className="grid gap-3">
                <textarea
                  value={props.jobDescription}
                  onChange={(e) => props.setJobDescription(e.target.value)}
                  rows={4}
                  placeholder="Paste job description"
                  className="resize-y rounded-2xl border border-neutral-200 bg-white/80 p-3 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950"
                />
                <textarea
                  value={props.resume}
                  onChange={(e) => props.setResume(e.target.value)}
                  rows={4}
                  placeholder="Paste resume or LinkedIn profile text"
                  className="resize-y rounded-2xl border border-neutral-200 bg-white/80 p-3 text-sm outline-none focus:border-brand-500 dark:border-neutral-800 dark:bg-neutral-950"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={loadLinkedInDemo}>
                  Fill demo profile
                </Button>
                <Button onClick={props.onStart} disabled={!ready || props.busy || !props.hasKey}>
                  {props.busy ? "Mapping..." : "Analyze"}
                </Button>
              </div>
            </div>
          ) : null}
          </div>
          <div className="relative mt-8 overflow-hidden rounded-[1.75rem] shadow-2xl md:hidden">
            <Image
              src="/welcome-interview-v2.png"
              alt="Candidate greeting interviewers"
              width={900}
              height={620}
              className="h-64 w-full object-cover"
            />
            <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/86 p-3 text-left shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase text-brand-700">
                Likely interviewer probe
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug text-neutral-950">
                &quot;Your LinkedIn says you led the launch. What did you personally own?&quot;
              </p>
            </div>
          </div>
        </section>
      </main>
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
