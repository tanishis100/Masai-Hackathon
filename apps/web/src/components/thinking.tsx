"use client"

const STEPS: Record<string, string[]> = {
  questions: [
    "Reading the job description",
    "Cross-referencing your resume",
    "Choosing what to probe",
    "Writing the questions",
  ],
  grading: [
    "Replaying the transcript",
    "Scoring each answer",
    "Weighing it against the role's bar",
    "Writing your feedback",
  ],
  cheatsheet: [
    "Finding what cost you most",
    "Pulling the topics to revise",
    "Gathering reference links",
    "Laying out the sheet",
  ],
}

export function Thinking({ kind }: { kind: keyof typeof STEPS | string }) {
  const steps = STEPS[kind] ?? STEPS.questions!
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand-500"
            style={{ animationDelay: `${i * 140}ms` }}
          />
        ))}
      </div>
      <ul className="mt-8 space-y-2.5 text-sm text-neutral-500">
        {steps.map((s, i) => (
          <li
            key={s}
            className="animate-pulse"
            style={{ animationDelay: `${i * 400}ms` }}
          >
            {s}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs text-neutral-400">
        Gemini is working. This usually takes 5–20 seconds.
      </p>
    </div>
  )
}
