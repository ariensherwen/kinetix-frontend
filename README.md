# Kinetix Frontend

Standalone UI workbench for redesigning the Kinetix admin dashboard without requiring a live backend.

This branch is synchronized with `PrightCord/kinetix` PR #158 head at `de36d0d`, including client connection-profile generation for Pi, Claude Code, Codex, and OpenCode on top of the current model, credential, plugin, routing, and settings contract.

## Demo mode

Demo mode is enabled by default and now covers the current dashboard contract, including:

- virtual keys, client connection profiles, routes, providers, accounts, aliases, usage, requests, audit, health, and settings
- provider discovery and cached discovery state
- model lifecycle reconciliation, accept/ignore/pin actions, and lifecycle scheduler settings
- pricing provenance and provider pricing sync
- scoped capability probes
- manual, OAuth/auth-flow, and credential-free provider enrollment modes
- account tests
- plugin catalog search/refresh, install previews, settings, permissions, and auth completion
- current Kinetix-oriented fixtures for Antigravity, Google AI Studio, B.AI, and OpenCode Free

The numbers and prices in demo mode are illustrative fixtures, not live provider data.

```bash
cp .env.example .env
npm install
npm run dev
npm run lint
npm run build
```

Set `VITE_KINETIX_DEMO=false` only when serving this frontend against a real Kinetix instance exposing `/admin/api/*` on the same origin.

## Sync rule

The production UI in `PrightCord/kinetix/dashboard` is authoritative. Shared UI/types/mappers/resources should stay source-compatible with it. Standalone-only behavior belongs in:

- `src/data/mockData.ts`
- `src/lib/demoResources.ts`
- the small demo/real switch appended to `src/lib/resources.ts`

That keeps this repo a clean redesign workbench instead of a second dashboard implementation.
