# Strenaysis -- Frontend Prototype Spec

**Handoff date:** April 17, 2026
**Author:** Euphie
**Prototype location:** `prototype/` folder (5 files: `_shared.css`, `step-1-home.html`, `step-2-roadmap.html`, `step-3-buildup.html`, `step-4-summary.html`)

---

## 1. Product overview

Strenaysis is a guided analytical coaching tool for data scientists. It helps users structure a business question into a defensible analysis plan by walking them through a series of "nodes" -- each node is a focused sub-problem with LLM-generated coaching questions.

**Users:** data science students, interview candidates, practicing DS/analytics professionals.

**Core loop:** Ask a question, get a structured analysis path, work through each node in a guided Q&A, then review and export the full analysis.

---

## 2. Flow walkthrough

The product is a 4-step linear flow. Users can navigate freely between steps (no gating).

### Step 1: Start with a question (`step-1-home.html`)

The landing page. User types a plain-language business question into a composer.

**Key behaviors:**
- Textarea with 600-character limit. Counter shows `{n} / 600` while typing, "Type a question to continue" when empty.
- "Structure the problem" CTA is disabled (`aria-disabled`, `pointer-events: none`, `opacity: 0.42`) until the textarea has content and is within the limit.
- Optional expandable "Add context" section (`<details>`) for who's asking and what hangs on the answer.
- "Save as draft" ghost button (not wired).
- Recent problems list below the composer, showing 3 in-progress or completed analyses with status dots (green = done, blue = in progress), type tag (Causal, Descriptive), and which step they're on.
- Keyboard: `Cmd+Enter` triggers the CTA.

**What the backend needs to provide:**
- `POST /problems` -- create a new problem from `{ question: string, context?: string }`. Return a `problem_id`.
- `GET /problems?status=recent` -- list of recent problems for the "Pick up where you left off" section. Each needs: `id`, `question` (truncated), `problem_type`, `current_step`, `status` (in_progress | complete), `updated_at`.

---

### Step 2: Choose an analysis path (`step-2-roadmap.html`)

Displays the user's question, the system's problem-type classification, and a list of generated nodes.

**Key behaviors:**

