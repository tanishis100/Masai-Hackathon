"use client"

import { useEffect, useState } from "react"

import { CheatSheetScreen } from "@/components/cheatsheet-screen"
import { FeedbackScreen } from "@/components/feedback-screen"
import { InterviewScreen } from "@/components/interview-screen"
import { CallScreen } from "@/components/call-screen"
import { JobMatchScreen } from "@/components/job-match-screen"
import { ProfileImportScreen } from "@/components/profile-import-screen"
import { RiskMapScreen } from "@/components/risk-map-screen"
import { SettingsDialog } from "@/components/settings-dialog"
import { SetupScreen } from "@/components/setup-screen"
import { Thinking } from "@/components/thinking"
import { useSettings } from "@/hooks/use-settings"
import { generateJSON } from "@/lib/gemini"
import {
  CHEATSHEET_SCHEMA,
  FEEDBACK_SCHEMA,
  INTERVIEWER_SYSTEM,
  QUESTION_SCHEMA,
  RISK_MAP_SCHEMA,
  cheatSheetPrompt,
  feedbackPrompt,
  questionPrompt,
  riskMapPrompt,
} from "@/lib/prompts"
import { draftStore } from "@/lib/storage"
import type {
  Answer,
  CheatSheet,
  ExperienceLevel,
  InterviewMode,
  Feedback,
  InterviewSetup,
  Question,
  RiskMap,
  Stage,
} from "@/lib/types"

