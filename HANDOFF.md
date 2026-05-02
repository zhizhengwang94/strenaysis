# Strenaysis Handoff

Use this file as a practical project handoff for the next person working in the repo.

## Repo And Context

- Main working repo:
  `C:\Users\zhizh\Documents\GitHub\strenaysis`
- Existing context file:
  `C:\Users\zhizh\OneDrive\Document\GitHub\strenaysis\PROJECT_CONTEXT.md`
- GitHub repo:
  `https://github.com/zhizhengwang94/strenaysis`
- Current branch:
  `main`

Important note:
- the populated checkout is in `Documents\GitHub\strenaysis`
- the `OneDrive\Document\GitHub\strenaysis` path currently holds the handoff/context file, not the active code checkout

## What Strenaysis Is

Strenaysis is a business-to-analytics translation workspace.

Its job is to:
- turn vague business asks into structured analytical roadmaps
- surface missing context before analysis starts
- keep business framing visible while moving toward execution
- bridge ambiguous stakeholder questions into DA/DS-ready work

## Current Product Flow

Primary nav:
1. `Problems`
2. `Library`
3. `Actions`
4. `Portfolio`

Current emphasis:
- `Problems` is still the main active workflow
- `Library`, `Actions`, and `Portfolio` exist in the UI directionally, but the core product focus remains the problem-structuring flow

Problem flow:
1. `Main Question`
2. `Roadmap Workspace`
3. `Roadmap Buildup`
4. `Workflow Summary`

## What Changed Most Recently

Latest pushed commit before this handoff refresh:
- `beb4e99` - `Add updated project handoff`

What was updated:
- `src/strenaysis/web/index.html`
- `src/strenaysis/web/styles.css`
- `src/strenaysis/web/app.js`

Summary of the recent frontend work:
- Step 1 was pushed much closer to the prototype entry experience
- Step 1 now has:
  - more compact spacing and a more editorial composer layout
  - a recent/local history area with shortened synthesized problem titles instead of full problem statements
  - an unsaved draft row that can resume the in-progress workspace, including unfinished detail work
  - `Ctrl + Enter` continue behavior and draft-aware “pick up where you left off” behavior
  - `History`, `Actions`, and `Portfolio` in the Step 1 sidebar are intentionally unavailable again
- Step 2 was substantially reworked toward the prototype roadmap workspace
- Step 2 now has:
  - a forced `45% / 10% / 45%` top layout for `Current Question` and `Problem Assessment`
  - compact matched top panels with internal scrolling where needed
  - an `Additional Context` entry point in the question panel
  - problem-type cards with recommendation framing and `Update Analysis Path` behavior based on the currently applied path
  - a compact roadmap buildup list more aligned with the prototype row treatment
  - a sticky bottom CTA bar with `Continue to Workspace`
- Step 4 was rebuilt into a report-style summary page
- Step 4 now has:
  - an `Executive Summary` section
  - a node-by-node breakdown section
  - a consolidated `Work Plan` table at the bottom
  - no duplicate per-node action tables anymore
  - sticky summary actions for `Save This Problem Framing`, `Download Word`, and `Download PowerPoint`
  - later `Problems` pages now inherit the newer Step 1-style shell and title treatment instead of the older generic workspace framing

## Current UX Direction

### Step 1

Current intent:
- keep Step 1 focused on the single main question
- keep the main composer compact and calm rather than spacious/form-heavy
- allow users to quickly resume unfinished work from the recent section
- keep non-active directional areas in the Step 1 sidebar unavailable unless product direction changes
- make the entry feel editorial, deliberate, and product-led rather than form-heavy

### Step 2

Current intent:
- keep the main question editable
- make the problem type legible and opinionated
- keep the top question/assessment panels tightly aligned and compact
- keep roadmap nodes compact and scannable
- keep the later `Problems` steps visually aligned with the upgraded Step 1 shell
- preserve the wide node modal pattern
- preserve shared roadmap memory and follow-up thread behavior

Important rule:
- do not simplify Step 2 into a fake checklist where "all breakdown items answered" automatically means the logic is complete
- follow-up prompting should still depend on:
  - the node
  - the shared roadmap log
  - actual saved user answers

### Step 3

Current intent:
- left side is the node brief
- right side is review/build execution work
- keep Step 3 as the build/review workspace, not a second roadmap prompting page

### Step 4

Current intent:
- summary/review page with:
  - executive summary first
  - node-by-node breakdown second
  - consolidated work plan last
- keep summary export/save actions visible while scrolling
- save button remains intentionally disabled unless product direction changes

## Files That Matter Most

Frontend:
- `src/strenaysis/web/index.html`
- `src/strenaysis/web/styles.css`
- `src/strenaysis/web/app.js`

Backend:
- `src/strenaysis/server.py`
- `src/strenaysis/openai_client.py`
- `src/strenaysis/exporter.py`

## Run Info

Python:
- use `C:\Users\zhizh\anaconda3\python.exe`

Run locally:

```powershell
& 'C:\Users\zhizh\anaconda3\python.exe' -m strenaysis
```

Local URL:
- `http://127.0.0.1:8000/`

Important:
- after frontend changes, use `Ctrl + F5`
- there is a simple passcode gate in the app/server flow

## Deploy Info

Production:
- `https://strenaysis.onrender.com/`

Deploy flow:
1. push to GitHub `main`
2. in Render, use `Manual Deploy`
3. deploy the latest commit

## Local Data And Worktree Notes

Do not accidentally commit:
- local saved JSON data
- generated `egg-info` churn unless explicitly intended
- mock/reference files unless explicitly intended

Current local worktree state after the last push:
- modified:
  - `src/strenaysis.egg-info/PKG-INFO`
  - `src/strenaysis.egg-info/SOURCES.txt`
- modified or newly updated for the next push:
  - `HANDOFF.md`
  - `src/strenaysis/web/app.js`
  - `src/strenaysis/web/index.html`
  - `src/strenaysis/web/styles.css`
- untracked:
  - `external/`
  - `.tmp-edge-codex/`
  - `src/strenaysis.egg-info/requires.txt`

Interpretation:
- the last pushed state is through commit `beb4e99`
- the active local frontend diff currently includes the newer problem-flow shell alignment and the restored disabled Step 1 sidebar items
- the remaining dirty files are local/generated/reference artifacts, not part of the pushed UI change

## Suggested Next Steps

Reasonable next areas to work on:
- continue refining Step 3 so its visual language catches up to Step 1 and Step 2
- simplify and stabilize Step 2 CSS once the current layout direction is considered “locked”
- validate Step 4 export flows against the upgraded summary layout
- decide whether `Library`, `Actions`, and `Portfolio` remain directional or become active workflow areas
- eventually split the large frontend into more step-oriented modules if maintainability becomes painful

## Best Prompt For A New Chat

Use something like:

`Read PROJECT_CONTEXT.md and HANDOFF.md first, then launch Strenaysis locally at http://127.0.0.1:8000/ and continue from the current version.`
