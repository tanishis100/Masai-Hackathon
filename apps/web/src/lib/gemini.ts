/**
 * Minimal Gemini client that runs entirely in the browser.
 *
 * The API key is supplied by the user at runtime and kept in localStorage, so
 * the repository never carries an environment variable or a server-side secret.
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models"

export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", label: "2.5 Flash — fast, best for a timed run" },
  { id: "gemini-2.5-pro", label: "2.5 Pro — slower, sharper feedback" },
  { id: "gemini-2.0-flash", label: "2.0 Flash — cheapest fallback" },
] as const

export const DEFAULT_MODEL = "gemini-2.5-flash"

/** A trimmed-down OpenAPI schema, which is what Gemini accepts. */
export type Schema = {
  type: "OBJECT" | "ARRAY" | "STRING" | "NUMBER" | "BOOLEAN"
  description?: string
  properties?: Record<string, Schema>
  required?: string[]
  items?: Schema
  enum?: string[]
}

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = "GeminiError"
  }
}

function explain(status: number, raw: string): string {
  if (status === 400 && raw.includes("API_KEY_INVALID"))
    return "That API key was rejected. Check it in Settings."
  if (status === 401 || status === 403)
    return "Gemini refused the key. Make sure it is a Generative Language API key from aistudio.google.com."
  if (status === 429)
    return "Rate limited by Gemini. Wait a few seconds and retry, or switch to 2.0 Flash in Settings."
  if (status >= 500) return "Gemini is having a moment. Retry in a second."
  return `Gemini returned ${status}: ${raw.slice(0, 300)}`
}

export async function generateJSON<T>(opts: {
  apiKey: string
  model: string
  system: string
  prompt: string
  schema: Schema
  temperature?: number
  signal?: AbortSignal
}): Promise<T> {
  const { apiKey, model, system, prompt, schema, temperature = 0.8, signal } = opts

  if (!apiKey.trim()) {
    throw new GeminiError("No API key set. Open Settings and paste your Gemini key.")
  }

  let res: Response
  try {
    res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey.trim(),
      },
      signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
    })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new GeminiError("Could not reach Gemini. Check your network connection.")
  }

  if (!res.ok) {
    throw new GeminiError(explain(res.status, await res.text()), res.status)
  }

  const data = await res.json()
  const text: string | undefined = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("")

  if (!text) {
    const blocked = data?.promptFeedback?.blockReason
    throw new GeminiError(
      blocked
        ? `Gemini blocked the request (${blocked}). Try rephrasing the job description.`
        : "Gemini returned an empty response. Retry.",
    )
  }

  try {
    // Structured output is already bare JSON, but a fence occasionally slips in.
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T
  } catch {
    throw new GeminiError("Gemini returned malformed JSON. Retry.")
  }
}

/** Cheap round-trip used by Settings to tell a good key from a bad one. */
export async function verifyKey(apiKey: string, model: string): Promise<void> {
  await generateJSON<{ ok: boolean }>({
    apiKey,
    model,
    system: "You are a health check.",
    prompt: 'Reply with {"ok": true}.',
    temperature: 0,
    schema: {
      type: "OBJECT",
      properties: { ok: { type: "BOOLEAN" } },
      required: ["ok"],
    },
  })
}
