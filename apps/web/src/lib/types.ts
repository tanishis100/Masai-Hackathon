export type ExperienceLevel = "fresher" | "intermediate" | "senior" | "lead"
export type InterviewMode = "practice" | "challenging" | "pressure"

export const EXPERIENCE_LEVELS: {
  value: ExperienceLevel
  label: string
  hint: string
}[] = [
  { value: "fresher", label: "Fresher", hint: "0–1 yrs · fundamentals first" },
  { value: "intermediate", label: "Intermediate", hint: "2–4 yrs · depth + trade-offs" },
  { value: "senior", label: "Senior", hint: "5–8 yrs · design + ownership" },
  { value: "lead", label: "Lead / Staff", hint: "8+ yrs · strategy + influence" },
]

export type QuestionKind =
  "intro" | "technical" | "behavioural" | "system-design" | "role-fit"

export type Question = {
  id: string
  kind: QuestionKind
  text: string
  /** What a strong answer contains — used to grade, never shown before answering. */
  lookingFor: string
  pressureTarget?: string
}

export type Answer = {
  questionId: string
  text: string
  /** Seconds spent on this answer. */
  seconds: number
}

export type PerQuestionScore = {
  questionId: string
  score: number
  verdict: string
  missed: string[]
}

export type Feedback = {
  overall: number
  headline: string
  summary: string
  dimensions: { name: string; score: number; note: string }[]
  strengths: string[]
  gaps: string[]
  perQuestion: PerQuestionScore[]
}

export type RiskItem = {
  severity: "high" | "medium" | "low"
  title: string
  resumeClaim: string
  whyRisky: string
  likelyProbe: string
}

export type InterviewPlanItem = {
  label: string
  minutes: number
  focus: string
}

export type RiskMap = {
  roleMatch: number
  strongestSignals: string[]
  risks: RiskItem[]
  plan: InterviewPlanItem[]
}

export type CheatSheetLink = {
  label: string
  url: string
  why: string
}

export type CheatSheetSection = {
  topic: string
  whyItMatters: string
  keyPoints: string[]
  links: CheatSheetLink[]
}

export type CheatSheet = {
  title: string
  intro: string
  sections: CheatSheetSection[]
  quickWins: string[]
}

export type InterviewSetup = {
  jobDescription: string
  resume: string
  level: ExperienceLevel
  mode: InterviewMode
  roleTitle: string
  company: string
}

export type Stage =
  | "setup"
  | "profile-import"
  | "job-scan"
  | "job-matches"
  | "call"
  | "risk-map"
  | "interview"
  | "grading"
  | "feedback"
  | "cheatsheet"
