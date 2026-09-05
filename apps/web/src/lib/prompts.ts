import type { Schema } from "./gemini"
import type { ExperienceLevel, InterviewSetup, Question, Answer } from "./types"

const LEVEL_BRIEF: Record<ExperienceLevel, string> = {
  fresher:
    "0-1 years. Probe fundamentals, learning ability and projects. Do not ask for production war stories they cannot have.",
  intermediate:
    "2-4 years. Probe hands-on depth, debugging instincts and trade-off reasoning on real work they have shipped.",
  senior:
    "5-8 years. Probe system design, failure handling, mentoring and the judgement behind past decisions.",
  lead: "8+ years. Probe architecture strategy, cross-team influence, hiring and how they set technical direction.",
}

export const INTERVIEWER_SYSTEM = `You are a sharp, warm technical interviewer running a phone screen.
You ask one question at a time, you never flatter, and you never reveal what you are grading on.
You tailor every question to the specific job description and the candidate's actual resume -
generic questions are a failure. Reference their real projects and the JD's real requirements.`

export const QUESTION_SCHEMA: Schema = {
  type: "OBJECT",
  properties: {
    roleTitle: { type: "STRING", description: "Role title parsed from the JD" },
    company: { type: "STRING", description: "Company from the JD, or empty string" },
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          kind: {
            type: "STRING",
            enum: ["intro", "technical", "behavioural", "system-design", "role-fit"],
          },
          text: { type: "STRING", description: "The question, spoken aloud" },
          lookingFor: {
            type: "STRING",
            description: "What a strong answer contains. Never shown to the candidate.",
          },
        },
        required: ["kind", "text", "lookingFor"],
      },
    },
  },
  required: ["roleTitle", "company", "questions"],
}

export function questionPrompt(setup: InterviewSetup, count: number) {
  return `Design a ${count}-question phone screen.

CANDIDATE LEVEL: ${setup.level} — ${LEVEL_BRIEF[setup.level]}

=== JOB DESCRIPTION ===
${setup.jobDescription}

=== CANDIDATE RESUME ===
${setup.resume}

Rules:
- Question 1 is "intro": a warm opener that names something specific from their resume.
- Cover the JD's actual named technologies and responsibilities, weighted by how central they are.
- At least one question must dig into a specific project or claim on the resume by name.
- ${setup.level === "fresher" ? "Skip system design; favour fundamentals and project depth." : "Include one system-design or architecture question scaled to their level."}
- Include one behavioural question grounded in the JD's team context.
- Each question is one or two sentences, conversational, as if spoken on a call.
- No numbering, no preamble in the question text.`
}

export const FEEDBACK_SCHEMA: Schema = {
  type: "OBJECT",
  properties: {
    overall: { type: "NUMBER", description: "0-100 overall score" },
    headline: { type: "STRING", description: "One blunt sentence on where they stand" },
    summary: { type: "STRING", description: "2-3 sentence overall read" },
    dimensions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          score: { type: "NUMBER", description: "0-100" },
          note: { type: "STRING" },
        },
        required: ["name", "score", "note"],
      },
    },
    strengths: { type: "ARRAY", items: { type: "STRING" } },
    gaps: { type: "ARRAY", items: { type: "STRING" } },
    perQuestion: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          questionId: { type: "STRING" },
          score: { type: "NUMBER", description: "0-100" },
          verdict: { type: "STRING", description: "1-2 sentences on this answer" },
          missed: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Concrete points a strong answer would have hit",
          },
        },
        required: ["questionId", "score", "verdict", "missed"],
      },
    },
  },
  required: [
    "overall",
    "headline",
    "summary",
    "dimensions",
    "strengths",
    "gaps",
    "perQuestion",
  ],
}

export function feedbackPrompt(
  setup: InterviewSetup,
  questions: Question[],
  answers: Answer[],
) {
  const transcript = questions
    .map((q, i) => {
      const a = answers.find((x) => x.questionId === q.id)
      return `[${q.id}] (${q.kind}) Q${i + 1}: ${q.text}
GRADING TARGET: ${q.lookingFor}
CANDIDATE (${a?.seconds ?? 0}s): ${a?.text?.trim() || "(no answer given)"}`
    })
    .join("\n\n")

  return `Grade this ${setup.level}-level phone screen for "${setup.roleTitle}".

=== JOB DESCRIPTION ===
${setup.jobDescription}

=== TRANSCRIPT ===
${transcript}

Rules:
- Grade against the JD's bar for a ${setup.level} candidate, not an absolute ideal.
- Score every question by its questionId exactly as given in brackets.
- An unanswered or empty question scores below 20.
- Use exactly these four dimensions: "Technical depth", "Communication", "Role fit", "Structure".
- Be specific and quote the candidate where it helps. No flattery, no hedging.
- "missed" must name concrete things, not vague advice like "add more detail".`
}

export const CHEATSHEET_SCHEMA: Schema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    intro: { type: "STRING", description: "2 sentences on how to use this" },
    sections: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          topic: { type: "STRING" },
          whyItMatters: {
            type: "STRING",
            description: "Tie it to the JD or to how they answered",
          },
          keyPoints: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Dense, factual revision notes - not study advice",
          },
          links: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                label: { type: "STRING" },
                url: { type: "STRING" },
                why: { type: "STRING" },
              },
              required: ["label", "url", "why"],
            },
          },
        },
        required: ["topic", "whyItMatters", "keyPoints", "links"],
      },
    },
    quickWins: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Things fixable before the next interview",
    },
  },
  required: ["title", "intro", "sections", "quickWins"],
}

export function cheatSheetPrompt(
  setup: InterviewSetup,
  gaps: string[],
  weakTopics: string[],
) {
  return `Write a revision cheat sheet for a ${setup.level} candidate interviewing for "${setup.roleTitle}".

=== JOB DESCRIPTION ===
${setup.jobDescription}

=== WHERE THEY FELL SHORT ===
${gaps.map((g) => `- ${g}`).join("\n")}

=== WEAKEST QUESTIONS ===
${weakTopics.map((t) => `- ${t}`).join("\n")}

Rules:
- 4 to 6 sections, ordered by what would move their score most.
- keyPoints are dense factual notes they can revise from cold - definitions, numbers,
  commands, trade-offs. Not "practice more" or "read the docs".
- 2 to 4 links per section.
- CRITICAL: only use URLs you are confident exist and are stable. Prefer official
  documentation (developer.mozilla.org, nodejs.org/docs, react.dev, docs.python.org,
  kubernetes.io/docs, postgresql.org/docs), well-known references
  (refactoring.guru, roadmap.sh, github.com/donnemartin/system-design-primer),
  and canonical sources. Link to a section's landing page rather than guessing a deep
  anchor. Never invent a blog post URL, a Medium link, or a video ID.
- Every link needs a "why" saying what to read it for.`
}
