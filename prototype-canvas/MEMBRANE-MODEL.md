# Strenaysis: the Membrane Model

*One-pager from the 2026-07 brainstorm. Not a spec; a direction to test.*

## The reframe

Three consultant painpoints (**scope creep**, **losing the thread on long engagements**, and **clients feeling out of the loop**) are one disease: **engagement context is never captured, so it evaporates** (out of the consultant's head, between tools, at the rushed project close).

Everyone else captures **artifacts** (decks, docs) that lose the *why*. Strenaysis captures **reasoning** (the grilling, assumptions, hypotheses, decisions), which *is* the context. The node grilling is a **context-capture mechanism disguised as a thinking aid**: the one moment a consultant will willingly emit high-quality context, because they get sharper thinking in return. Capture is the byproduct.

> Strenaysis is the **system of record for judgment.**

## The model: one captured context, many membranes

A **membrane** is a projection of the node graph across six dials:

| Dial | What it controls |
|---|---|
| **Scope** | Which nodes, and to what depth |
| **Fields** | Which parts of a node (title / rationale / finding / assumptions) |
| **Provenance floor** | Minimum authorship level that is visible |
| **Tone / format** | Terse-technical vs. narrative-confident |
| **Sync mode** | Live vs. published/gated |
| **Direction** | Read-only vs. viewer can react (and it flows back) |

### The five presets

| Membrane | Audience | Shows | Sync |
|---|---|---|---|
| **Working** | You | Everything, the full mess | Live |
| **Teammate brief** | Colleague joining mid-project | The *why, fast*: decisions + why, ruled-out + why, live edges + owners, landmines/caveats | Live |
| **Client update** | Client, mid-project | Curated progress, headline findings, scope asks | **Published** |
| **Final deliverable** | Client, end | The defensible reasoning trail (already built) | Published |
| **Template** | Future you | Structure only, reset for re-acceptance (already built) | n/a |

## Two things that fall out of this

**1. Provenance *is* the visibility rule.** The `AI proposed → you edited → you authored` ladder is exactly the "how radioactive is this" scale. The client membrane sets its provenance floor at "accepted", so un-owned, assumption-laden thinking is *structurally* invisible, not manually redacted. The mechanism that protects the consultant's authority also powers safe client comms.

**2. The status update writes itself: the wedge.** The biggest trust-killer in the research is the visibility gap (the "just checking in" email). But the graph *changes* between updates: branches move Framed→Answered, new questions open. That **delta, filtered through the client membrane, is the weekly status update**, auto-drafted, consultant tweaks and ships in ~90 seconds. That's the reason to adopt this over Notion.

## Positions taken

- **Published, not live.** A client watching your uncertainty churn is worse than silence. "Publish update" *becomes* the trust-building weekly cadence. Working vs. published state, like git; the gap between them is the consultant's judgment.
- **Scope-creep defense, made active.** The client membrane has a **"Requests outside current scope"** lane. New asks land there, visible and timestamped: *"Happy to add this. Here's the branch it becomes and what it pushes."* A scope-negotiation instrument no status dashboard has, because they don't know the agreed structure.
- **Bidirectional (lightweight).** The client can react on the published view ("aligned" / "why this?"); reactions flow back as timestamped context on the node. Kills "you never told me" disputes.

## The generalization

The **grilling is domain-specific; the engine is domain-general.**
- Data → MECE issue trees; `Confirmed / Assumption / Hypothesis`.
- Product → JTBD / opportunity-solution trees; `Evidence / Bet / Validated`.
- AI → feasibility / eval-design / data-readiness / risk trees.

Architecture: **engine** (nodes, context accretion, provenance, membranes, templates) **+ swappable "grilling packs"** per domain. Nail data-strategy first; draw the pack boundary now so other domains are config, not forks.

## Traps

- **The PKM / second-brain graveyard.** Capture dies when it's friction and retrieval is unrewarding. Every grilling exchange must *pay rent in the moment* (a sharper question, a caught assumption) or it won't survive a Thursday-6pm deadline. **Riskiest assumption; test first.**
- **Becoming another status dashboard.** Membranes must be *free projections of the work*, never separately maintained. The instant a consultant updates a "client view" in addition to doing the work, it rots.
- **Going horizontal too early.** Architect for packs; ship one domain.

## Riskiest assumption to test next

Does the grilling actually pay rent in the moment for a real consultant on a real question, enough that capture is a byproduct they don't resent? Everything else rests on this.
