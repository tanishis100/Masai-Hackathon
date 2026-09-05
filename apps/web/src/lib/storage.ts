"use client"

import { DEFAULT_MODEL } from "./gemini"

/**
 * Everything the app persists lives in localStorage, on the user's own machine.
 * The Gemini key is never sent anywhere except directly to Google's API.
 *
 * localStorage is an external store, so it is exposed here with a
 * subscribe/getSnapshot pair that React's useSyncExternalStore can read safely
 * across hydration (and, as a bonus, keeps two open tabs in step).
 */
const KEY_API = "ipp.gemini.key"
const KEY_MODEL = "ipp.gemini.model"
const KEY_DRAFT = "ipp.draft"

const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* private mode, quota, blocked storage - the app still works in-memory */
  }
  emit()
}

function remove(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
  emit()
}

export const settingsStore = {
  getKey: () => read(KEY_API) ?? "",
  setKey: (v: string) => write(KEY_API, v),
  clearKey: () => remove(KEY_API),
  getModel: () => read(KEY_MODEL) ?? DEFAULT_MODEL,
  setModel: (v: string) => write(KEY_MODEL, v),
}

export type Draft = {
  jobDescription: string
  resume: string
  level: string
}

export const draftStore = {
  get(): Draft | null {
    const raw = read(KEY_DRAFT)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Draft
    } catch {
      return null
    }
  },
  set(draft: Draft) {
    write(KEY_DRAFT, JSON.stringify(draft))
  },
}