export default function Home() {
  const { apiKey, setApiKey, model, setModel, clearKey, loaded } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [jobDescription, setJobDescription] = useState("")
  const [resume, setResume] = useState("")
  const [level, setLevel] = useState<ExperienceLevel>("intermediate")
  const [mode, setMode] = useState<InterviewMode>("pressure")
  const [rounds, setRounds] = useState(5)

  const [stage, setStage] = useState<Stage>("setup")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [setup, setSetup] = useState<InterviewSetup | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [riskMap, setRiskMap] = useState<RiskMap | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [sheet, setSheet] = useState<CheatSheet | null>(null)

  useEffect(() => {
    if (stage !== "job-scan") return
    const timer = window.setTimeout(() => {
      setJobDescription(SAMPLE_JOB_DESCRIPTION)
      setStage("job-matches")
    }, 3200)
    return () => window.clearTimeout(timer)
  }, [stage])

  useEffect(() => {
    if (stage !== "linkedin-loading") return
    const timer = window.setTimeout(() => setStage("profile-import"), 1800)
    return () => window.clearTimeout(timer)
  }, [stage])

  // Restore the last draft so a refresh mid-prep is not punishing. This has to
  // run after mount: reading localStorage during render would desync hydration
  // against the server-rendered empty fields.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const d = draftStore.get()
    if (!d) return
    setJobDescription(d.jobDescription)
    setResume(d.resume)
    if (d.level) setLevel(d.level as ExperienceLevel)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (jobDescription || resume) {
      draftStore.set({ jobDescription, resume, level })
    }
  }, [jobDescription, resume, level])

  function fail(err: unknown) {
    setError(err instanceof Error ? err.message : "Something went wrong. Retry.")
  }

  async function startInterview() {
    setBusy(true)
    setError(null)
    const s: InterviewSetup = {
      jobDescription,
      resume,
      level,
      mode,
      roleTitle: "",
      company: "",
    }
    try {
      const risk = await generateJSON<RiskMap>({
        apiKey,
        model,
        system: INTERVIEWER_SYSTEM,
        prompt: riskMapPrompt(s),
        schema: RISK_MAP_SCHEMA,
        temperature: 0.45,
      })

      const out = await generateJSON<{
        roleTitle: string
        company: string
        questions: {
          kind: Question["kind"]
          text: string
          lookingFor: string
          pressureTarget?: string
        }[]
      }>({
        apiKey,
        model,
        system: INTERVIEWER_SYSTEM,
        prompt: questionPrompt(s, rounds),
        schema: QUESTION_SCHEMA,
      })

      if (!out.questions?.length) throw new Error("Gemini returned no questions. Retry.")

      setSetup({ ...s, roleTitle: out.roleTitle, company: out.company })
      setQuestions(out.questions.map((q, i) => ({ ...q, id: `q${i + 1}` })))
      setRiskMap(risk)
      setStage("risk-map")
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  async function grade(given: Answer[]) {
    if (!setup) return
    setAnswers(given)
    setStage("grading")
    setError(null)
    try {
      const out = await generateJSON<Feedback>({
        apiKey,
        model,
        system: INTERVIEWER_SYSTEM,
        prompt: feedbackPrompt(setup, questions, given),
        schema: FEEDBACK_SCHEMA,
        temperature: 0.4,
      })
      setFeedback(out)
      setStage("feedback")
    } catch (err) {
      fail(err)
      setStage("interview")
    }
  }

  async function buildCheatSheet() {
    if (!setup || !feedback) return
    setBusy(true)
    setError(null)
    try {
      const weakest = [...feedback.perQuestion]
        .sort((a, b) => a.score - b.score)
        .slice(0, 3)
        .map((p) => {
          const q = questions.find((x) => x.id === p.questionId)
          return `${q?.text ?? p.questionId} — scored ${Math.round(p.score)}`
        })

      const out = await generateJSON<CheatSheet>({
        apiKey,
        model,
        system:
          "You write dense, accurate technical revision notes. You never invent URLs.",
        prompt: cheatSheetPrompt(setup, feedback.gaps, weakest),
        schema: CHEATSHEET_SCHEMA,
        temperature: 0.5,
      })
      setSheet(out)
      setStage("cheatsheet")
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  function restart() {
    setStage("setup")
    setQuestions([])
    setRiskMap(null)
    setAnswers([])
    setFeedback(null)
    setSheet(null)
    setError(null)
  }

  function connectLinkedIn() {
    // Frontend demo state until a LinkedIn OAuth callback is provided by the backend.
    setResume(SAMPLE_LINKEDIN_PROFILE)
    setStage("linkedin-loading")
    setError(null)
  }

  function continueFromProfile() {
    setStage("job-scan")
    setError(null)
  }

  return (
    <>
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-200 bg-white/85 px-6 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/85">
        <button onClick={restart} className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950 text-xs text-white shadow-sm dark:bg-white dark:text-neutral-950">
            PX
          </span>
          Pressure
        </button>
        <div className="flex items-center gap-3 text-sm">
          {loaded ? (
            <span
              className={`hidden sm:inline ${apiKey ? "text-emerald-600" : "text-amber-600"}`}
            >
              {apiKey ? "Key set" : "No key"}
            </span>
          ) : null}
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-md px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Settings
          </button>
        </div>
      </nav>

      {stage === "setup" ? (
        <SetupScreen
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          resume={resume}
          setResume={setResume}
          level={level}
          setLevel={setLevel}
          mode={mode}
          setMode={setMode}
          rounds={rounds}
          setRounds={setRounds}
          hasKey={Boolean(apiKey)}
          onOpenSettings={() => setSettingsOpen(true)}
          onLinkedIn={connectLinkedIn}
          onStart={startInterview}
          busy={busy}
          error={error}
        />
      ) : null}

      {stage === "profile-import" ? (
        <ProfileImportScreen
          resume={resume}
          setResume={setResume}
          onContinue={continueFromProfile}
        />
      ) : null}

      {stage === "linkedin-loading" ? <Thinking kind="linkedin-loading" /> : null}

      {stage === "job-scan" ? <Thinking kind="job-scan" /> : null}

      {stage === "job-matches" ? (
        <JobMatchScreen onJoin={() => setStage("call")} onBack={() => setStage("profile-import")} />
      ) : null}

      {stage === "call" ? (
        <CallScreen onStart={startInterview} onBack={() => setStage("job-matches")} />
      ) : null}

      {stage === "risk-map" && setup && riskMap ? (
        <RiskMapScreen
          roleTitle={setup.roleTitle}
          company={setup.company}
          riskMap={riskMap}
          onStart={() => setStage("interview")}
          onBack={restart}
        />
      ) : null}

      {stage === "interview" && setup ? (
        <InterviewScreen
          roleTitle={setup.roleTitle}
          company={setup.company}
          questions={questions}
          onFinish={grade}
          onAbort={restart}
        />
      ) : null}

      {stage === "grading" ? <Thinking kind="grading" /> : null}

      {stage === "feedback" && feedback ? (
        <FeedbackScreen
          feedback={feedback}
          questions={questions}
          answers={answers}
          onCheatSheet={buildCheatSheet}
          onRestart={restart}
          onRetry={(questionId) => {
            const q = questions.find((x) => x.id === questionId)
            if (!q) return
            setQuestions([{ ...q, id: `${q.id}-retry` }])
            setAnswers([])
            setFeedback(null)
            setStage("interview")
          }}
          cheatBusy={busy}
        />
      ) : null}

      {stage === "cheatsheet" && sheet ? (
        <CheatSheetScreen
          sheet={sheet}
          roleTitle={setup?.roleTitle ?? ""}
          onBack={() => setStage("feedback")}
          onRestart={restart}
        />
      ) : null}

      {error && stage !== "setup" ? (
        <p className="mx-auto max-w-3xl px-6 pb-8 text-sm text-red-600">{error}</p>
      ) : null}

      {settingsOpen ? (
        <SettingsDialog
          onClose={() => setSettingsOpen(false)}
          apiKey={apiKey}
          setApiKey={setApiKey}
          model={model}
          setModel={setModel}
          clearKey={clearKey}
        />
      ) : null}
    </>
  )
}

const SAMPLE_LINKEDIN_PROFILE = `Priya Nair — Frontend Engineer
Bengaluru · 2,400 followers

Experience
Zeta Commerce (2022 - present) — Frontend Engineer
- Built the seller analytics dashboard in React + TypeScript, used by 4k sellers
- Cut initial bundle from 890kB to 310kB by code-splitting routes and lazy charts
- Added a WebSocket order feed with optimistic updates and reconnect backoff

Freshworks (2021 - 2022) — Junior Frontend Engineer
- Maintained internal admin tooling in React 17
- Wrote the team's first Playwright end-to-end suite

Skills
React, TypeScript, Next.js, Tailwind, Redux Toolkit, Jest, Playwright, D3`

const SAMPLE_JOB_DESCRIPTION = `Frontend Engineer (Intermediate) — Nimbus Analytics, Bengaluru (Hybrid)

Nimbus builds real-time dashboards for logistics teams. The role needs production React,
TypeScript, Next.js, performance profiling, charting, and WebSocket experience.`
