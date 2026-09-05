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
          pressureTarget: {
            type: "STRING",
            description:
              "Specific resume claim, gap, or risk this question stress-tests.",
          },
        },
        required: ["kind", "text", "lookingFor", "pressureTarget"],
      },
    },
  },
  required: ["roleTitle", "company", "questions"],
}

export const RISK_MAP_SCHEMA: Schema = {
  type: "OBJECT",
  properties: {
    roleMatch: { type: "NUMBER", description: "0-100 estimate of JD/resume match" },
    strongestSignals: { type: "ARRAY", items: { type: "STRING" } },
    risks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          severity: { type: "STRING", enum: ["high", "medium", "low"] },
          title: { type: "STRING" },
          resumeClaim: { type: "STRING" },
          whyRisky: { type: "STRING" },
          likelyProbe: { type: "STRING" },
        },
        required: ["severity", "title", "resumeClaim", "whyRisky", "likelyProbe"],
      },
    },
    plan: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING" },
          minutes: { type: "NUMBER" },
          focus: { type: "STRING" },
        },
        required: ["label", "minutes", "focus"],
      },
    },
  },
  required: ["roleMatch", "strongestSignals", "risks", "plan"],
}

export const JOB_MATCH_SCHEMA: Schema = {
  type: "OBJECT",
  properties: {
    jobs: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          company: { type: "STRING" },
          logo: {
            type: "STRING",
            description: "One uppercase letter or short symbol for the company badge",
          },
          logoClass: {
            type: "STRING",
            enum: [
              "bg-[#0a66c2]",
              "bg-neutral-950",
              "bg-[#1868db]",
              "bg-emerald-700",
              "bg-rose-700",
              "bg-cyan-700",
            ],
          },
          role: { type: "STRING" },
          location: { type: "STRING" },
          match: { type: "NUMBER", description: "0-100 fit score" },
          interviewer: {
            type: "STRING",
            description: "Likely hiring manager title, not a fabricated person name",
          },
          interviewerRole: { type: "STRING" },
          email: {
            type: "STRING",
            description: "Company careers URL or hiring channel, not a fabricated email",
          },
          technical: {
            type: "STRING",
            description: "Likely technical interview title, not a fabricated person name",
          },
          technicalRole: { type: "STRING" },
          technicalEmail: {
            type: "STRING",
            description: "Company engineering/careers URL or hiring channel",
          },
          jd: {
            type: "STRING",
            description: "Concise role summary and why it matches the resume",
          },
        },
        required: [
          "company",
          "logo",
          "logoClass",
          "role",
          "location",
          "match",
          "interviewer",
          "interviewerRole",
          "email",
          "technical",
          "technicalRole",
          "technicalEmail",
          "jd",
        ],
      },
    },
  },
  required: ["jobs"],
}

export function jobMatchPrompt(input: {
  resume: string
  linkedinUrl: string
  level: ExperienceLevel
}) {
  return `Create personalized interview-prep job matches from the candidate profile.

CANDIDATE LEVEL: ${input.level} — ${LEVEL_BRIEF[input.level]}
LINKEDIN URL, IF PROVIDED: ${input.linkedinUrl || "(none)"}

=== CANDIDATE PROFILE / RESUME TEXT ===
${input.resume || "(none pasted)"}

Rules:
- Return exactly 5 job matches.
- Determine the candidate's primary discipline from the resume before selecting roles. A developer must receive developer roles; a product/UX designer must receive design roles; a data candidate must receive data roles. Never mix unrelated disciplines just to fill the list.
- Use the candidate's strongest stated tools and experience to choose the role family and seniority.
- Base every match on skills, seniority, domain signals, projects, and location hints in the profile.
- Prefer recognizable companies and realistic role families for the profile, but do not claim you verified a live opening.
- Do not invent personal names, personal email addresses, salary, requisition IDs, or exact posting dates.
- Put likely panel roles in interviewer/technical, e.g. "Hiring Manager" and "Frontend Tech Lead".
- Put a stable careers page or hiring channel in email/technicalEmail, e.g. "careers.google.com".
- jd must explain the role and the resume evidence behind the match in 1-2 product-card sentences.
- Sort jobs by match descending.
- Match scores should be realistic; avoid putting every role above 90 unless the fit is unusually exact.`
}

