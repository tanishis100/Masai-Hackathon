"use client"

import { useRef, useState } from "react"
import { Button } from "@repo/ui/button"

import {
  ACCEPTED_FILE_TYPES,
  UnsupportedFileError,
  extractResumeText,
} from "@/lib/extract-text"

function MarkdownPreview({ value }: { value: string }) {
  return (
    <div className="max-h-80 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-5 text-sm leading-6 text-neutral-700">
      {value.split("\n").map((line, index) => {
        const content = line.trim()
        if (!content) return <div key={index} className="h-4" />
        if (content.startsWith("# ")) return <h2 key={index} className="text-xl font-bold text-neutral-950">{content.slice(2)}</h2>
        if (content.startsWith("## ")) return <h3 key={index} className="mt-3 text-sm font-bold text-[#0a66c2]">{content.slice(3)}</h3>
        if (content.startsWith("- ")) return <p key={index} className="flex gap-2"><span className="text-[#0a66c2]">•</span><span>{content.slice(2)}</span></p>
        if (content.startsWith("**") && content.endsWith("**")) return <p key={index} className="font-semibold text-neutral-950">{content.slice(2, -2)}</p>
        return <p key={index}>{content}</p>
      })}
    </div>
  )
}

export function ProfileImportScreen({
  resume,
  setResume,
  linkedinUrl,
  setLinkedinUrl,
  onContinue,
  error,
}: {
  resume: string
  setResume: (value: string) => void
  linkedinUrl: string
  setLinkedinUrl: (value: string) => void
  onContinue: () => void
  error: string | null
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [fileName, setFileName] = useState("")
  const [fileError, setFileError] = useState("")
  const [parsing, setParsing] = useState(false)
  const [manualResume, setManualResume] = useState("")
  const ready = linkedinUrl.trim().length > 0 || resume.trim().length > 0

  /* PDF and DOCX are parsed properly rather than read as text - reading either
     with readAsText yields binary noise. Parsing runs in the browser, so the
     file never leaves the machine. */
  async function readFile(file: File) {
    setFileError("")
    setParsing(true)
    setFileName(file.name)
    try {
      const text = await extractResumeText(file)
      if (!text) {
        setFileName("")
        setFileError(
          "No text was found in that file. Upload a text-based PDF, DOCX, TXT, or MD resume.",
        )
        return
      }
      setManualResume(text)
      setResume(text)
    } catch (error) {
      setFileName("")
      setFileError(
        error instanceof UnsupportedFileError
          ? error.message
          : "That file could not be read. Upload a text-based PDF, DOCX, TXT, or MD resume.",
      )
    } finally {
      setParsing(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9f8] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mt-12 max-w-xl">
          <p className="text-sm font-semibold text-[#0a66c2]">Your details</p>
          <h1 className="mt-3 whitespace-nowrap text-3xl font-black tracking-tight text-neutral-950 sm:text-5xl">
            Bring your experience.
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-600">
            Add your resume so we can match your real strengths to roles worth preparing
            for.
          </p>
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mt-6 space-y-3">
            <input
              value={linkedinUrl}
              onChange={(event) => setLinkedinUrl(event.target.value)}
              placeholder="Add your LinkedIn profile link"
              className="h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none focus:border-[#0a66c2]"
            />
            <button
              onClick={() => inputRef.current?.click()}
              className="flex h-16 w-full items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 text-left hover:border-[#0a66c2] hover:bg-blue-50/40"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-lg text-[#0a66c2]">
                ↑
              </span>
              <span>
                <span className="block text-sm font-semibold text-neutral-950">
                  Upload resume
                </span>
                <span className="block text-xs text-neutral-500">
                  {parsing ? "Reading…" : fileName || "PDF, DOCX, TXT, or MD"}
                </span>
              </span>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) readFile(file)
                  event.target.value = ""
                }}
              />
            </button>
            {fileError ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
                {fileError}
              </p>
            ) : null}
            {error ? (
              <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {error}
              </p>
            ) : null}
            <div>
              <label htmlFor="manual-resume" className="mb-2 block text-sm font-semibold text-neutral-950">
                Or write your resume manually
              </label>
              <textarea
                id="manual-resume"
                value={manualResume}
                onChange={(event) => {
                  const value = event.target.value
                  setManualResume(value)
                  setResume(value)
                }}
                rows={7}
                placeholder=""
                className="w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm leading-6 outline-none focus:border-[#0a66c2]"
              />
              {manualResume.trim() ? (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Formatted resume</p>
                  <MarkdownPreview value={manualResume} />
                </div>
              ) : null}
            </div>
            {resume.trim() ? (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                Resume ready. Your profile details will be used for personalized roles and interview questions.
              </p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-500">
              Your profile is only used to personalize your prep.
            </p>
            <Button
              onClick={onContinue}
              disabled={!ready || parsing}
              className="bg-[#0a66c2] px-8 text-white hover:bg-[#004182]"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
