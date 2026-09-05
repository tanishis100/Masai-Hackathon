import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Docs | Masai Hackathon",
  description: "The docs app of the Masai Hackathon monorepo.",
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
