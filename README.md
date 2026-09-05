# Masai Hackathon

A Next.js monorepo built on npm workspaces + [Turborepo](https://turborepo.com).

## Layout

```
apps/
  web/                  Next.js app  -> http://localhost:3000
  docs/                 Next.js app  -> http://localhost:3001
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
