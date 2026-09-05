/**
 * Minimal Gemini client that runs entirely in the browser.
 *
 * The API key is supplied by the user at runtime and kept in localStorage, so
 * the repository never carries an environment variable or a server-side secret.
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models"

export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash — recommended" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite — fastest" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro — deeper feedback" },
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
    return "Your key needs attention. Open Settings and verify it again."
  if (status === 401 || status === 403)
    return "Your key does not have access yet. Verify it in Settings and try again."
  if (status === 404)
    return "This model is unavailable for your key. Choose the recommended model in Settings."
  if (status === 429)
    return "The service is busy right now. Please try again in a few seconds."
  if (status >= 500) return "The interview service is temporarily unavailable. Please try again."
  return "We could not complete that request. Please try again."
}

function pause(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

type AvailableModel = {
  name?: string
  supportedGenerationMethods?: string[]
}

const MODEL_PRIORITY = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
]

function isTextModel(id: string) {
  return id.startsWith("gemini-") && !/(image|live|tts|audio|embed|robotics)/i.test(id)
}

/** Finds a model the current key can actually call, rather than assuming one. */
export async function discoverModel(apiKey: string, preferred?: string): Promise<string> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch(ENDPOINT, {
      headers: { "x-goog-api-key": apiKey.trim() },
      signal: controller.signal,
    })
    if (!response.ok) throw new GeminiError(explain(response.status, await response.text()), response.status)
    const data = (await response.json()) as { models?: AvailableModel[] }
    const available = (data.models ?? [])
      .filter((item) => item.supportedGenerationMethods?.includes("generateContent"))
      .map((item) => item.name?.replace(/^models\//, "") ?? "")
      .filter(isTextModel)
    const ordered = [preferred, ...MODEL_PRIORITY, ...available].filter(
      (value, index, values): value is string => Boolean(value) && values.indexOf(value) === index,
    )
    const compatible = ordered.find((id) => available.includes(id))
    if (!compatible) throw new GeminiError("This key does not have a compatible text model enabled. Check its API access and try again.")
    return compatible
  } catch (error) {
    if (error instanceof GeminiError) throw error
    throw new GeminiError("We could not check the models available to this key. Please try again.")
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function generateJSON<T>(opts: {
  apiKey: string
  model: string
  system: string
  prompt: string
  schema?: Schema
  temperature?: number
  signal?: AbortSignal
}): Promise<T> {
  const { apiKey, model, system, prompt, schema, temperature = 0.8, signal } = opts

  if (!apiKey.trim()) {
    throw new GeminiError("No API key set. Open Settings and paste your Gemini key.")
  }

  let activeModel = model
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 30_000)
    const onAbort = () => controller.abort()
    signal?.addEventListener("abort", onAbort, { once: true })

    try {
      const res = await fetch(`${ENDPOINT}/${activeModel}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey.trim() },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            responseMimeType: "application/json",
            ...(schema ? { responseSchema: schema } : {}),
          },
        }),
      })

      if (!res.ok) {
        const message = explain(res.status, await res.text())
        if (attempt === 0 && res.status === 404) {
          const fallback = await discoverModel(apiKey, activeModel)
          if (fallback !== activeModel) {
            activeModel = fallback
            continue
          }
        }
        if (attempt === 0 && (res.status === 429 || res.status >= 500)) {
          await pause(700)
          continue
        }
        throw new GeminiError(message, res.status)
      }

      const data = await res.json()
      const text: string | undefined = data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text ?? "")
        .join("")
      if (!text) throw new GeminiError("We could not prepare a response this time. Please try again.")

      try {
        return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "")) as T
      } catch {
        if (attempt === 0) continue
        throw new GeminiError("We could not prepare a response this time. Please try again.")
      }
    } catch (error) {
      if (error instanceof GeminiError) throw error
      if (signal?.aborted) throw error
      if (controller.signal.aborted) {
        throw new GeminiError("That took longer than expected. Please try again.")
      }
      if (attempt === 1) throw new GeminiError("We could not connect right now. Check your connection and try again.")
      await pause(700)
    } finally {
      window.clearTimeout(timeout)
      signal?.removeEventListener("abort", onAbort)
    }
  }

  throw new GeminiError("We could not complete that request. Please try again.")
}

/** Verifies the key and returns the best model available to it. */
export async function verifyKey(apiKey: string, preferredModel: string): Promise<string> {
  const model = await discoverModel(apiKey, preferredModel)
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
  return model
}
