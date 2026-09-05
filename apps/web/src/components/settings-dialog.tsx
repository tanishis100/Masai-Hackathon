"use client"

import { useEffect, useState } from "react"
import { Button } from "@repo/ui/button"

import { GEMINI_MODELS, verifyKey } from "@/lib/gemini"

type Props = {
  onClose: () => void
  apiKey: string
  setApiKey: (v: string) => void
  model: string
  setModel: (v: string) => void
  clearKey: () => void
}

/** Mounted only while open, so opening always starts from fresh props. */
export function SettingsDialog({
  onClose,
  apiKey,
  setApiKey,
  model,
  setModel,
  clearKey,
}: Props) {
  const [draft, setDraft] = useState(apiKey)
  const [reveal, setReveal] = useState(false)
  const [state, setState] = useState<"idle" | "checking" | "ok" | "bad">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  async function save() {
    setState("checking")
    setMessage("")
    try {
      await verifyKey(draft, model)
      setApiKey(draft)
      setState("ok")
      setMessage("Key works. You're ready to go.")
      setTimeout(onClose, 700)
    } catch (err) {
      setState("bad")
      setMessage(err instanceof Error ? err.message : "Could not verify that key.")
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Your key is stored only in this browser and is sent straight to Google. It never
          touches a server of ours — there is no server.
        </p>

        <label className="mt-5 block text-sm font-medium" htmlFor="gemini-key">
          Gemini API key
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="gemini-key"
            type={reveal ? "text" : "password"}
            value={draft}
            autoComplete="off"
            spellCheck={false}
            placeholder="AIza..."
            onChange={(e) => {
              setDraft(e.target.value)
              setState("idle")
            }}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
          <Button variant="secondary" onClick={() => setReveal((r) => !r)}>
            {reveal ? "Hide" : "Show"}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-neutral-500">
          Get one free at{" "}
          <a
            className="text-brand-600 underline"
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
          >
            aistudio.google.com/apikey
          </a>
        </p>

        <label className="mt-5 block text-sm font-medium" htmlFor="gemini-model">
          Model
        </label>
        <select
          id="gemini-model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 dark:border-neutral-700 dark:bg-neutral-900"
        >
          {GEMINI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        {message ? (
          <p
            className={`mt-4 rounded-md px-3 py-2 text-sm ${
              state === "ok"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {message}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            className="text-sm text-neutral-500 underline hover:text-red-600"
            onClick={() => {
              clearKey()
              setDraft("")
              setState("idle")
              setMessage("Key removed from this browser.")
            }}
          >
            Forget key
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={state === "checking" || !draft.trim()}>
              {state === "checking" ? "Verifying…" : "Verify & save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
