"use client"

import Image from "next/image"
import { useState } from "react"
import { Button } from "@repo/ui/button"

export type JobMatch = {
  company: string
  logo: string
  logoClass: string
  role: string
  location: string
  match: number
  interviewer: string
  interviewerRole: string
  email: string
  technical: string
  technicalRole: string
  technicalEmail: string
  jd: string
}

const JOBS: JobMatch[] = [
  {
    company: "Nimbus Analytics",
    logo: "N",
    logoClass: "bg-[#0a66c2]",
    role: "Frontend Engineer",
    location: "Bengaluru · Hybrid",
    match: 94,
    interviewer: "Aarav Mehta",
    interviewerRole: "Hiring Manager",
    email: "aarav.mehta@nimbus.io",
    technical: "Sana Kapoor",
    technicalRole: "Technical Lead",
    technicalEmail: "sana.kapoor@nimbus.io",
    jd: "Build real-time dashboards for logistics teams. Own the React and TypeScript surface, improve rendering performance, and partner with backend on live telemetry. You will work closely with design and product to ship clear, reliable tools for operations teams.",
  },
  {
    company: "Vercel",
    logo: "▲",
    logoClass: "bg-neutral-950",
    role: "Product Engineer",
    location: "Remote · India",
    match: 86,
    interviewer: "Maya Shah",
    interviewerRole: "Product Engineering Manager",
    email: "maya.shah@vercel.com",
    technical: "Ethan Cole",
    technicalRole: "Staff Engineer",
    technicalEmail: "ethan.cole@vercel.com",
    jd: "Create fast, thoughtful workflows for developers using React, Next.js, and modern web platform primitives. You will turn complex infrastructure into simple product experiences and collaborate across engineering and design.",
  },
  {
    company: "Atlassian",
    logo: "A",
    logoClass: "bg-[#1868db]",
    role: "Senior Frontend Engineer",
    location: "Bengaluru · Hybrid",
    match: 79,
    interviewer: "Riya Menon",
    interviewerRole: "Engineering Manager",
    email: "riya.menon@atlassian.com",
    technical: "Leo Martin",
    technicalRole: "Principal Engineer",
    technicalEmail: "leo.martin@atlassian.com",
    jd: "Design collaborative product experiences at scale and work across product, design, and platform teams. The role combines frontend architecture, accessibility, performance, and strong customer empathy.",
  },
]

export function JobMatchScreen({
  onJoin,
  onBack,
}: {
  onJoin: (job: JobMatch) => void
  onBack: () => void
}) {
  const [selected, setSelected] = useState(0)
  const job = JOBS[selected]!

  return (
    <main className="min-h-[calc(100vh-65px)] bg-[#f7f9f8] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold text-emerald-600">Profile scan complete</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-neutral-950 sm:text-5xl">
          Roles worth your time.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-600">
          We compared your experience with current roles and found matches where your
          profile has the strongest signal.
        </p>

        <div className="mt-9 grid items-start gap-6 lg:grid-cols-[0.86fr_1.14fr]">
          <section className="space-y-4 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Matching jobs
              </p>
              <span className="text-xs text-neutral-500">{JOBS.length} found</span>
            </div>
            {JOBS.map((item, index) => {
              const active = selected === index
              return (
                <button
                  key={item.company}
                  onClick={() => setSelected(index)}
                  className={`block w-full text-left transition-opacity ${active ? "opacity-100" : "opacity-40 hover:opacity-75"}`}
                >
                  <article
                    className={`border bg-white p-5 shadow-sm ${active ? "border-neutral-950 shadow-md" : "border-neutral-200"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${item.logoClass}`}
                      >
                        {item.logo}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                              {item.company}
                            </p>
                            <h2 className="mt-1 text-xl font-bold text-neutral-950">
                              {item.role}
                            </h2>
                          </div>
                          <span className="font-mono text-sm font-bold text-emerald-600">
                            {item.match}%
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-neutral-500">
                          {item.location} · Full-time
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-neutral-600">{item.jd}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                      <span>
                        Profile fit:{" "}
                        {item.match >= 90
                          ? "Excellent"
                          : item.match >= 85
                            ? "Strong"
                            : "Good"}
                      </span>
                      <span>{active ? "Selected" : "View match"}</span>
                    </div>
                  </article>
                </button>
              )
            })}
          </section>

          <section className="border border-neutral-200 bg-white shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-4 border-b border-neutral-100 p-6 sm:p-8">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold text-white ${job.logoClass}`}
              >
                {job.logo}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Selected company
                </p>
                <h2 className="mt-1 text-2xl font-bold text-neutral-950">
                  {job.company}
                </h2>
                <p className="text-sm text-neutral-500">
                  {job.role} · {job.location}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-3xl font-black text-emerald-600">{job.match}%</p>
                <p className="text-xs text-neutral-500">job fit</p>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Your interview panel
              </p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-full">
                    <Image
                      src="/interviewer-profile.png"
                      alt={job.interviewer}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-950">{job.interviewer}</p>
                    <p className="text-sm text-neutral-500">{job.interviewerRole}</p>
                    <p className="mt-1 break-all text-xs text-neutral-400">{job.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src="/interviewer-sana.png"
                      alt={job.technical}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-950">{job.technical}</p>
                    <p className="text-sm text-neutral-500">{job.technicalRole}</p>
                    <p className="mt-1 break-all text-xs text-neutral-400">
                      {job.technicalEmail}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-neutral-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button onClick={onBack} className="text-sm text-neutral-500 underline">
                  Edit profile
                </button>
                <Button
                  onClick={() => onJoin(job)}
                  className="bg-[#0a66c2] px-7 text-white hover:bg-[#004182]"
                >
                  Join interview call
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
