"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@repo/ui/button"

function MicIcon({ muted = false }: { muted?: boolean }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" />{muted ? <path d="m4 4 16 16" /> : null}</svg>
}

function CameraIcon({ hidden = false }: { hidden?: boolean }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m16 13 5 3V8l-5 3" /><rect x="2" y="6" width="14" height="12" rx="2" />{hidden ? <path d="m4 4 16 16" /> : null}</svg>
}

function CaptionIcon({ active }: { active: boolean }) {
  return <span aria-hidden="true" className={`text-xs font-bold tracking-tight ${active ? "underline" : ""}`}>CC</span>
}

function formatTime(total: number) {
  const minutes = Math.floor(total / 60).toString().padStart(2, "0")
  const seconds = (total % 60).toString().padStart(2, "0")
  return `${minutes}:${seconds}`
}

function PermissionButton({ type, enabled, onToggle }: { type: "mic" | "camera"; enabled: boolean; onToggle: () => void }) {
  return <button onClick={onToggle} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${enabled ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/15 bg-white/5"}`} aria-pressed={enabled}><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">{type === "mic" ? <MicIcon muted={!enabled} /> : <CameraIcon hidden={!enabled} />}</span><span><span className="block text-sm font-semibold">{type === "mic" ? "Microphone" : "Camera"}</span><span className="mt-1 block text-xs text-white/55">{enabled ? "Ready to use" : "Turned off"}</span></span></button>
}

export function CallScreen({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const [mic, setMic] = useState(true)
  const [camera, setCamera] = useState(true)
  const [captions, setCaptions] = useState(true)
  const [permissionError, setPermissionError] = useState("")
  const [requested, setRequested] = useState(false)
  const [permissionState, setPermissionState] = useState<"ready" | "denied">("ready")
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!requested) return
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [requested])

  async function requestPermissions() {
    setPermissionError("")
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera and microphone access is unavailable in this browser.")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: mic, video: camera })
      stream.getTracks().forEach((track) => track.stop())
      setPermissionState("ready")
      setRequested(true)
    } catch (error) {
      setPermissionState("denied")
      setPermissionError(error instanceof Error ? error.message : "Permission was not granted. Try again to join the call.")
    }
  }

  if (requested) {
    return <main className="min-h-screen bg-[#202124] p-3 text-white sm:p-5"><div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl flex-col gap-4"><div className="flex shrink-0 items-center justify-between"><div><p className="text-lg font-semibold">Frontend Engineer interview</p><p className="text-sm text-white/60">Nimbus Analytics · {formatTime(elapsed)}</p></div><span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">Private practice room</span></div><div className="grid min-h-0 flex-1 gap-3 md:grid-cols-3"><div className="relative flex min-h-48 items-center justify-center rounded-2xl bg-[#3c4043] text-5xl font-bold md:min-h-0"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0a66c2]">AM</div><span className="absolute bottom-3 left-3 rounded bg-black/45 px-2 py-1 text-xs">Aarav Mehta · Hiring Manager</span></div><div className="relative flex min-h-48 items-center justify-center rounded-2xl bg-[#3c4043] text-5xl font-bold md:min-h-0"><div className="relative h-20 w-20 overflow-hidden rounded-full"><Image src="/interviewer-sana.png" alt="Sana Kapoor" fill className="object-cover" /></div><span className="absolute bottom-3 left-3 rounded bg-black/45 px-2 py-1 text-xs">Sana Kapoor · Technical Lead</span></div><div className="relative flex min-h-48 items-center justify-center rounded-2xl bg-[#303134] text-5xl font-bold md:min-h-0"><span>{camera ? "You" : "Camera off"}</span><span className="absolute bottom-3 left-3 rounded bg-black/45 px-2 py-1 text-xs">You</span></div></div><div className="grid shrink-0 gap-3 lg:grid-cols-[1fr_0.82fr]"><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-bold uppercase tracking-wider text-white/50">Live caption</p><p className="mt-2 text-base sm:text-lg">“Walk us through the performance improvement you made to the dashboard.”</p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-bold uppercase tracking-wider text-white/50">Question asked</p><p className="mt-2 text-sm leading-6 text-white/75">Tell us what you personally owned, how you measured the result, and what you would change now.</p></div></div><div className="sticky bottom-0 flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-[#202124]/95 py-3 backdrop-blur sm:gap-3"><button onClick={() => setMic(!mic)} className={`flex h-11 items-center gap-2 rounded-full px-4 text-sm ${mic ? "bg-white/15" : "bg-red-500"}`} aria-label={mic ? "Mute microphone" : "Unmute microphone"}><MicIcon muted={!mic} />{mic ? "Mute" : "Unmute"}</button><button onClick={() => setCamera(!camera)} className={`flex h-11 items-center gap-2 rounded-full px-4 text-sm ${camera ? "bg-white/15" : "bg-red-500"}`} aria-label={camera ? "Hide video" : "Show video"}><CameraIcon hidden={!camera} />{camera ? "Hide video" : "Show video"}</button><button onClick={() => setCaptions(!captions)} className={`flex h-11 items-center gap-2 rounded-full px-4 text-sm ${captions ? "bg-white/15" : "bg-white/5"}`} aria-pressed={captions}><CaptionIcon active={captions} />Captions</button><Button onClick={onStart} className="h-11 bg-emerald-500 px-6 text-white hover:bg-emerald-600">Begin interview</Button><button onClick={onBack} className="h-11 rounded-full bg-red-500 px-5 text-sm font-semibold">End call</button></div></div></main>
  }

  return <main className="min-h-[calc(100vh-65px)] bg-[#202124] px-6 py-10 text-white"><div className="mx-auto max-w-2xl text-center"><p className="text-sm text-white/60">Incoming interview call</p><h1 className="mt-2 text-3xl font-bold">Your interview panel is ready.</h1><p className="mt-3 text-white/65">Aarav and Sana will challenge your profile in a realistic practice room.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-left"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0a66c2] font-bold">AM</div><div><p className="font-semibold">Aarav Mehta</p><p className="text-xs text-white/55">Hiring Manager</p></div></div><div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-left"><div className="relative h-12 w-12 overflow-hidden rounded-full"><Image src="/interviewer-sana.png" alt="Sana Kapoor" fill className="object-cover" /></div><div><p className="font-semibold">Sana Kapoor</p><p className="text-xs text-white/55">Technical Lead</p></div></div></div><div className="mt-6 grid gap-3 text-left sm:grid-cols-2"><PermissionButton type="mic" enabled={mic} onToggle={() => setMic(!mic)} /><PermissionButton type="camera" enabled={camera} onToggle={() => setCamera(!camera)} /></div>{permissionError ? <div className="mt-4 rounded-xl bg-red-500/15 p-4 text-left text-sm text-red-200"><p>{permissionError}</p><button onClick={requestPermissions} className="mt-3 font-semibold underline">Try permissions again</button></div> : null}<Button onClick={requestPermissions} className="mt-8 w-full bg-[#0a66c2] text-white hover:bg-[#004182]">{permissionState === "denied" ? "Try again and join call" : "Join interview call"}</Button><button onClick={onBack} className="mt-5 text-sm text-white/55 underline">End call</button></div></main>
}
