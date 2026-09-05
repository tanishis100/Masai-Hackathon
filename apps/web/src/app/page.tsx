"use client"

import { useEffect, useState } from "react"

import { CheatSheetScreen } from "@/components/cheatsheet-screen"
import { FeedbackScreen } from "@/components/feedback-screen"
import { InterviewScreen } from "@/components/interview-screen"
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
  cheatSheetPrompt,
  feedbackPrompt,
  questionPrompt,
} from "@/lib/prompts"
import { draftStore } from "@/lib/storage"
import type {
  Answer,
  CheatSheet,
  ExperienceLevel,
  Feedback,
  InterviewSetup,
  Question,
  Stage,
} from "@/lib/types"

export default function Home() {
  const { apiKey, setApiKey, model, setModel, clearKey, loaded } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [jobDescription, setJobDescription] = useState("")
  const [resume, setResume] = useState("")
  const [level, setLevel] = useState<ExperienceLevel>("intermediate")
  const [rounds, setRounds] = useState(5)

  const [stage, setStage] = useState<Stage>("setup")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [setup, setSetup] = useState<InterviewSetup | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [sheet, setSheet] = useState<CheatSheet | null>(null)

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
      roleTitle: "",
      company: "",
    }
    try {
      const out = await generateJSON<{
        roleTitle: string
        company: string
        questions: { kind: Question["kind"]; text: string; lookingFor: string }[]
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
      setStage("interview")
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
    setAnswers([])
    setFeedback(null)
    setSheet(null)
    setError(null)
  }

  return (
    <>
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-200 bg-white/85 px-6 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/85">
        <button onClick={restart} className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm text-white">
            IP
          </span>
          Interview Prep
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
          rounds={rounds}
          setRounds={setRounds}
          hasKey={Boolean(apiKey)}
          onOpenSettings={() => setSettingsOpen(true)}
          onStart={startInterview}
          busy={busy}
          error={error}
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
