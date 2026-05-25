# Strenaysis Handoff

Use this file as a practical project handoff for the next person working in the repo.

## Repo And Context

- GitHub repo:
  `https://github.com/zhizhengwang94/strenaysis`
- Production deploy:
  `https://strenaysis.onrender.com/`
- Active development branch:
  `style/spa-rebuild` (as of 2026-05-21)

## What Strenaysis Is

Strenaysis is a guided analytical coaching tool for data scientists. It turns vague business questions into structured analysis plans by walking the user through a series of nodes — each node is a focused sub-problem with LLM-generated coaching questions.

**Users:** data science students, interview candidates, practicing DS/analytics professionals.

**Core loop:** ask a question → get a structured roadmap → work through each node in guided Q&A → review and export the full analysis.

## Frontend Architecture

The frontend is a **single-page application** served as static assets by the Python backend.

Three files do all the work:

- `src/strenaysis/web/index.html` — the SPA shell. Two persistent sidebar variants (`#side-step1` for the home view; `#side-current-problem` with a 4-step stepper for Steps 2+) and four view sections (`#view-home`, `#view-roadmap`, `#view-buildup`, `#view-summary`).
- `src/strenaysis/web/styles.css` — the prototype's `_shared.css` design tokens (oklch palette, type scale, spacing, radius, frame, sidebar, buttons, panels) plus Step 1/2/3/4 component styles. One consolidated file.
- `src/strenaysis/web/app.js` — single SPA driver. View switcher, all 4 step renderers, state management.

The design system was ported from a separate prototype (loose HTML files outside this repo) into the SPA in a four-session rewrite that landed 2026-05-21. The reference prototype's location is documented in the Claude session memory file.

`src/strenaysis/web/_legacy/` contains the rolled-back SPA from a previous design iteration. Kept for reference; not served.

## Backend Architecture

The backend is a stdlib `http.server` Python app. Routes:

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Serves `index.html` (gated by passcode cookie) |
| GET | `/api/problem-framings` | List saved framings |
| GET | `/api/problem-framings/{filename}` | Load a saved framing |
| POST | `/api/save-problem-framing` | Persist a framing to disk |
| POST | `/api/roadmap` | Generate / regenerate the roadmap (accepts `problem_type` override) |
| POST | `/api/node-build` | Generate per-node breakdown (workstreams + open_questions + execution_items) |
| POST | `/api/polish-node` | Refine a user-written node draft |
| POST | `/api/node-output` | Synthesize per-node final output |
| POST | `/api/refresh-followups` | Regenerate follow-ups for the whole roadmap |
| POST | `/api/export` | Generate .docx or .pptx from the full framing |
| GET | `/api/action-problems` | List action-tracker problems |
| GET | `/api/pipeline-overview` | Action-tracker summary stats |
| POST | `/unlock` | Submit passcode |

All `/api/*` endpoints require the passcode cookie set via `/unlock`. The current SPA does not call `/api/polish-node`, `/api/node-output`, `/api/refresh-followups`, `/api/action-problems`, or `/api/pipeline-overview`; they're available for future use.

## Product Flow

Primary nav: `Problems` is the main workflow. `History`, `Actions`, `Portfolio` are directional placeholders.

Problem flow (the four SPA views):

1. **Step 1 — Question** (`#view-home`): composer with character counter, optional context, recent-framings list with click-to-load.
2. **Step 2 — Analysis path** (`#view-roadmap`): editable question, problem-type assessment with radio override and "Update analysis path" regenerate, drag-and-drop node list, custom-node inline form.
3. **Step 3 — Workspace** (`#view-buildup`): per-node guided Q&A. Tab bar, node brief (description / guidance / collapsible thinking breakdown), conversation thread, action items accordion, sticky save indicator + progress strip.
4. **Step 4 — Review** (`#view-summary`): meta strip, "Why this template" callout, executive summary (composed locally from state), per-node reports with collapsible Q&A and action tables, consolidated workplan table, .docx/.pptx export, save to history.

Answer response types in Step 3: **Confirmed / Assumption / Hypothesis** — these tags carry through to Step 4's per-node Q&A disclosure.

## Files That Matter Most

Frontend:
- `src/strenaysis/web/index.html`
- `src/strenaysis/web/styles.css`
- `src/strenaysis/web/app.js`

Backend:
- `src/strenaysis/server.py`
- `src/strenaysis/openai_client.py`
- `src/strenaysis/exporter.py`

## Run Locally

The server reads `OPENAI_API_KEY` from env. Without it, every LLM endpoint falls back to deterministic templates — the UI still works end-to-end but the content is generic.

**macOS / Linux:**
```bash
PYTHONPATH=src PORT=8765 python3 -m strenaysis
```

**Windows (PowerShell):**
```powershell
$env:PYTHONPATH = "src"
$env:PORT = "8765"
& 'C:\Users\zhizh\anaconda3\python.exe' -m strenaysis
```

Local URL: `http://127.0.0.1:8765/`

`.claude/launch.json` is configured for Claude Code's preview server on port 8765.

After frontend changes, hard-reload with `Cmd+Shift+R` (macOS) or `Ctrl+F5` (Windows).

The passcode gate is defined as `ACCESS_CODE` in `server.py`.

## Deploy Info

1. Push to GitHub `main`.
2. In Render, use **Manual Deploy** on the latest commit.

Render env should already have `OPENAI_API_KEY` set.

## Local Data And Worktree Notes

- `saved_problem_structures/` — tracked. Saved framings are persisted here as JSON. Two seed files (`2026-04-13_*`) are intentionally tracked as reference data.
- `problems/` — gitignored. Transient working data from some other code path.
- `active_problem_structures/` — directory used by the action-tracker endpoints.
- `external/`, `.tmp-edge-codex/`, `.claude/` (except `launch.json`) — gitignored.

When committing, prefer adding specific files; avoid `git add -A` so transient data doesn't sneak in.

## Suggested Next Steps

- **Test against a real `OPENAI_API_KEY`.** Smoke tests so far have used the fallback path only. Real LLM responses will surface different `open_questions` shapes and longer text that the UI hasn't been visually verified against.
- **Polish the followup model in Step 3.** Currently, answer submissions push a stub followup string locally. Could be wired to `POST /api/polish-node` for real LLM feedback.
- **Accessibility pass.** Keyboard nav, focus management, ARIA on chip dots and drag handles.
- **Decide whether `History`, `Actions`, `Portfolio` graduate to real workflows.** They're directional in the sidebar today.
- **Remove `src/strenaysis/web/_legacy/`** once the SPA is considered stable. Roughly 200KB of reference code.

## Best Prompt For A New Chat

> Read HANDOFF.md first, then launch Strenaysis locally on port 8765 and continue from the current version. See `~/.claude/projects/.../memory/` for prior session context if available.
