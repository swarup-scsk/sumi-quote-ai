# CLAUDE.md — sumi-quote-ai

## Project context
Prototype for the **steel business of Sumitomo (SCSK)**. Part of a broader effort to
build and validate prototypes that explore identified hypotheses for the steel
quoting workflow. Built with **N8N** (automation/back-end webhooks) and **Lovable**
(front-end, synced to this GitHub repo). This repo is the Lovable front-end.

Purpose of the work: brainstorming prototypes, getting detailed build instructions,
and strategic research/analysis around the hypotheses behind each prototype.

Scope: Flat rolled steel · EN standard · SCE Prague scenario.

## What this app does
A **Sales & Quoting AI** front-end for the RFQ → Quote flow:
- Upload an RFQ, AI extracts spec fields with confidence scores.
- Fields above/below confidence thresholds are auto-filled / flagged / left blank.
- Review spec cards, generate and review quotes.
- Settings for N8N connection, confidence thresholds, and customer-tier defaults
  (Spot / Contract / Strategic). Demo mode returns mock data (DC04 / SCE Prague).

## Tech stack
- React 19 + TypeScript, **Vite 7**
- **TanStack Router / Start / React Query** (file-based routes in `src/routes`)
- **Tailwind CSS v4**, shadcn/ui components (`src/components/ui`)
- `sonner` toasts, `lucide-react` icons, `react-hook-form`
- Deploy target: Cloudflare (`@cloudflare/vite-plugin`, `wrangler.jsonc`)
- Package manager: **bun** (`bun.lockb`, `bunfig.toml`) — npm lockfile also present

## Commands
- `bun run dev` (or `npm run dev`) — local dev server (Vite)
- `bun run build` — production build
- `bun run lint` — ESLint
- `bun run format` — Prettier

## Repo layout
- `src/routes/` — pages: `index`, `rfq.index`, `rfq.$id`, `quote.index`, `quote.$id`, `settings`
- `src/components/` — feature components: `RFQUpload`, `RFQList`, `SpecCardReview`,
  `SettingsPanel`, `Layout`, `DemoBanner`, etc.
- `src/components/ui/` — shadcn/ui primitives
- `src/context/AppContext.tsx` — app state (settings, RFQs, quotes) via reducer
- `src/lib/` — `api.ts` (N8N calls), `confidence.ts`, `utils.ts`
- `src/types/index.ts` — shared types

## Lovable sync workflow
This repo is connected to Lovable bidirectionally.
- Pushing to **`main`** → Lovable auto-pulls and updates its in-editor preview.
- The **live published site** updates only after clicking **Publish** in Lovable.
- Keep commits scoped to real changes; avoid line-ending-only churn.

## Conventions
- Use `&amp;` for literal ampersands in JSX text.
- Tailwind utility classes; follow existing shadcn/ui patterns.
- Match the existing colour tokens (`text-ink`, `text-mid`, `bg-brand`, `bg-surface`, etc.).
