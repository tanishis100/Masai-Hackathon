import { Card } from "@repo/ui/card"

export default function Docs() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-medium text-brand-600">apps/docs</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Documentation</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          This app shares components and design tokens with the web app.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Web app">
          The Pressure interview platform. Deployed from apps/web as its own Vercel
          project; runs on port 3000 in local development.
        </Card>
        <Card title="Turborepo">
          Tasks are cached per package, so unchanged workspaces are never rebuilt.
        </Card>
      </div>
    </main>
  )
}
