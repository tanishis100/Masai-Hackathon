"use client"

import { useState } from "react"

import { CheatSheetScreen } from "@/components/cheatsheet-screen"
import { FeedbackScreen } from "@/components/feedback-screen"
import { InterviewScreen } from "@/components/interview-screen"
import { JobMatchScreen, type JobMatch } from "@/components/job-match-screen"
import { ProfileImportScreen } from "@/components/profile-import-screen"
import { SettingsDialog } from "@/components/settings-dialog"
import { SetupScreen } from "@/components/setup-screen"
import { Thinking } from "@/components/thinking"
import { useSettings } from "@/hooks/use-settings"
import { GeminiError, generateJSON } from "@/lib/gemini"
import {
  CHEATSHEET_SCHEMA,
  FEEDBACK_SCHEMA,
  INTERVIEWER_SYSTEM,
  JOB_MATCH_SCHEMA,
  QUESTION_SCHEMA,
  cheatSheetPrompt,
  feedbackPrompt,
  followUpQuestionPrompt,
  jobMatchPrompt,
  questionPrompt,
} from "@/lib/prompts"
import type {
  Answer,
  CheatSheet,
  ExperienceLevel,
  InterviewMode,
  Feedback,
  InterviewSetup,
  Question,
  Stage,
} from "@/lib/types"

function inferredRole(resume: string) {
  if (/react|next\.js|typescript|javascript|frontend|front-end|angular|vue/i.test(resume)) return "Frontend Engineer"
  if (/backend|back-end|node\.js|java|golang|django|api/i.test(resume)) return "Backend Engineer"
  if (/data analyst|data science|tableau|power bi|\bsql\b|pandas/i.test(resume)) return "Data Analyst"
  if (/figma|user research|wireframe|product design|ux design|ui design/i.test(resume)) return "Product Designer"
  return "Frontend Engineer"
}

function resumeSignals(resume: string) {
  const patterns = [
    ["React", /\breact\b/i],
    ["TypeScript", /\btypescript\b/i],
    ["Next.js", /\bnext\.?js\b/i],
    ["JavaScript", /\bjavascript\b/i],
    ["Node.js", /\bnode\.?js\b/i],
    ["Python", /\bpython\b/i],
    ["SQL", /\bsql\b/i],
    ["Figma", /\bfigma\b/i],
    ["User research", /user research/i],
    ["Tableau", /\btableau\b/i],
    ["Power BI", /power\s*bi/i],
    ["AWS", /\baws\b/i],
    ["Java", /\bjava\b/i],
  ] as const

  return patterns.filter(([, pattern]) => pattern.test(resume)).map(([skill]) => skill).slice(0, 4)
}

function fallbackRoleTitles(role: string) {
  if (role === "Product Designer") return ["Product Designer", "UX Designer", "UI Designer", "Design Systems Designer", "Product Design Specialist"]
  if (role === "Data Analyst") return ["Data Analyst", "Product Analyst", "Business Intelligence Analyst", "Analytics Specialist", "Data Insights Analyst"]
  if (role === "Backend Engineer") return ["Backend Engineer", "API Engineer", "Platform Engineer", "Node.js Developer", "Software Engineer"]
  return ["Frontend Engineer", "React Developer", "UI Engineer", "Product Engineer", "Web Engineer"]
}

function fallbackCompanies() {
  return ["Microsoft", "Apple", "Google", "Amazon", "Adobe"]
}

function demoDomain(company: string) {
  return `${company.toLowerCase().replace(/[^a-z0-9]+/g, "")}.example`
}

