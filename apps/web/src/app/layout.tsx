import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Pressure — AI interview stress test",
  description:
    "Map the resume claims a real interviewer will challenge, run a pressure interview, and retry weak answers with targeted feedback.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f7f9f8] text-neutral-950 antialiased dark:bg-neutral-950 dark:text-neutral-50">
        {children}
      </body>
    </html>
  )
}
