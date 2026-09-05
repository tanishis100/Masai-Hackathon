"use client"

import Image from "next/image"
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
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <main className="grid min-h-screen md:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden md:block">
          <Image
            src="/welcome-interview-v2.png"
            alt="Candidate greeting interviewers"
            fill
            priority
            sizes="(min-width: 768px) 54vw, 100vw"
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

        <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-8 sm:px-8 md:px-10 md:py-10">
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
                Master your interview
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

            {props.error ? (
              <p className="mx-auto mt-4 max-w-md rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {props.error}
              </p>
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
                &quot;Your LinkedIn says you led the launch. What did you personally
                own?&quot;
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