function candidateName(resume: string) {
  const ignored = /^(resume|curriculum vitae|experience|work experience|skills|education|profile|summary|contact|projects|certifications)$/i
  const nonName = /\b(engineer|developer|designer|analyst|manager|linkedin|github|portfolio|email|phone)\b/i

  for (const rawLine of resume.split("\n").slice(0, 12)) {
    const line = rawLine
      .replace(/^#{1,6}\s*/, "")
      .replace(/^\*{1,2}|\*{1,2}$/g, "")
      .replace(/^[-•]\s*/, "")
      .trim()
    const name = line.split(/[|—–]/)[0]?.trim() ?? ""
    const words = name.split(/\s+/).filter(Boolean)
    const looksLikeName = words.length >= 1 && words.length <= 4 && words.every((word) => /^[A-Za-z][A-Za-z.'-]*$/.test(word))

    if (looksLikeName && !ignored.test(name) && !nonName.test(name)) return name
  }

  return "Candidate"
}

function fallbackJobs(resume: string): JobMatch[] {
  const role = inferredRole(resume)
  const signals = resumeSignals(resume)
  const signalText = signals.length ? signals.join(", ") : "your listed experience"
  const companies = fallbackCompanies()
  return fallbackRoleTitles(role).map((title, index) => ({
    company: companies[index]!,
    logo: companies[index]!.slice(0, 1),
    logoClass: ["bg-[#0a66c2]", "bg-neutral-950", "bg-[#1868db]", "bg-emerald-700", "bg-rose-700"][index]!,
    role: title,
    location: "Remote · Demo recommendation",
    match: 92 - index * 3,
    interviewer: ["Avery Morgan", "Priya Shah", "Noah Williams", "Maya Chen", "Elena Garcia"][index]!,
    interviewerRole: "Hiring Manager",
    email: `hiring@${demoDomain(companies[index]!)}`,
    technical: ["Jordan Lee", "Sam Patel", "Taylor Kim", "Riley Brooks", "Casey Rivera"][index]!,
    technicalRole: `${title} Technical Lead`,
    technicalEmail: `engineering@${demoDomain(companies[index]!)}`,
    jd: `Your resume highlights ${signalText}. This ${title} path is tailored to those strengths and will use them in the interview.`,
  }))
}

function fallbackQuestion(setup: InterviewSetup, number: number): Question {
  const role = setup.roleTitle || inferredRole(setup.resume)
  const prompts = [
    `Which resume project best prepares you for this ${role} role?`,
    "What was your hardest decision on that project?",
    "How would you redesign it if usage grew tenfold?",
    "Describe one disagreement and how you resolved it.",
    `Why is this ${role} role your next step?`,
  ]
  const kinds: Question["kind"][] = ["intro", "technical", "system-design", "behavioural", "role-fit"]
  return { id: `q${number}`, kind: kinds[number - 1]!, text: prompts[number - 1]!, lookingFor: "Specific ownership, evidence, trade-offs, and clear communication.", pressureTarget: "Depth of experience and role fit" }
}

function fallbackFeedback(questions: Question[], answers: Answer[]): Feedback {
  const answered = answers.filter((answer) => answer.text.trim()).length
  const overall = Math.round((answered / Math.max(questions.length, 1)) * 70 + 20)
  return {
    overall,
    headline: "Your practice report is ready.",
    summary: "This practice report is based on the answers captured in your interview. Revisit the shortest answers first and add concrete ownership, evidence, and outcomes.",
    dimensions: ["Technical depth", "Communication", "Role fit", "Structure"].map((name) => ({ name, score: overall, note: "Build stronger answers with a clear situation, action, result, and trade-off." })),
    strengths: answered ? ["You completed the interview flow.", "Your responses are available below for review."] : ["You reached the report and can retry any question."],
    gaps: ["Add measurable outcomes to each example.", "Name the decision you made and the trade-off you accepted."],
    perQuestion: questions.map((question) => ({ questionId: question.id, score: answers.find((answer) => answer.questionId === question.id)?.text.trim() ? overall : 15, verdict: "Use a specific example with your role, the decision, and the outcome.", missed: ["Clear ownership", "Concrete evidence or result"] })),
  }
}

function fallbackSheet(setup: InterviewSetup): CheatSheet {
  return { title: `${setup.roleTitle || "Interview"} practice notes`, intro: "Use these notes to strengthen your next answer. Focus on proof of ownership and measured impact.", sections: [{ topic: "Answer structure", whyItMatters: "Clear structure makes your experience easy to assess.", keyPoints: ["Start with the context and your responsibility.", "Explain the decision and trade-off.", "End with a measurable outcome and what you learned."], links: [] }], quickWins: ["Prepare two project stories with metrics.", "Practice explaining one technical trade-off out loud."] }
}

export default function Home() {
  const { apiKey, setApiKey, model, setModel, clearKey } = useSettings()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [jobDescription, setJobDescription] = useState("")
  const [resume, setResume] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [level, setLevel] = useState<ExperienceLevel>("intermediate")
  const [mode, setMode] = useState<InterviewMode>("pressure")
  const [rounds, setRounds] = useState(5)

  const [stage, setStage] = useState<Stage>("setup")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [setup, setSetup] = useState<InterviewSetup | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [sheet, setSheet] = useState<CheatSheet | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null)
  const [jobMatches, setJobMatches] = useState<JobMatch[]>([])

  async function startInterview(job?: JobMatch) {
    setBusy(true)
    setError(null)
    const selectedDescription = job
      ? `${job.role} — ${job.company}\n${job.location}\n\n${job.jd}`
      : jobDescription
    const s: InterviewSetup = {
      jobDescription: selectedDescription,
      resume,
      level,
      mode,
      roleTitle: job?.role ?? "",
      company: job?.company ?? "",
    }
    try {
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
        prompt: questionPrompt(s, 1),
        schema: QUESTION_SCHEMA,
      })

      const firstQuestion = out.questions?.[0]
      if (!firstQuestion) throw new GeminiError("We could not prepare the first question. Please try again.")

      setSetup({ ...s, roleTitle: job?.role || out.roleTitle, company: job?.company || out.company })
      setQuestions([{ ...firstQuestion, id: "q1" }])
      setStage("interview")
    } catch {
      setSetup({ ...s, roleTitle: job?.role || inferredRole(resume), company: job?.company || "Practice interview" })
      setQuestions([fallbackQuestion(s, 1)])
      setError(null)
      setStage("interview")
    } finally {
      setBusy(false)
    }
  }

  async function getFollowUp(given: Answer[]) {
    if (!setup) throw new GeminiError("Please restart the interview and try again.")
    let question: Question
    try {
      const out = await generateJSON<{ roleTitle: string; company: string; questions: Omit<Question, "id">[] }>({ apiKey, model, system: INTERVIEWER_SYSTEM, prompt: followUpQuestionPrompt(setup, questions, given, questions.length + 1), schema: QUESTION_SCHEMA, temperature: 0.55 })
      const next = out.questions?.[0]
      question = next ? { ...next, id: `q${questions.length + 1}` } : fallbackQuestion(setup, questions.length + 1)
    } catch {
      question = fallbackQuestion(setup, questions.length + 1)
    }
    setQuestions((current) => [...current, question])
    return question
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
    } catch {
      setFeedback(fallbackFeedback(questions, given))
      setError(null)
      setStage("feedback")
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
    } catch {
      setSheet(fallbackSheet(setup))
      setError(null)
      setStage("cheatsheet")
    } finally {
      setBusy(false)
    }
  }

  function restart() {
    setStage("setup")
    setJobDescription("")
    setResume("")
    setLinkedinUrl("")
    setQuestions([])
    setAnswers([])
    setFeedback(null)
    setSheet(null)
    setSelectedJob(null)
    setJobMatches([])
    setError(null)
  }

  function connectLinkedIn() {
    setStage("profile-import")
    setError(null)
  }

  async function continueFromProfile() {
    setBusy(true)
    setStage("job-scan")
    setError(null)
    const scanDelay = new Promise((resolve) => window.setTimeout(resolve, 3_200))
    try {
      const requestOptions = {
        apiKey,
        model,
        system:
          "You are a precise technical recruiter. You match candidate profiles to interview-prep target roles and never fabricate verified live openings.",
        prompt: jobMatchPrompt({ resume, linkedinUrl, level }),
        temperature: 0.35,
      }
      let out: { jobs: JobMatch[] }
      try {
        out = await generateJSON({ ...requestOptions, schema: JOB_MATCH_SCHEMA })
      } catch {
        // Some keys only expose models without structured-output support. The
        // same Gemini request still works as plain JSON, so try it before the
        // local practice fallback.
        out = await generateJSON({
          ...requestOptions,
          prompt: `${requestOptions.prompt}\n\nReturn only valid JSON shaped as {"jobs": [...]}, including every field requested above.`,
        })
      }
      await scanDelay

      if (!out.jobs?.length) {
        throw new GeminiError("We could not find matches from that profile. Add a little more resume detail and try again.")
      }

      setJobMatches(out.jobs.slice(0, 5))
      setStage("job-matches")
    } catch {
      await scanDelay
      setJobMatches(fallbackJobs(resume))
      setError(null)
      setStage("job-matches")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
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
          linkedinUrl={linkedinUrl}
          setLinkedinUrl={setLinkedinUrl}
          onContinue={continueFromProfile}
          error={error}
        />
      ) : null}

      {stage === "job-scan" ? <Thinking kind="job-scan" /> : null}

      {stage === "job-matches" ? (
        <JobMatchScreen
          jobs={jobMatches}
          onJoin={(job) => {
            setSelectedJob(job)
            setJobDescription(
              `${job.role} — ${job.company}\n${job.location}\n\n${job.jd}`,
            )
            void startInterview(job)
          }}
          onBack={() => setStage("profile-import")}
        />
      ) : null}

      {stage === "interview" && setup ? (
        <InterviewScreen
          roleTitle={setup.roleTitle}
          company={setup.company}
          questions={questions}
          interviewer={selectedJob?.interviewer ?? "AI Interviewer"}
          interviewerRole={selectedJob?.interviewerRole ?? "Interview lead"}
          technicalInterviewer={selectedJob?.technical ?? "Technical Interviewer"}
          technicalInterviewerRole={selectedJob?.technicalRole ?? "Technical panel"}
          candidateName={candidateName(resume)}
          onNextQuestion={getFollowUp}
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

      {error && stage !== "setup" && stage !== "profile-import" ? (
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