**Problem assessment panel (right column):**
- System auto-classifies the question into one of 4 types: Descriptive, Predictive modeling, Experiment/causal, Operational optimization.
- One type is marked "Recommended" (the system's classification).
- Radio buttons let the user override the type.
- When the user selects a different type from the original, an "Update analysis path" button appears with explanatory text: "Updating will regenerate the node list for this problem type. Your existing answers will be preserved where nodes overlap."
- Clicking "Update analysis path" triggers a regeneration of the node list (prototype simulates with a fade animation).

**Node list:**
- Ordered list of nodes, each showing: drag handle, number (01-07+), title, description (truncated), status chip, action link.
- Node states: not started (neutral), in-progress (amber left border, amber number, "Continue" link), settled (green left border, green number, "Review" link).
- Drag-and-drop reorder via grip handle only (clicks on the row navigate to Step 3). Uses HTML5 drag-and-drop API.
- Drop indicator shows as a 2px accent line above or below the target row.

**Add custom node:**
- Dashed-border trigger button below the node list: "+ Add a custom node".
- Clicking opens an inline form with: node name input, description textarea, hint text, Cancel/Add node buttons.
- Validation: name must be 2+ characters. Submit via button or `Cmd+Enter`. Cancel via button or `Escape`.
- New node appends to the list with "Not started" status, renumbers all nodes.
- Sticky bar counter updates to reflect new total.

**Sticky bar:**
- Shows `{n} of {total} settled` counter.
- "Back to question" ghost button, "Continue to workspace" primary button (always enabled, no gating).

**What the backend needs to provide:**
- `GET /problems/:id/assessment` -- returns `{ recommended_type, explanation, nodes: Node[] }`.
- `PUT /problems/:id/type` -- user overrides type, body: `{ type: "descriptive" | "predictive" | "causal" | "optimization" }`.
- `POST /problems/:id/regenerate-nodes` -- regenerates nodes for the new type. Returns new `Node[]`. Should preserve answers for nodes that exist in both old and new sets.
- `POST /problems/:id/nodes` -- add custom node, body: `{ name: string, description: string }`. Returns the new node with a generated `node_id`.
- `PUT /problems/:id/nodes/reorder` -- body: `{ node_ids: string[] }` (ordered list).

**Node shape:**
```
{
  node_id: string,
  name: string,
  description: string,
  position: number,        // 1-indexed display order
  status: "open" | "in_progress" | "settled",
  questions_answered: number,
  questions_total: number,
  is_custom: boolean
}
```

---

### Step 3: Guided workspace (`step-3-buildup.html`)

The core interaction. A full-page coaching Q&A for a single node at a time.

**Key behaviors:**

**Node tabs (horizontal):**
- All nodes appear as tabs at the top. Clicking a tab switches the view without a page reload.
- Tab states: default (muted), active (accent underline, accent number), done (checkmark replaces number, success color).

**Node brief panel:**
- Three sections: Description (from node data), Guidance (one-liner about the approach), and a collapsible "How I'm breaking this down" section.
- The thinking breakdown is an ordered list of labeled steps the LLM uses to generate coaching questions. Each item has a bold label and a plain-text explanation.

**Conversation thread:**
- Sequential Q&A exchanges, each with:
  - **AI question:** avatar ("S"), label ("Q1 of 4"), question text.
  - **User response** (if answered): response type tag (Confirmed/green, Assumption/amber, Hypothesis/blue), answer text, "Edit response" button.
  - **AI follow-up** (if present): indented text with a left accent border, providing feedback on the user's answer.
  - **Composer** (for the current unanswered question): textarea, response-type dropdown, character count, disabled "Submit answer" button (enables at 10+ chars).
- Future unanswered questions show only the question text, no composer.
- After submitting, a stub follow-up is generated, a new action item is auto-suggested, and the next question's composer appears.
- When all questions are answered, the node status flips to "done" and its tab shows a checkmark.

**Action items (workplan) section:**
- Appears below the conversation thread.
- Accordion of action items. Each item has: letter label (A, B, C...), title, "From Q{n}" tag, and an expandable body with fields for: Action (textarea), Owner, Collaborator, Source/system, Needs approval (dropdown), Artifact to create, Blockers.
- One item open at a time (accordion behavior).
- "+ Add item" button creates a blank item and opens it.
- "Remove item" button deletes the item.
- Auto-save indicator pulses on any field change.

**Sticky bar:**
- Save indicator ("All changes saved" with green dot).
- Progress strip: 7 small bars (filled = done, accent = current, empty = not started) + "{n} of 7 settled" counter.
- "Back to analysis path" and "Continue to summary" navigation buttons.

**What the backend needs to provide:**

- `GET /problems/:id/nodes/:node_id` -- returns full node data including questions, answers, thinking breakdown, and action items.

**Node detail shape:**
```
{
  node_id: string,
  name: string,
  description: string,
  guidance: string,           // one-line coaching brief
  thinking: [                 // LLM's breakdown steps
    { label: string, text: string }
  ],
  questions: [
    {
      question_id: string,
      text: string,
      answer?: string,
      response_type?: "confirmed" | "assumption" | "hypothesis",
      followup?: string       // LLM-generated feedback
    }
  ],
  actions: [
    {
      action_id: string,
      title: string,
      detail: string,
      owner: string,
      collaborator: string,
      source: string,
      approval: string,
      artifact: string,
      blockers: string,
      from_question: number   // which Q generated this suggestion
    }
  ]
}
```

- `POST /problems/:id/nodes/:node_id/answers` -- submit an answer. Body: `{ question_id, answer: string, response_type: string }`. The backend should:
  1. Store the answer.
  2. Generate an LLM follow-up for this answer.
  3. Optionally generate a suggested action item.
  4. Return `{ followup: string, suggested_action?: Action, node_status: string }`.

- `PUT /problems/:id/nodes/:node_id/answers/:question_id` -- edit an existing answer.

- `POST /problems/:id/nodes/:node_id/actions` -- add a custom action item.
- `PUT /problems/:id/nodes/:node_id/actions/:action_id` -- update action item fields.
- `DELETE /problems/:id/nodes/:node_id/actions/:action_id` -- remove an action item.

---

### Step 4: Review and export (`step-4-summary.html`)

A read-only report view of the entire analysis.

**Key behaviors:**

**Meta strip:**
- 4-cell grid: Problem type, Nodes (e.g. "7 of 7 settled"), Owner, Created date.

**Executive summary:**
- LLM-generated paragraph synthesizing the entire analysis. This is the most important piece of generated text -- it should reference key findings, risks, and the decision rule.

**Node-by-node reports:**
- For each node: number, title, status chip, narrative summary (LLM-generated from the Q&A), collapsible Q&A disclosure showing all questions/answers/follow-ups/unanswered items, and an action items table.

**Consolidated workplan:**
- Table of all action items across all nodes with: sequential number, source node, action text, owner, approval status.

**Export bar:**
- Download .docx and .pptx buttons (currently disabled / "coming soon").

**Bottom actions:**
- "Start a new problem" link back to Step 1.
- "Save to history" primary button (`Cmd+S` shortcut).

**What the backend needs to provide:**
- `GET /problems/:id/summary` -- returns the full summary view including:

```
{
  problem_id: string,
  question: string,
  problem_type: string,
  owner: string,
  created_at: string,
  executive_summary: string,    // LLM-generated
  nodes: [
    {
      name: string,
      position: number,
      status: string,
      summary: string,           // LLM-generated narrative
      questions_answered: number,
      questions_total: number,
      questions: Question[],     // full Q&A thread
      actions: Action[]
    }
  ],
  workplan: Action[]             // consolidated from all nodes
}
```

- `POST /problems/:id/export` -- body: `{ format: "docx" | "pptx" }`. Returns a file download.
- `POST /problems/:id/save` -- saves to the user's history/library.

---

## 3. Data model summary

### Core entities

| Entity | Key fields |
|---|---|
| **Problem** | `id`, `question`, `context`, `problem_type`, `recommended_type`, `owner`, `status`, `created_at`, `updated_at` |
| **Node** | `id`, `problem_id`, `name`, `description`, `guidance`, `thinking[]`, `position`, `status`, `is_custom` |
| **Question** | `id`, `node_id`, `text`, `position` |
| **Answer** | `id`, `question_id`, `text`, `response_type`, `followup` |
| **Action** | `id`, `node_id`, `title`, `detail`, `owner`, `collaborator`, `source`, `approval`, `artifact`, `blockers`, `from_question` |

### Relationships

- A Problem has many Nodes (ordered by position).
- A Node has many Questions (ordered by position).
- A Question has zero or one Answer.
- A Node has many Actions.
- An Answer triggers LLM generation of a follow-up and optionally a suggested Action.

---

## 4. LLM integration points

The LLM is involved at these moments (not in real-time streaming, but as request-response calls):

| Trigger | Input | Output |
|---|---|---|
| Problem submitted (Step 1 to Step 2) | User's question + context | Problem type classification, explanation, and a set of nodes with questions, descriptions, guidance, and thinking breakdowns |
| Problem type changed (Step 2) | User's question + new type | Regenerated node set (preserving overlapping answers) |
| Answer submitted (Step 3) | Question text + user's answer + response type + prior Q&A context for this node | Follow-up text + optional suggested action item |
| Summary generated (Step 4) | All Q&A across all nodes | Executive summary paragraph + per-node narrative summaries |

---

## 5. State management notes

- **Auto-save:** All edits (answers, action item fields, question text edits) should auto-save. The UI shows a save indicator that pulses "Saving..." then settles to "Saved just now."
- **No gating between steps:** Users can navigate to any step at any time. Step 3 works with partially answered nodes. Step 4 renders whatever is available (unanswered questions show as "Not yet answered").
- **Non-linear node work:** Nodes can be worked in any order. There are no dependencies between nodes. The tab bar in Step 3 allows instant switching.
- **Response types:** Every answer is tagged as Confirmed (user is sure), Assumption (user is guessing), or Hypothesis (user is speculating). These tags carry through to the review and affect how the summary is framed.

---

## 6. Component inventory

### Shared (`_shared.css`)
- App frame (240px sidebar + main content, collapses to single column at 960px)
- Sidebar: brand, step progress nav, workspace nav, footer
- Topbar with breadcrumbs
- Eyebrow label (step indicator)
- Page title (`h1.title`) and lead paragraph (`p.lede`)
- Buttons: `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`
- Panels: `.panel` with `.panel-title` and `.panel-sub`
- Form elements: textarea, text input, select (all with focus states using accent ring)
- Chips: `.chip` with status dots (`.ok`, `.active`, `.warn`)
- Field labels, error states, hint text

### Step 1
- Composer (textarea with focus ring on container, not on textarea itself)
- Recent problems list (grid rows with status dots, type tags, date)

### Step 2
- Two-column layout: question panel + assessment panel
- Problem type radio buttons with custom styling
- "Update analysis path" conditional button
- Node list (drag-and-drop rows with grip handles)
- Add node inline form
- Sticky action bar

### Step 3
- Node tabs (horizontal, scrollable)
- Node brief panel (description + guidance + collapsible thinking)
- Conversation thread (AI messages + user responses + follow-ups)
- Composer (textarea + response type dropdown + submit)
- Action items accordion (expandable details with form fields)
- Sticky bar with save indicator and progress strip

### Step 4
- Meta strip (4-cell grid)
- Executive summary block
- Node report sections (header + narrative + collapsible Q&A + action table)
- Consolidated workplan table
- Export bar

---

## 7. Design tokens

All design tokens are in `_shared.css` `:root`. The key ones for backend-rendered views:

**Colors (OKLCH):** `--bg` (warm off-white), `--surface` (white), `--ink` (near-black), `--accent` (cobalt blue), `--success` (green), `--warning` (amber).

**Typography:** Geist (sans) + JetBrains Mono (mono). 6-stop type scale from `--text-xs` (11px) to `--text-2xl` (32px). Three line-height tokens, three weight tokens.

**Spacing:** 9-step scale from `--s-1` (4px) to `--s-9` (80px).

---

## 8. Open questions for backend

1. **LLM latency:** How long does node generation take? The prototype does not show loading states for LLM calls. We may need skeleton screens or streaming for the executive summary and follow-up generation.

2. **Problem type node mapping:** Are the node sets per problem type fixed templates, or does the LLM generate them dynamically each time? If templates, they can be cached.

3. **Collaborative editing:** The prototype is single-user. If multiple people will work on the same problem, we need to decide on conflict resolution for action item fields.

4. **Export format:** The .docx and .pptx export buttons are stubbed. What library/service will generate these? The content structure is well-defined (executive summary + node reports + workplan table).

5. **History and search:** The sidebar shows "History" with a badge count. What does the history view look like? Just a list, or does it need filtering/search?

6. **Authentication:** No auth is shown in the prototype. Will this be behind a login?

---

## 9. Files included

```
prototype/
  _shared.css          -- design tokens + shared component styles
  step-1-home.html     -- Step 1: question input
  step-2-roadmap.html  -- Step 2: problem assessment + node list
  step-3-buildup.html  -- Step 3: guided Q&A workspace
  step-4-summary.html  -- Step 4: review and export
  SPEC.md              -- this file
```

All pages are static HTML with vanilla JS. No build step, no framework. Open any HTML file in a browser to see the prototype. The pages link to each other for navigation, and Step 3 contains the most complex client-side logic (node switching, dynamic thread rendering, action item management).
