# Strenaysis — Design 2.0 (prototype)

A frontend reimagining of Strenaysis as a **reasoning canvas** for data consultants: a node-based workspace where the "grand question" is decomposed into a typed framework, each node is pressure-tested to capture the consultant's own reasoning, and that captured context is projected through membranes (client update, teammate brief, deck) and dispatched to connected external agents.

## ⚠️ No backend yet

This is a **frontend-only prototype**. Everything runs in the browser:

- **No server, no database, no auth.** State lives in memory and resets on reload.
- **No real LLM calls.** The decomposition, pressure-test questions, and agent runs are **mocked** (canned/adaptive stand-ins for what a real model would return).
- **"Connected agents" are mocked.** The provider + API-key + scope flow is UI only; nothing is authenticated or sent anywhere.
- **Data connectors (BigQuery, Hex, etc.) are labels only** — not wired to anything.

The purpose is to prove out the *interaction model and product direction*, not the implementation.

## Run it

Self-contained static file, no build step:

```bash
# from the repo root
python3 -m http.server 4173 --directory prototype-canvas
# then open http://localhost:4173
```

Or via the Claude Code preview: the `canvas-prototype` config in `.claude/launch.json`.

## Files

- `index.html` — the entire prototype (HTML + CSS + JS inline).
- `MEMBRANE-MODEL.md` — the "one captured context, many membranes" strategy.
- `VALIDATION-PLAN.md` — how to test the riskiest assumption ("does the pressure test pay rent?").

## Status

Exploration / not merged to `main`. This is a parallel design track, separate from the current production Strenaysis app in `src/strenaysis/`.
