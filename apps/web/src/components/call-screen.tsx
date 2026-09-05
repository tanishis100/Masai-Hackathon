"use client"

import { useState } from "react"
import { Button } from "@repo/ui/button"

export function CallScreen({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const [mic, setMic] = useState(true)
  const [camera, setCamera] = useState(true)
  const [permissionError, setPermissionError] = useState("")
  const [requested, setRequested] = useState(false)

  async function joinRoom() {
    setPermissionError("")
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera and microphone permissions are not available in this browser.")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: mic, video: camera })
      stream.getTracks().forEach((track) => track.stop())
      setRequested(true)
    } catch (error) {
      setPermissionError(error instanceof Error ? error.message : "Please allow camera and microphone access to join.")
    }
  }

  if (requested) {
    return <main className="min-h-[calc(100vh-65px)] bg-[#202124] p-6 text-white"><div className="mx-auto flex min-h-[75vh] max-w-5xl flex-col justify-between"><div className="flex items-center justify-between"><div><p className="text-lg font-semibold">Frontend Engineer interview</p><p className="text-sm text-white/60">Nimbus Analytics · 00:00</p></div><span className="rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-200">● Recording off</span></div><div className="grid gap-4 md:grid-cols-2"><div className="flex aspect-video items-center justify-center rounded-2xl bg-[#3c4043] text-5xl font-bold">NA</div><div className="relative flex aspect-video items-center justify-center rounded-2xl bg-[#303134] text-5xl font-bold"><span>You</span><span className="absolute bottom-4 left-4 rounded-lg bg-black/40 px-3 py-1 text-xs font-normal">{camera ? "Camera on" : "Camera off"}</span></div></div><div className="flex items-center justify-center gap-3"><button onClick={() => setMic(!mic)} className={`h-12 rounded-full px-5 text-sm ${mic ? "bg-white/15" : "bg-red-500"}`}>{mic ? "Mute mic" : "Unmute mic"}</button><button onClick={() => setCamera(!camera)} className={`h-12 rounded-full px-5 text-sm ${camera ? "bg-white/15" : "bg-red-500"}`}>{camera ? "Turn off camera" : "Turn on camera"}</button><Button onClick={onStart} className="h-12 bg-emerald-500 px-6 text-white hover:bg-emerald-600">Start interview</Button></div></div></main>
  }

  return <main className="min-h-[calc(100vh-65px)] bg-[#202124] px-6 py-12 text-white"><div className="mx-auto max-w-lg text-center"><div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold shadow-2xl">NA</div><p className="mt-7 text-sm text-white/60">Incoming interview call</p><h1 className="mt-2 text-3xl font-bold">Nimbus Analytics is ready.</h1><p className="mt-4 leading-7 text-white/65">Allow your microphone and camera so the practice room feels like the real thing.</p><div className="mt-8 grid gap-3 text-left sm:grid-cols-2"><button onClick={() => setMic(!mic)} className={`rounded-2xl border p-4 ${mic ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/15 bg-white/5"}`}><span className="block text-sm font-semibold">Microphone</span><span className="mt-1 block text-xs text-white/55">{mic ? "Ready to use" : "Turned off"}</span></button><button onClick={() => setCamera(!camera)} className={`rounded-2xl border p-4 ${camera ? "border-emerald-400/50 bg-emerald-400/10" : "border-white/15 bg-white/5"}`}><span className="block text-sm font-semibold">Camera</span><span className="mt-1 block text-xs text-white/55">{camera ? "Ready to use" : "Turned off"}</span></button></div>{permissionError ? <p className="mt-4 rounded-xl bg-red-500/15 p-3 text-sm text-red-200">{permissionError}</p> : null}<Button onClick={joinRoom} className="mt-8 w-full bg-[#0a66c2] text-white hover:bg-[#004182]">Join interview call</Button><button onClick={onBack} className="mt-5 text-sm text-white/55 underline">Back to matches</button></div></main>
}