export function riskMapPrompt(setup: InterviewSetup) {
  return `Create a pre-interview risk map before a mock interview.

CANDIDATE LEVEL: ${setup.level} — ${LEVEL_BRIEF[setup.level]}
INTERVIEW MODE: ${setup.mode}

=== JOB DESCRIPTION ===
${setup.jobDescription}

=== CANDIDATE RESUME ===
${setup.resume}

Rules:
- Extract the 3 strongest resume/JD fit signals.
- Extract exactly 3 interview risks a real interviewer would probably challenge.
- At least one risk must be a concrete resume claim that needs defense.
- likelyProbe should be phrased as the interviewer question.
- Keep every field short enough for a product UI card.
- The plan should have 4 concise interview sections with realistic minute estimates.`
}

export function questionPrompt(setup: InterviewSetup, count: number) {
  return `Design exactly ${count} opening question for an adaptive phone screen.

CANDIDATE LEVEL: ${setup.level} — ${LEVEL_BRIEF[setup.level]}
INTERVIEW MODE: ${setup.mode}

=== JOB DESCRIPTION ===
${setup.jobDescription}

=== CANDIDATE RESUME ===
${setup.resume}

Rules:
- The opening question is "intro": a warm opener that names something specific from their resume.
- Use kind "intro", "behavioural", or "role-fit" for a hiring-manager question; use "technical" or "system-design" for a technical-panel question.
- Cover a concrete project, achievement, or claim from the resume and connect it to a named JD requirement.
- The question must be one short sentence, ideally 8-16 words. Do not ask a second question.
- pressureTarget names the exact claim, gap, or competency being tested.
- No numbering, no preamble in the question text.`
}

export function followUpQuestionPrompt(
  setup: InterviewSetup,
  questions: Question[],
  answers: Answer[],
  nextNumber: number,
) {
  const transcript = questions
    .map((question, index) => {
      const answer = answers.find((item) => item.questionId === question.id)
      return `Q${index + 1}: ${question.text}\nA${index + 1}: ${answer?.text.trim() || "(skipped)"}`
    })
    .join("\n\n")

  return `Ask exactly one adaptive follow-up question: question ${nextNumber} of 5.

CANDIDATE LEVEL: ${setup.level} — ${LEVEL_BRIEF[setup.level]}
INTERVIEW MODE: ${setup.mode}

=== JOB DESCRIPTION ===
${setup.jobDescription}

=== CANDIDATE RESUME ===
${setup.resume}

=== INTERVIEW SO FAR ===
${transcript}

Rules:
- Ask one new, natural question that directly follows the candidate's latest answer. Do not repeat a question or ask a generic list question.
- Probe an unsupported claim, metric, ownership boundary, technical decision, trade-off, or JD requirement revealed in the answer.
- Keep a coherent five-question arc: experience proof, technical depth, decision or trade-off, behavioural pressure test, and role fit.
- Use kind "intro", "behavioural", or "role-fit" for a hiring-manager question; use "technical" or "system-design" for a technical-panel question.
- ${setup.mode === "pressure" ? "Be direct about vague evidence or unclear ownership." : "Be challenging but constructive."}
- ${setup.level === "fresher" ? "Favor fundamentals and project depth over production leadership claims." : "Scale system and ownership depth to the candidate's level."}
- The question must be one short sentence, ideally 8-16 words. Do not ask a second question.
- pressureTarget names the exact claim, gap, or competency being tested.
- No numbering, preamble, feedback, or grading commentary.`
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

  return `Grade this ${setup.level}-level ${setup.mode} phone screen for "${setup.roleTitle}".

=== JOB DESCRIPTION ===
${setup.jobDescription}

=== TRANSCRIPT ===
${transcript}

Rules:
- Grade against the JD's bar for a ${setup.level} candidate, not an absolute ideal.
- Score every question by its questionId exactly as given in brackets.
- An unanswered or empty question scores below 20.
- Use exactly these four dimensions: "Technical depth", "Communication", "Role fit", "Structure".
- Call out weak ownership, missing evidence, and contradiction risk when present.
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
