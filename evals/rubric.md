# Strenaysis LLM Reasoning Rubric

How to grade outputs from each LLM call. This document is the source of truth — when the rubric items change, update here and the `score.py` script needs to match.

## Why this exists

"Improve LLM reasoning" is a meaningless goal without concrete criteria. This rubric lets you point at a specific output and answer **yes/no** or **1–5** for each dimension that matters. Aggregated across the test corpus, you get a baseline number — and prompt changes get scored against it.

Start with `generate_roadmap` because it's the highest-leverage call (every user hits it; it sets the entire flow). The other four calls get rubrics later, once this one is stable.

---

## Rubric: `generate_roadmap`

Each problem in `corpus.jsonl` gets graded against these items. Items 1–3 are binary (1 = passes, 0 = fails). Items 4–5 are 1–5 scales. Item 6 is free-text observations.

### 1. Type classification correct? (binary)

Compare `returned.problem_type` against `corpus[id].expected_type`.

- **1** if exact match
- **0** if mismatch

Even if the recap is excellent and the nodes are useful, a wrong type is a failure: every downstream call inherits the misclassification.

**Note:** for the genuinely ambiguous cases (`ios-bug-reports`, `marketplace-two-sided`, `pathologically-vague`), the expected_type is the most defensible choice — but it's worth noting in item 6 if the model picked a different defensible answer vs an indefensible one.

### 2. Recap captures the stakes? (binary)

Look at `returned.assessment_recap`. Does it surface:
- Who's affected by the answer (CFO, CS team, product owner, etc.) when the problem text named them?
- The time pressure or constraint when the problem text named one (Q3 planning, before launch, etc.)?
- The non-obvious aspect of the problem — what makes this hard or interesting?

- **1** if at least 2 of these 3 are present
- **0** otherwise

A recap that's just "this is a [type] problem because [generic reasoning]" is a 0. The recap should reflect the actual problem, not the type taxonomy.

### 3. Nodes complete? (binary)

Compare `returned.roadmap[*].title` against `corpus[id].ideal_node_titles`.

- **1** if every ideal node title appears (in any order, with reasonable synonyms — e.g., "Hypotheses" ≈ "Hypothesis Generation")
- **0** if any obvious node is missing

Extra nodes beyond the ideal list are NOT a failure — they may add value. But missing a core node (e.g., no "Data" node on a predictive problem) is a structural error.

### 4. Nodes specific to this problem? (1–5)

Look at the `why` field on each node. Does it reference the user's actual problem?

- **5** — every node's description references specifics from the problem (the metric in question, the stakeholder, the constraint, the domain). A reader couldn't paste this onto a different problem without rewriting.
- **4** — most nodes are specific; one or two read generically.
- **3** — about half are specific. The other half read like template copy ("define the metric and confirm with stakeholders").
- **2** — most nodes are generic; only one or two reference the actual problem.
- **1** — every node description is generic boilerplate. The roadmap could be on any problem of this type.

This is the most important item for measuring real reasoning. Generic nodes mean the LLM applied a template; specific nodes mean it actually engaged with the question.

### 5. Order makes sense? (1–5)

Does the roadmap's node sequence reflect how a real DS would think through this?

- **5** — the order maps to a real workflow. Earlier nodes are prerequisites for later ones. No node is out of place.
- **4** — minor ordering issue (e.g., "Data" comes after "Model" when it should come before), but otherwise sensible.
- **3** — the order is acceptable but rigid (always Objective → Metric → ... regardless of problem). For some problems this works; for others it doesn't.
- **2** — clear ordering issues that would confuse a user (decision before result, model before data).
- **1** — random or backwards.

### 6. Observations (free text)

What went well? What went badly? What failure mode does this reveal?

This is where you capture the qualitative signal that doesn't fit a scale. The aggregated free-text becomes the input for the next round of prompt iteration.

Useful prompts when writing observations:
- "If I were a real DS reading this, would I trust it?"
- "What's the FIRST thing I'd push back on if a junior PM showed me this?"
- "What's missing that a senior DS would always include?"

---

## How scores aggregate to "is this prompt better?"

Per-corpus-run, compute:

- **Type accuracy**: % of items 1 that are 1. Target: 90%+ (12 problems is small; allow 1 miss on the genuinely ambiguous cases).
- **Recap quality**: % of items 2 that are 1.
- **Node completeness**: % of items 3 that are 1.
- **Specificity mean**: mean of items 4 across corpus. Target: shoot for 4.0+.
- **Order mean**: mean of items 5 across corpus. Target: 4.0+.

A new prompt is "better" if it improves at least two of these without regressing the others by more than 0.3.

Be skeptical of LLM-as-judge until the human-graded baseline is stable across 2–3 runs by the same grader. Humans drift too; that's the noise floor you're measuring against.

---

## Other calls (rubrics to write later)

The four other LLM calls each need their own rubrics. Sketched intent below; flesh out when you actually start scoring them.

### `generate_node_build`

- Workstreams match the node (not generic "scope + execution")?
- `open_questions` are sharp (force a position) vs vague ("what else should we consider")?
- `execution_items` are concrete (table name, owner, artifact) vs templated?

### `polish_node`

- Polished version preserves the user's specific claims and numbers?
- Polished version doesn't add hedging or fluff the user didn't write?
- Edits are surgical (fix grammar, tighten phrasing) vs replacing the user's voice?

### `synthesize_node_output`

- Synthesis actually synthesizes (combines, distills) rather than restating Q&A?
- The response-type tags (confirmed / assumption / hypothesis) are reflected in the synthesis?
- The output is shorter than the inputs combined — that's the test of synthesis vs concatenation?

### `refresh_roadmap_followups`

- Only updates followups for nodes whose answers changed?
- Preserves the user's prior phrasing of followups they liked?
- Doesn't regenerate from scratch when minor updates would do?
