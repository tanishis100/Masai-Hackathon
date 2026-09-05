"use client"

import { useRef, useState } from "react"
import { Button } from "@repo/ui/button"

export function ProfileImportScreen({
  resume,
  setResume,
  linkedinUrl,
  setLinkedinUrl,
  onContinue,
}: {
  resume: string
  setResume: (value: string) => void
  linkedinUrl: string
  setLinkedinUrl: (value: string) => void
  onContinue: () => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [fileName, setFileName] = useState("")
  const [fileError, setFileError] = useState("")
  const ready = linkedinUrl.trim().length > 0 || resume.trim().length > 0

  /* Only plain text can be read here. A PDF or DOCX run through readAsText
     yields binary noise, which would be sent to the model as if it were a
     resume, so those are refused with an explanation instead. */
  function readFile(file: File) {
    if (!/\.(txt|md)$/i.test(file.name)) {
      setFileName("")
      setFileError(
        `${file.name} can't be read in the browser yet. Export it as .txt, or paste the text below.`,
      )
      return
    }
    setFileError("")
    setFileName(file.name)
    const reader = new FileReader()
    reader.onerror = () =>
      setFileError("That file could not be read. Paste the text below.")
    reader.onload = () => setResume(String(reader.result ?? ""))
    reader.readAsText(file)
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#f7f9f8] px-6 py-12">
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
                  {fileName || "Plain text (.txt or .md)"}
                </span>
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".txt,.md"
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
            <textarea
              value={resume}
              onChange={(event) => setResume(event.target.value)}
              rows={5}
              placeholder="Or write or paste your resume"
              className="w-full resize-y rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 outline-none focus:border-[#0a66c2]"
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-500">
              Your profile is only used to personalize your prep.
            </p>
            <Button
              onClick={onContinue}
              disabled={!ready}
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
