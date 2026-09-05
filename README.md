# Interview Prep Platform

Paste a LinkedIn job description and your resume. Get a phone-style mock interview
written against that specific role, a scored breakdown of how you answered, and a
revision cheat sheet with real reference links.

**Problem Statement 3 — Masai Hackathon.**

## How it works

1. **Setup** — paste the JD and your resume, pick an experience level
   (Fresher / Intermediate / Senior / Lead) and a question count.
2. **Interview** — a phone-style call screen. The interviewer speaks each question
   aloud; you answer by voice (Web Speech dictation) or by typing. A live clock
   tracks the call and each individual answer.
3. **Feedback dashboard** — an overall score, four scored dimensions
   (Technical depth, Communication, Role fit, Structure), what worked, what cost
   you, and a per-question breakdown with what a strong answer would have hit.
4. **Cheat sheet** — generated from your weakest answers: dense revision notes plus
   curated documentation links, downloadable as Markdown or copyable to clipboard.

## No environment variables, no server

The app is **100% client-side**. There are no API routes and no server-side secrets.

- You paste your own Gemini API key into **Settings**.
- It is stored in `localStorage`, in your browser only.
- Requests go directly from your browser to `generativelanguage.googleapis.com`.
- The key never enters the repository, a build, an env var, or any server of ours —
  there is no server. "Forget key" wipes it.

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
Model is switchable in Settings (3.5 Flash by default; 3.1 Pro for sharper feedback).

All three Gemini calls use structured output (`responseSchema`), so the app parses
typed JSON rather than scraping prose.

## Repo

A Next.js monorepo built on npm workspaces + [Turborepo](https://turborepo.com).

## Layout

```
apps/
  web/                  The interview platform -> http://localhost:3000
  docs/                 Docs surface           -> http://localhost:3001
packages/
  ui/                   Shared React components + Tailwind design tokens
  eslint-config/        Shared flat ESLint configs (base / react-internal / next)
  typescript-config/    Shared tsconfig bases (base / react-library / nextjs)
```

Every package is namespaced `@repo/*` and referenced across workspaces with `"*"`,
so the local source is always used — no publishing or prebuild step.

## Stack

|                                    |                |
| ---------------------------------- | -------------- |
| Next.js 16 (App Router, Turbopack) | React 19       |
| TypeScript 6                       | Tailwind CSS 4 |
| ESLint 9 (flat config)             | Prettier 3     |

TypeScript is pinned to `^6` and ESLint to `^9` on purpose: `typescript-eslint` and
`eslint-plugin-react` do not yet support TypeScript 7 / ESLint 10. Bump them together
once the lint plugins catch up.

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` starts both apps in parallel. To run just one:

```bash
npm run dev --workspace @repo/web
```

## Scripts

| Command               | What it does                         |
| --------------------- | ------------------------------------ |
| `npm run dev`         | Run every app in dev mode            |
| `npm run build`       | Build every app                      |
| `npm run start`       | Serve the production builds          |
| `npm run lint`        | ESLint across all workspaces         |
| `npm run check-types` | `tsc --noEmit` across all workspaces |
| `npm run format`      | Prettier write                       |

## Adding a shared component

1. Create `packages/ui/src/thing.tsx`.
2. Add an entry to the `exports` map in `packages/ui/package.json`:
   `"./thing": "./src/thing.tsx"`.
3. Import it as `import { Thing } from "@repo/ui/thing"`.

The apps list `@repo/ui` in `transpilePackages`, so components ship as TypeScript
source and are compiled by each app's own build.

## Tailwind

Design tokens live in `packages/ui/src/styles.css` under `@theme` (e.g. the `brand-*`
color scale). Each app's `globals.css` imports them and adds an `@source` directive
pointing at `packages/ui/src`, so classes used only inside shared components are not
tree-shaken away.

## Adding a new app

```bash
mkdir -p apps/<name>
```

Copy `apps/docs` as a starting point, change `name`, the dev/start `--port`, and the
metadata in `src/app/layout.tsx`. Turborepo picks it up from the `apps/*` glob with no
further configuration.

## Deploying to Vercel

Each app is a **separate Vercel project** pointing at the same repository. Create one
project per app and set its **Root Directory**:

| Vercel project         | Root Directory |
| ---------------------- | -------------- |
| `masai-hackathon-web`  | `apps/web`     |
| `masai-hackathon-docs` | `apps/docs`    |

Leave **"Include files outside of the Root Directory"** enabled (Vercel turns this on
automatically for workspace monorepos) — it is what lets `apps/web` resolve `@repo/ui`
and install from the root lockfile. Everything else is auto-detected: Vercel reads
`packageManager` from the root `package.json` and runs `npm install` at the repo root.

`apps/*/vercel.json` sets an `ignoreCommand` of `npx turbo-ignore <package>`, so a push
that only touches `apps/docs` will skip the `web` build entirely. Turborepo also uses
Vercel's Remote Cache automatically when building there.

### Via the dashboard

1. Push to GitHub.
2. **Add New → Project**, import the repo, set Root Directory to `apps/web`, deploy.
3. Repeat for `apps/docs`.

### Via the CLI

```bash
npm i -g vercel
vercel link --cwd apps/web
vercel --cwd apps/web        # preview
vercel --prod --cwd apps/web # production
```
