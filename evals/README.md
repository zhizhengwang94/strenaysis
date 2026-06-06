# Strenaysis LLM reasoning evals

A small scaffold for measuring whether the LLM behind Strenaysis is actually reasoning well — and whether prompt changes make it better or worse.

## Why this exists

"Improve LLM reasoning" is meaningless as a goal until it's broken into concrete, gradable dimensions. This folder lets you:

1. Run a fixed test corpus of hand-authored problems through the backend
2. Capture the responses for the record
3. Hand-grade each one against a published rubric
4. Compare aggregate scores across prompt versions

The eval target right now is **`POST /api/roadmap`** (the `generate_roadmap` LLM call). It's the highest-leverage call — every user hits it, and it sets the entire downstream flow. The other four LLM calls (`generate_node_build`, `polish_node`, `synthesize_node_output`, `refresh_roadmap_followups`) get their own rubrics once this one is stable.

## Files

| File | Purpose |
|---|---|
| `corpus.jsonl` | 12 hand-authored problems with expected types and ideal node titles. One JSON object per line. |
| `rubric.md` | The grading rubric — 5 scored items + 1 free-text. Update here when the rubric changes. |
| `run_corpus.py` | Posts every problem to `/api/roadmap`, captures the responses. |
| `score.py` | Hand-grading helper. Walks responses, displays them next to corpus expectations, prompts you for rubric scores, writes a CSV. |
| `runs/` | Captured runs, one folder per timestamp. Each contains `<id>.json` per problem + a `manifest.csv` with shape data. |
| `scores/` | Hand-graded scores, CSV per run. |

## Quick start

```bash
# 1) Start the Strenaysis backend with an OPENAI_API_KEY set, or you'll just
#    measure the deterministic fallback path.
export OPENAI_API_KEY=sk-...
PYTHONPATH=src PORT=8765 python3 -m strenaysis &

# 2) Run the corpus. Pass the same passcode the SPA uses.
python evals/run_corpus.py --passcode 2825628257282931

# 3) Hand-grade the run. Walks every response, prompts for rubric scores.
python evals/score.py

# 4) Read the aggregate at the end and write down what failed and why.
```

## Smoke test (without grading)

```bash
# Run only 3 problems to verify the runner works end-to-end
python evals/run_corpus.py --passcode 2825628257282931 --limit 3

# Or run specific problems by id
python evals/run_corpus.py --passcode 2825628257282931 --ids dtc-retention-cliff,marketplace-two-sided
```

## Workflow for iterating prompts

1. **Establish baseline.** Run corpus → hand-grade → write down the headline scores. This is what you're trying to beat.
2. **Look at the failures.** Pick the **two most common failure modes**, not five. Read the rubric `notes` column from the CSV.
3. **Edit one prompt.** The prompt for `generate_roadmap` lives at `src/strenaysis/openai_client.py:generate_roadmap`. Most of the time you'll be adding in-context worked examples, not rewriting the system prompt.
4. **Re-run + re-grade.** Same corpus, same rubric, same grader (you).
5. **Compare.** A new prompt is "better" if it improves at least two scored items without regressing the others by more than 0.3.
6. **Commit the prompt change** with the before/after scores in the commit message.

Avoid: changing the prompt and the rubric in the same commit. You need one to be the constant.

## Notes on the corpus

The 12 problems span:

- **All 4 problem types** (`descriptive_analysis`, `predictive_modeling`, `experiment_causal_question`, `operational_optimization`)
- **Multiple domains** (subscription SaaS, B2B sales, marketplace, marketing, consumer)
- **An ambiguity gradient** — clean cases at one end, intentionally ambiguous at the other
- **Adversarial cases** — pathologically vague ("help me figure out churn"), hybrid causal+optimization, descriptive wrapped in causal language

Each entry has `traps` — known failure modes worth checking against. Use them when grading: did the model fall into the trap?

## Extending

When you want to add a problem:

- Pick an id (kebab-case, ~20 chars).
- Write the problem text exactly as a user would type it. Don't clean it up.
- Hand-label the expected type. If you're not sure, the problem is too ambiguous for the corpus.
- List the ideal node titles you'd want a senior DS to produce.
- Add 1–2 traps — the wrong types or weak nodes you'd expect the LLM to be tempted by.

Append to `corpus.jsonl` as one new line. No other files need to change.

## What this doesn't do (yet)

- **LLM-as-judge.** Once the human-graded baseline is stable across 2–3 runs by the same grader, an LLM-as-judge can replace the per-problem prompting for fast iteration. Until then, human grading is the noise floor you're measuring against.
- **Other LLM calls.** Only `generate_roadmap` has a rubric. The other four are sketched in `rubric.md` at the bottom; flesh out when you start grading them.
- **Telemetry from production runs.** Real user runs will surface failure modes that hand-authored cases miss. Logging + a "thumbs up/down" UI lands later.
- **CI integration.** Right now the runner + grader are local scripts. Once the rubric is stable and there's an LLM judge, this can run on every prompt-changing PR.
