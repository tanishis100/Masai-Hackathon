"use client"

import { useState } from "react"
import { Button } from "@repo/ui/button"

import type { CheatSheet } from "@/lib/types"

export function toMarkdown(sheet: CheatSheet, roleTitle: string): string {
  const lines: string[] = [
    `# ${sheet.title}`,
    "",
    `_Prep sheet for: ${roleTitle || "your target role"}_`,
    "",
    sheet.intro,
    "",
  ]

  sheet.sections.forEach((s, i) => {
    lines.push(`## ${i + 1}. ${s.topic}`, "", `**Why it matters:** ${s.whyItMatters}`, "")
    s.keyPoints.forEach((p) => lines.push(`- ${p}`))
    lines.push("", "**Read next**", "")
    s.links.forEach((l) => lines.push(`- [${l.label}](${l.url}) — ${l.why}`))
    lines.push("")
  })

  if (sheet.quickWins.length) {
    lines.push("## Quick wins before your next round", "")
    sheet.quickWins.forEach((q) => lines.push(`- ${q}`))
    lines.push("")
  }

  return lines.join("\n")
}

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function CheatSheetScreen({
  sheet,
  roleTitle,
  onBack,
  onRestart,
}: {
  sheet: CheatSheet
  roleTitle: string
  onBack: () => void
  onRestart: () => void
}) {
  const [copied, setCopied] = useState(false)

  const md = toMarkdown(sheet, roleTitle)

  async function copy() {
    try {
      await navigator.clipboard.writeText(md)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  function download() {
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${sheet.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <p className="text-sm font-medium text-brand-600">Your cheat sheet</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{sheet.title}</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">{sheet.intro}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={download}>Download as Markdown</Button>
        <Button variant="secondary" onClick={copy}>
          {copied ? "Copied" : "Copy to clipboard"}
        </Button>
        <Button variant="ghost" onClick={onBack}>
          Back to feedback
        </Button>
      </div>

      <div className="mt-10 space-y-10">
        {sheet.sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-semibold">
              <span className="text-neutral-400">{i + 1}.</span> {s.topic}
            </h2>
            <p className="mt-1.5 text-sm text-neutral-600 italic dark:text-neutral-400">
              {s.whyItMatters}
            </p>

            <ul className="mt-4 space-y-2">
              {s.keyPoints.map((p, j) => (
                <li key={j} className="flex gap-2.5 text-[15px] leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2">
              {s.links.map((l, j) => (
                <a
                  key={j}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-neutral-200 p-3 transition-colors hover:border-brand-500 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-brand-600">{l.label}</span>
                    <span className="shrink-0 font-mono text-xs text-neutral-500">
                      {host(l.url)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {l.why}
                  </p>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>

      {sheet.quickWins.length ? (
        <section className="mt-12 rounded-xl border border-brand-500/40 bg-brand-50 p-5 dark:bg-brand-500/10">
          <h2 className="font-semibold">Quick wins before your next round</h2>
          <ul className="mt-3 space-y-2 text-[15px]">
            {sheet.quickWins.map((q, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="text-brand-600">→</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-10">
        <Button variant="secondary" onClick={onRestart}>
          Run another interview
        </Button>
      </div>
    </div>
  )
}
