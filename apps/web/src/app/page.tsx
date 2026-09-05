import { Button } from "@repo/ui/button"
import { Card } from "@repo/ui/card"

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-medium text-brand-600">apps/web</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Masai Hackathon</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          A Turborepo-powered monorepo with two Next.js apps and a shared UI package.
        </p>
      </div>

      <div className="flex gap-3">
        <Button>Get started</Button>
        <Button variant="secondary">Documentation</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card href="http://localhost:3001" title="Docs app">
          The second workspace app, served on port 3001.
        </Card>
        <Card title="Shared UI">Both apps import Button and Card from packages/ui.</Card>
      </div>
    </main>
  )
}
