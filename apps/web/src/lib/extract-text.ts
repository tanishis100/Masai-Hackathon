"use client"

/**
 * Pulls plain text out of a resume file in the browser.
 *
 * Parsing happens client-side so the app keeps its no-server, no-env-var
 * shape: the file never leaves the user's machine. The heavy parsers are
 * imported on demand so they stay out of the initial bundle.
 */

export class UnsupportedFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnsupportedFileError"
  }
}

function extensionOf(name: string) {
  const dot = name.lastIndexOf(".")
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase()
}

/* pdf.js emits each word as its own item, and many PDFs also carry their own
   spacing items, so a naive join leaves runs of whitespace. */
function squash(line: string) {
  return line.replace(/\s+/g, " ").trim()
}

async function fromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist")

  // Turbopack resolves this to a hashed asset URL at build time; without it
  // pdf.js tries to fetch a worker from a path that does not exist in .next.
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString()

  const data = new Uint8Array(await file.arrayBuffer())
  const task = pdfjs.getDocument({ data })
  const doc = await task.promise

  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    // Items carry no line breaks, so rebuild them from the y coordinate.
    let lastY: number | null = null
    let line = ""
    const lines: string[] = []
    for (const item of content.items) {
      if (!("str" in item)) continue
      const y = item.transform?.[5] ?? null
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
        lines.push(squash(line))
        line = ""
      }
      line += item.str + (item.hasEOL ? "\n" : " ")
      lastY = y
    }
    if (line.trim()) lines.push(squash(line))
    pages.push(lines.filter(Boolean).join("\n"))
  }

  // destroy() lives on the loading task in pdf.js v6 and tears down the worker.
  await task.destroy()
  return pages
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

async function fromDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth")
  const { value } = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  })
  return value.replace(/\n{3,}/g, "\n\n").trim()
}

function fromPlainText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("That file could not be read."))
    reader.onload = () => resolve(String(reader.result ?? "").trim())
    reader.readAsText(file)
  })
}

export const ACCEPTED_FILE_TYPES = ".txt,.md,.pdf,.docx"

export async function extractResumeText(file: File): Promise<string> {
  const ext = extensionOf(file.name)

  if (ext === "pdf") return fromPdf(file)
  if (ext === "docx") return fromDocx(file)
  if (ext === "txt" || ext === "md" || ext === "") return fromPlainText(file)

  if (ext === "doc") {
    // The legacy binary .doc format has no practical browser parser.
    throw new UnsupportedFileError(
      "Old .doc files can't be read in the browser. Save it as .docx or PDF and try again.",
    )
  }

  if (ext === "pages") {
    throw new UnsupportedFileError(
      "Pages files can't be read directly. Export as PDF or DOCX and try again.",
    )
  }

  throw new UnsupportedFileError(
    `.${ext} files aren't supported. Use a PDF, DOCX, or plain text file.`,
  )
}
