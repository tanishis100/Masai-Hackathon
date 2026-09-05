import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Interview Prep — mock interviews from a real job description",
  description:
    "Paste a LinkedIn job description and your resume, run a phone-style mock interview, and get scored feedback plus a revision cheat sheet.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-50">
        {children}
      </body>
    </html>
  )
}
