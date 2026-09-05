"use client"

import { useCallback, useSyncExternalStore } from "react"

import { DEFAULT_MODEL } from "@/lib/gemini"
import { settingsStore, subscribe } from "@/lib/storage"

/**
 * Reads persisted settings through useSyncExternalStore, which gives the
 * server snapshot ("" / the default model) during prerender and the real
 * localStorage value on the client without a setState-in-effect round trip.
 */
export function useSettings() {
  const apiKey = useSyncExternalStore(subscribe, settingsStore.getKey, () => "")
  const model = useSyncExternalStore(
    subscribe,
    settingsStore.getModel,
    () => DEFAULT_MODEL,
  )
  const loaded = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  )

  const setApiKey = useCallback((v: string) => settingsStore.setKey(v), [])
  const setModel = useCallback((v: string) => settingsStore.setModel(v), [])
  const clearKey = useCallback(() => settingsStore.clearKey(), [])

  return { apiKey, setApiKey, model, setModel, clearKey, loaded }
}
