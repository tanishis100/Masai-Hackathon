"use client"

import { Button } from "@repo/ui/button"

import type { RiskMap, RiskItem } from "@/lib/types"

function severityClass(severity: RiskItem["severity"]) {
  if (severity === "high") return "border-red-200 bg-white/80 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"
  if (severity === "medium") return "border-amber-200 bg-white/80 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
  return "border-white/70 bg-white/80 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100"
}

export function RiskMapScreen({
  roleTitle,
  company,
  riskMap,
  onStart,
  onBack,
}: {
  roleTitle: string
  company: string
  riskMap: RiskMap
  onStart: () => void
  onBack: () => void
}) {
  const match = Math.min(100, Math.max(0, riskMap.roleMatch))

  return (
    <div className="relative mx-auto max-w-6xl px-6 py-10">
      <div className="pointer-events-none absolute -top-24 right-0 -z-10 h-96 w-96 rounded-full bg-sky-200/60 blur-3xl dark:bg-sky-900/20" />
      <p className="text-sm font-medium text-brand-700 dark:text-brand-400">Your interview risk map</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            Before we begin, here is what they may attack.
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            {roleTitle || "Target role"}
            {company ? ` · ${company}` : ""}
          </p>
        </div>
        <div className="min-w-44 rounded-[1.5rem] border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/75">
          <p className="text-xs font-semibold text-neutral-500 uppercase">Role match</p>
          <p className="mt-1 text-4xl font-bold">{Math.round(match)}%</p>
          <div className="mt-3 h-2 rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div className="h-2 rounded-full bg-brand-600" style={{ width: `${match}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {riskMap.risks.slice(0, 3).map((risk, i) => (
          <article key={i} className={`rounded-[1.5rem] border p-5 shadow-sm backdrop-blur ${severityClass(risk.severity)}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase">{risk.severity} risk</span>
              <span className="text-xs">0{i + 1}</span>
            </div>
            <h2 className="mt-3 text-lg font-semibold">{risk.title}</h2>
            <p className="mt-3 text-xs font-semibold uppercase opacity-70">Resume claim</p>
            <p className="mt-1 text-sm">{risk.resumeClaim}</p>
            <p className="mt-3 text-xs font-semibold uppercase opacity-70">Why risky</p>
            <p className="mt-1 text-sm">{risk.whyRisky}</p>
            <p className="mt-3 text-xs font-semibold uppercase opacity-70">Likely probe</p>
            <p className="mt-1 text-sm font-medium">&quot;{risk.likelyProbe}&quot;</p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <section className="rounded-[1.5rem] border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
          <h2 className="font-semibold">Strongest signals</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
            {riskMap.strongestSignals.slice(0, 4).map((signal, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-[1.5rem] border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/70">
          <h2 className="font-semibold">Interview plan</h2>
          <div className="mt-3 space-y-3">
            {riskMap.plan.slice(0, 4).map((step, i) => (
              <div key={i} className="grid grid-cols-[2rem_1fr_auto] items-start gap-3 text-sm">
                <span className="font-mono text-neutral-400">0{i + 1}</span>
                <div>
                  <p className="font-medium">{step.label}</p>
                  <p className="text-neutral-500">{step.focus}</p>
                </div>
                <span className="text-neutral-500">{step.minutes}m</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button className="px-6 py-2.5" onClick={onStart}>
          Start pressure interview
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Edit inputs
        </Button>
      </div>
    </div>
  )
}
