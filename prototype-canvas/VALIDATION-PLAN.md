# Validation Plan: "Does the grilling pay rent?"

*The riskiest assumption in the whole product. If it fails, the capture-graveyard trap kills Strenaysis regardless of how good the membranes are.*

## The assumption, in falsifiable form

> When a real consultant works a real, high-stakes question, the node coaching thread makes their thinking **sharper in the moment**, enough that capturing context is a byproduct they *don't resent* under deadline pressure.

**Not** "do they like it in a demo." The test is whether it earns its place when they're busy and skeptical.

## Kill criteria (decide these before running)

Falsified if, across 5–6 sessions, **the majority**:
- Skip or rush the thread to "get to the real work" (treat it as data entry), OR
- Say the questions felt generic / could be ignored with no loss, OR
- Never produce a single "huh, good point" moment (no reframe, no caught assumption).

Confirmed if the majority:
- Change at least one answer, tag, or the question itself *because* of a coaching prompt, AND
- Unprompted, describe the thread as helping them think (not just record), AND
- Say they'd use it again on their next real engagement.

## Method

- **Format**: 45-min moderated think-aloud, 5–6 practicing data consultants (mix: 1–2 solo/boutique, 2–3 firm, 1 in-house analytics lead).
- **Bring-your-own question**: they use a *real* current engagement question, not our demo. Generic questions can't test specificity.
- **Task**: frame the question → work 2–3 nodes through the coaching thread → glance at the client update. Moderator stays quiet; only prompts "what are you thinking?"
- **No leading**: never say "coaching" or "grilling." See if they engage with it unprompted.

## What to measure

| Signal | How | Reads as |
|---|---|---|
| Reframe moments | Count times an answer/tag/question changes *because* of a prompt | Pays rent (behavioral) |
| Skip rate | Do they answer or bail to the tree? | Friction |
| Time-to-value | Seconds before the first "good point" reaction | Rent speed |
| Tag honesty | Do they use Assumption/Hypothesis, or mark everything Confirmed to move on? | Whether the epistemic layer is real |
| Unprompted language | "This made me realize…" vs "do I have to?" | Attitudinal |
| Return intent | "Next engagement?" (0–10) | Adoption |

## Interview script (abbrev.)

1. "Walk me through a real question you're wrestling with now." (capture it verbatim)
2. "Use the tool however feels natural. Think out loud." *(silent observation, this is the core)*
3. After: "Where did it help? Where did it get in your way?"
4. "Was anything about the questions annoying or obvious?" *(hunt for the generic-question failure)*
5. "If this were on your machine Monday, would you open it? For what?"

## Prototype prerequisites before testing

- The mock followups must feel non-generic. **If followups are canned, testers will correctly call it out**. Either wire a real model for the test, or hand-author followups for the 2–3 questions you'll steer them toward.
- Seed nothing; let them start cold. A pre-filled tree hides the framing friction.

---

## Simulated persona dry-run (pre-mortem)

Run before real users to catch obvious failures cheaply. Three personas walked through the current thread:

**Maya, solo consultant, skeptical, deadline-driven.**
- *Predicted*: Answers Q1, tags it Assumption honestly. At Q4 ("what are you assuming about the data?") she pauses, genuinely useful. But by Q5 she wants to stop; five fixed questions feels like a form.
- *Failure surfaced*: **A fixed 5-question bank reads as a form.** → *Design response*: make the thread adaptive/optional: 1–2 sharp questions surfaced, "ask another" on demand, never a fixed queue. The current `GRILL_QS` array is the risk.

**Devin, firm consultant, wants speed.**
- *Predicted*: Marks everything Confirmed to advance fast, defeating the epistemic layer.
- *Failure surfaced*: **No friction against dishonest tagging.** → *Design response*: the followup for "Confirmed" should occasionally push back ("confirmed how? what's the source?"), so Confirmed isn't the lazy path. Tie Confirmed → must have a finding.

**Priya, in-house analytics lead, presents to execs.**
- *Predicted*: Loves that assumptions are held back from the client view; immediately asks "can I see what the client sees?" → the View-as-client we just built lands.
- *Success*: The membrane payoff is legible without explanation. Keep.

### Net from the dry-run
The single most likely real-world failure is **the fixed question bank feeling like a form** (Maya). Fix before testing: make grilling adaptive and optional, not a fixed 5-item queue. That one change is the difference between "pays rent" and "data entry."

## Recommended next build (post-test)
Make the coaching thread **adaptive**: surface one well-targeted question at a time based on the node + prior answers, with "ask another" rather than a visible queue, directly de-risking the top failure mode above.
