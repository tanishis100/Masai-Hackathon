"use client"

import { useRef, useState } from "react"
import { Button } from "@repo/ui/button"

export function ProfileImportScreen({
  resume,
  setResume,
  onContinue,
}: {
  resume: string
  setResume: (value: string) => void
  onContinue: () => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [mode, setMode] = useState<"upload" | "paste">("upload")
  const [fileName, setFileName] = useState("")
  const ready = resume.trim().length > 80

  function readFile(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setResume(String(reader.result ?? ""))
    reader.readAsText(file)
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#f7f9f8] px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mt-12 max-w-xl">
          <p className="text-sm font-semibold text-[#0a66c2]">Profile connected</p>
          <h1 className="mt-3 whitespace-nowrap text-3xl font-black tracking-tight text-neutral-950 sm:text-5xl">
            Bring your experience.
          </h1>
          <p className="mt-5 text-lg leading-8 text-neutral-600">
            Add your resume so we can match your real strengths to roles worth preparing for.
          </p>
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex gap-2 rounded-xl bg-neutral-100 p-1">
            {(["upload", "paste"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold capitalize ${mode === item ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"}`}
              >
                {item} resume
              </button>
            ))}
          </div>

          {mode === "upload" ? (
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-6 flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 text-center hover:border-[#0a66c2] hover:bg-blue-50/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl text-[#0a66c2]">↑</span>
              <span className="mt-3 font-semibold text-neutral-950">Upload your resume</span>
              <span className="mt-1 text-sm text-neutral-500">PDF, DOCX, or TXT</span>
              {fileName ? <span className="mt-3 text-xs text-[#0a66c2]">{fileName}</span> : null}
              <input
                ref={inputRef}
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) readFile(file)
                }}
              />
            </button>
          ) : (
            <textarea
              value={resume}
              onChange={(event) => setResume(event.target.value)}
              rows={9}
              placeholder="Paste your resume or LinkedIn profile text here"
              className="mt-6 w-full resize-y rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 outline-none focus:border-[#0a66c2]"
            />
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-500">Your profile is only used to personalize your prep.</p>
            <Button onClick={onContinue} disabled={!ready} className="bg-[#0a66c2] px-8 text-white hover:bg-[#004182]">
              Continue
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
