/* Strenaysis SPA core — Steps 1, 2, 3 end-to-end. Step 4 stubbed.
   Backend contract (unchanged):
     GET  /api/problem-framings  → { items: [...] }
     POST /api/roadmap           → { problem, problem_details, roadmap, source,
                                     problem_type, inferred_problem_type,
                                     assessment_title, assessment_recap }
     POST /api/node-build        → { execution_summary, key_question, workstreams,
                                     extracted_context, open_questions,
                                     execution_items, output }
   Step 3 maps the backend's node-build into the prototype's Q&A model:
     open_questions[]   → thread questions
     execution_items[]  → action items accordion
     execution_summary  → Guidance line
     workstreams[]      → "How I'm breaking this down" labeled list
   Answers, response-type tags, and followups are persisted to localStorage
   (debounced) so the in-progress framing survives page reloads / accidental
   navigation. Use Save to history in Step 4 to persist to the backend. */

(function () {
  "use strict";

  /* ============ Constants ============ */
  const MAX_QUESTION_CHARS = 600;
  const MIN_ANSWER_CHARS = 10;
  const DRAFT_KEY = "strenaysis.draft.v1"; // legacy: just the textarea contents
  const STATE_KEY = "strenaysis.state.v1"; // full in-progress framing snapshot

  const TYPE_LABELS = {
    descriptive_analysis: "Descriptive",
    predictive_modeling: "Predictive modeling",
    experiment_causal_question: "Experiment / causal",
    operational_optimization: "Operational optimization",
  };

  const NUMBER_WORDS = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
  ];

  const APPROVAL_OPTIONS = [
    "No approval needed",
    "Business owner sign-off",
    "Leadership review",
    "Data access approval",
    "Legal or compliance review",
    "Finance approval",
    "Product Strategy Lead approval required",
  ];

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  /* ============ State ============ */
  const state = {
    view: "home", // "home" | "roadmap" | "buildup" | "summary"
    problem: "",
    problemDetails: "",
    problemType: "",
    inferredProblemType: "",
    assessmentTitle: "",
    assessmentRecap: "",
    nodes: [],
    nextCustomIdx: 1,
    draggingNodeId: null,
    isDragFromGrip: false,
    justDragged: false,
    activeNodeId: null,
    /* Per-node build cache:
       { [nodeId]: { loading, error, brief: {summary, thinking:[{label,text}]},
                     questions:[{id,text,answer?,responseType?,followup?}],
                     actions:[{id,title,detail,owner,collaborator,source,artifact,approval,blockers,fromQ}],
                     nextActionIdx } } */
    nodeBuilds: {},
    editingQid: null, // question id currently in edit mode (Step 3)
  };

  /* ============ DOM refs ============ */
  let problemInput, problemDetailsInput, contextDetails, charCounter,
    structureBtn, saveDraftBtn, recentCount, recentList, sideRecentNav,
    sideHistoryCount, sideStep1, sideCurrentProblem, cpSteps,
    homeView, roadmapView, buildupView, summaryStubView,
    roadmapTitle, roadmapQuestion, roadmapTypeChip, assessmentWhy,
    problemTypes, updatePathBtn, nodeListEl,
    addNodeTrigger, addNodeForm, newNodeName, newNodeDesc, saveNodeBtn,
    cancelNodeBtn, settledCountEl, backToHomeBtn, toWorkspaceBtn,
    /* Step 3 */
    crumbNode, buildupTitle, nodeTabsEl, nbDesc, nbGuidance, nbThinking,
    nbThinkingBody, threadEl, actionsCountEl, actionListEl, addActionBtn,
    saveIndicator, progressStripEl, progressCounter,
    backToRoadmapBtn, toSummaryBtn,
    /* Step 4 */
    summaryView, summaryStatusChip, summaryTitle, metaType, metaNodes,
    metaActions, metaDate, execSummaryText, nodeReportsEl, workplanSectionEl,
    workplanTbody, exportDocxBtn, exportPptxBtn, backToBuildupBtn,
    startNewBtn, saveHistoryBtn, saveToast;

  /* ============ Utilities ============ */
  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function truncate(str, max) {
    const s = String(str || "");
    return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
  }
  function pad2(n) { return n < 10 ? "0" + n : String(n); }
  function slugify(s) {
    return String(s || "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      .slice(0, 40);
  }
  function formatProblemType(raw) {
    const key = String(raw || "").trim();
    if (TYPE_LABELS[key]) return TYPE_LABELS[key];
    if (!key || key.toLowerCase() === "not set") return "—";
    return key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  function formatRelativeDate(saved_at) {
    const raw = String(saved_at || "").trim();
    if (!raw) return "—";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    const now = new Date();
    const sameDay = d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) return "Today";
    const yest = new Date(now); yest.setDate(now.getDate() - 1);
    if (d.getFullYear() === yest.getFullYear() &&
        d.getMonth() === yest.getMonth() && d.getDate() === yest.getDate())
      return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  /* Split a thesis statement into headline + supporting context at the first
     sentence boundary. Used by Step 4's h1/lede pair. If the remainder is
     trivially short, returns the full thesis as the lead with no trail. */
  function splitThesis(problem) {
    const text = String(problem || "").trim();
    if (!text) return { lead: "", trail: "" };
    /* Match "first chunk ending in .!? followed by whitespace and more text".
       Non-greedy so we stop at the FIRST boundary, not the last. */
    const m = text.match(/^([\s\S]+?[.!?])\s+([\s\S]+)$/);
    if (!m) return { lead: text, trail: "" };
    const lead = m[1].trim();
    const trail = m[2].trim();
    /* If trail is trivially short (single trailing fragment), keep the full
       thesis in the lead instead of awkwardly splitting. */
    if (trail.length < 30) return { lead: text, trail: "" };
    return { lead, trail };
  }

  function deriveSavedStatus(item) {
    const total = Number(item.node_count) || 0;
    const ready = Number(item.ready_count) || 0;
    if (total > 0 && ready >= total) return "done";
    return "in-progress";
  }

  /* ============ Node status (derived from nodeBuilds) ============ */
  function nodeStatus(nodeId) {
    const build = state.nodeBuilds[nodeId];
    if (!build || !build.questions || !build.questions.length) return "open";
    const total = build.questions.length;
    const answered = build.questions.filter((q) => q.answer && q.answer.trim()).length;
    if (answered >= total) return "settled";
    if (answered > 0) return "in-progress";
    return "open";
  }

  /* ============ View / sidebar routing ============ */
  function showView(name) {
    state.view = name;
    homeView.hidden = name !== "home";
    roadmapView.hidden = name !== "roadmap";
    buildupView.hidden = name !== "buildup";
    summaryView.hidden = name !== "summary";

    const isStep1 = name === "home";
    sideStep1.hidden = !isStep1;
    sideCurrentProblem.hidden = isStep1;

    if (!isStep1) {
      const activeStep = name === "roadmap" ? 2 : name === "buildup" ? 3 : 4;
      cpSteps.forEach((el) => {
        const step = Number(el.dataset.step);
        el.classList.remove("on", "done");
        if (step < activeStep) el.classList.add("done");
        if (step === activeStep) el.classList.add("on");
      });
    }

    window.scrollTo({ top: 0, behavior: "instant" });
    persistState();
  }

  /* ============ Step 1 — composer ============ */
  function updateComposer() {
    const raw = problemInput.value;
    const trimmedLen = raw.trim().length;
    const len = raw.length;
    const hasContent = trimmedLen > 0;
    const overLimit = len > MAX_QUESTION_CHARS;

    if (!hasContent) {
      charCounter.textContent = "Type a question to continue";
      charCounter.style.color = "var(--muted)";
    } else if (overLimit) {
      charCounter.textContent = len + " / " + MAX_QUESTION_CHARS + " — over the limit";
      charCounter.style.color = "var(--accent-ink)";
    } else {
      charCounter.textContent = len + " / " + MAX_QUESTION_CHARS;
      charCounter.style.color = "var(--muted)";
    }
    const enabled = hasContent && !overLimit;
    if (enabled) { structureBtn.removeAttribute("aria-disabled"); structureBtn.disabled = false; }
    else { structureBtn.setAttribute("aria-disabled", "true"); structureBtn.disabled = true; }
  }

  async function submitProblem() {
    if (structureBtn.disabled || structureBtn.getAttribute("aria-disabled") === "true") return;
    const problem = problemInput.value.trim();
    const problemDetails = problemDetailsInput.value.trim();
    if (!problem) return;

    state.problem = problem;
    state.problemDetails = problemDetails;
    const originalText = structureBtn.textContent;
    structureBtn.disabled = true; structureBtn.textContent = "Structuring…";

    try {
      const payload = await callRoadmap("");
      ingestRoadmapResponse(payload);
      /* First submit: pin "Recommended" to the LLM's classification.
         The backend's `inferred_problem_type` (a pre-LLM heuristic guess)
         can disagree with `problem_type` (the LLM's actual pick); when it
         does, trust the LLM since it had more context. */
      state.inferredProblemType = state.problemType;
      state.nodeBuilds = {}; // fresh problem → fresh per-node state
      renderRoadmap();
      showView("roadmap");
      persistState();
    } catch (err) {
      alert("Could not generate roadmap: " + err.message);
    } finally {
      structureBtn.disabled = false; structureBtn.textContent = originalText;
      updateComposer();
    }
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        problem: problemInput.value,
        problemDetails: problemDetailsInput.value,
        saved_at: new Date().toISOString(),
      }));
      saveDraftBtn.textContent = "Draft saved";
      setTimeout(() => { saveDraftBtn.textContent = "Save as draft"; }, 1500);
    } catch (e) { /* localStorage unavailable */ }
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft && typeof draft === "object") {
        if (draft.problem) problemInput.value = draft.problem;
        if (draft.problemDetails) {
          problemDetailsInput.value = draft.problemDetails;
          if (draft.problemDetails.trim()) contextDetails.open = true;
        }
      }
    } catch (e) { /* ignore corrupt draft */ }
  }

  /* ============ Full-state persistence (across reload / navigation) ============ */

  function persistState() {
    /* Debounced: collapse rapid mutations (drag-drop, field-typing) into one write. */
    clearTimeout(state._persistTimer);
    state._persistTimer = setTimeout(() => {
      if (!hasMeaningfulState()) {
        try { localStorage.removeItem(STATE_KEY); } catch (e) {}
        return;
      }
      try {
        localStorage.setItem(STATE_KEY, JSON.stringify({
          v: 1,
          view: state.view,
          problem: state.problem,
          problemDetails: state.problemDetails,
          problemType: state.problemType,
          inferredProblemType: state.inferredProblemType,
          assessmentTitle: state.assessmentTitle,
          assessmentRecap: state.assessmentRecap,
          nodes: state.nodes,
          nodeBuilds: state.nodeBuilds,
          activeNodeId: state.activeNodeId,
          nextCustomIdx: state.nextCustomIdx,
          savedAt: new Date().toISOString(),
        }));
      } catch (e) { /* localStorage full or unavailable — fail silently */ }
    }, 250);
  }

  function hasMeaningfulState() {
    /* "Meaningful" = past the home view (user has submitted a problem). */
    return !!state.problem && state.nodes.length > 0;
  }

  function restoreState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!saved || saved.v !== 1 || !saved.problem || !Array.isArray(saved.nodes)) return null;
      state.problem = String(saved.problem || "");
      state.problemDetails = String(saved.problemDetails || "");
      state.problemType = String(saved.problemType || "");
      state.inferredProblemType = String(saved.inferredProblemType || "");
      state.assessmentTitle = String(saved.assessmentTitle || "");
      state.assessmentRecap = String(saved.assessmentRecap || "");
      state.nodes = saved.nodes;
      state.nodeBuilds = (saved.nodeBuilds && typeof saved.nodeBuilds === "object") ? saved.nodeBuilds : {};
      state.activeNodeId = saved.activeNodeId || null;
      state.nextCustomIdx = Number(saved.nextCustomIdx) || (state.nodes.length + 1);
      const v = saved.view;
      if (v === "roadmap" || v === "buildup" || v === "summary") return v;
      return "roadmap"; // sensible fallback
    } catch (e) {
      return null;
    }
  }

  function clearPersistedState() {
    try { localStorage.removeItem(STATE_KEY); } catch (e) {}
  }

  /* ============ Step 1 — recent list ============ */
  async function loadRecent() {
    try {
      const response = await fetch("/api/problem-framings");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load saved problems.");
      renderRecent(payload.items || []);
    } catch (err) {
      recentCount.textContent = "Unavailable";
      recentList.innerHTML = '<div class="recent-empty">' + escapeHtml(err.message) + "</div>";
      sideRecentNav.innerHTML =
        '<div class="recent-empty" style="padding: 6px var(--s-3); text-align: left;">Unavailable</div>';
    }
  }

  /* Pseudo-row shown at the top of the recent list when there's in-progress
     in-memory state. Clicking it jumps back to wherever the user was. */
  function renderDraftResumeRow() {
    if (!hasMeaningfulState()) return "";
    const title = (state.problem || "").trim() || "Untitled draft";
    const type = formatProblemType(state.problemType || state.inferredProblemType);
    const total = state.nodes.length;
    const settled = state.nodes.filter((n) => nodeStatus(n.id) === "settled").length;
    const where = state.view === "buildup"
      ? "in workspace"
      : state.view === "summary" ? "reviewing"
      : "on analysis path";
    const progress = total > 0
      ? where + " · " + settled + " of " + total + " settled"
      : where;
    return (
      '<a class="recent-row in-progress" href="#" data-is-draft="1" tabindex="0" style="background: var(--accent-bg);">' +
      '<span class="status" aria-label="in progress"></span>' +
      '<span class="rtitle">' + escapeHtml(truncate(title, 100)) + "</span>" +
      '<span class="rtype">' + escapeHtml(type) + " · DRAFT</span>" +
      '<span class="rdate">Unsaved · ' + escapeHtml(progress) + "</span>" +
      "</a>"
    );
  }

  function resumeInMemoryDraft() {
    /* Heuristic: state.view is set to "home" the moment the user navigates
       there, which masks where they were *in their flow*. Use activeNodeId
       as the real anchor — if they were working on a node, they want to
       resume there, not on Step 2. */
    if (state.activeNodeId && state.nodes.length) {
      const node = state.nodes.find((n) => n.id === state.activeNodeId);
      if (node) {
        renderBuildupShell();
        renderBuildupBriefAndThread();
        renderActions();
        renderProgressStrip();
        showView("buildup");
        return;
      }
    }
    if (state.nodes.length) {
      renderRoadmap();
      showView("roadmap");
      return;
    }
    showView("home");
  }

  function renderRecent(items) {
    const total = items.length;
    const inProgressCount = items.filter((i) => deriveSavedStatus(i) !== "done").length;
    const completeCount = total - inProgressCount;
    sideHistoryCount.textContent = total ? String(total) : "—";

    if (!total) {
      recentCount.textContent = "No saved items";
      recentList.innerHTML =
        '<div class="recent-empty">No saved problem framings yet. Once you save one, it will show up here.</div>';
      sideRecentNav.innerHTML =
        '<div class="recent-empty" style="padding: 6px var(--s-3); text-align: left;">Nothing saved yet.</div>';
      return;
    }
    recentCount.textContent = inProgressCount > 0
      ? inProgressCount + " in progress" + (completeCount ? " · " + completeCount + " complete" : "")
      : total + " complete";

    const top = items.slice(0, 5);
    const savedRowsHtml = top.map((item) => {
      const status = deriveSavedStatus(item);
      /* Prefer the full thesis (item.problem) for display; problem_name is a
         truncated label that, in older saves, was sourced from the AI's
         commentary instead of the thesis. */
      const title = (item.problem || item.problem_name || "").trim() || "Untitled problem";
      const type = formatProblemType(item.problem_type);
      const date = formatRelativeDate(item.saved_at);
      const tot = Number(item.node_count) || 0;
      const ready = Number(item.ready_count) || 0;
      const progress = status === "done" ? "complete"
        : tot > 0 ? "in progress · " + ready + " of " + tot + " settled" : "in progress";
      return (
        '<a class="recent-row ' + status + '" href="#" data-filename="' +
        escapeHtml(item.filename) + '" tabindex="0">' +
        '<span class="status" aria-label="' + status + '"></span>' +
        '<span class="rtitle">' + escapeHtml(truncate(title, 110)) + "</span>" +
        '<span class="rtype">' + escapeHtml(type) + "</span>" +
        '<span class="rdate">' + escapeHtml(date) + " · " + progress + "</span>" +
        "</a>"
      );
    }).join("");

    /* Resume-draft pseudo-row: shown at the top when there's in-memory
       in-progress work that hasn't been saved to history yet. */
    const draftRowHtml = renderDraftResumeRow();
    recentList.innerHTML = draftRowHtml + savedRowsHtml;

    const sidebarItems = items.slice(0, 4);
    sideRecentNav.innerHTML = sidebarItems.map((item) => {
      const title = (item.problem || item.problem_name || "").trim() || "Untitled";
      const status = deriveSavedStatus(item);
      const dotColor = status === "done" ? "var(--success)" : "var(--accent)";
      return (
        '<a href="#" style="font-weight:400;" data-filename="' +
        escapeHtml(item.filename) + '">' +
        '<span class="side-ico" style="color:' + dotColor + ';">●</span> ' +
        escapeHtml(truncate(title, 28)) +
        "</a>"
      );
    }).join("");

    recentList.querySelectorAll(".recent-row").forEach((row) => {
      row.addEventListener("click", (e) => {
        e.preventDefault();
        if (row.dataset.isDraft === "1") {
          resumeInMemoryDraft();
        } else {
          loadSavedFraming(row.dataset.filename);
        }
      });
    });
    sideRecentNav.querySelectorAll("a[data-filename]").forEach((row) => {
      row.addEventListener("click", (e) => {
        e.preventDefault();
        loadSavedFraming(row.dataset.filename);
      });
    });
  }

  /* ============ Load a saved framing ============ */
  async function loadSavedFraming(filename) {
    if (!filename) return;
    const hasWork = !!state.problem || Object.keys(state.nodeBuilds).length > 0;
    if (hasWork && !window.confirm(
      "Loading this saved framing will replace your current in-memory work. " +
      "(The framings on disk are unaffected.) Continue?"
    )) return;

    try {
      const r = await fetch("/api/problem-framings/" + encodeURIComponent(filename));
      const payload = await r.json();
      if (!r.ok) throw new Error(payload.error || "Could not load framing.");
      hydrateFromSaved(payload);
      renderSummary();
      showView("summary");
    } catch (err) {
      alert("Could not load saved framing: " + (err.message || "unknown error"));
    }
  }

  function hydrateFromSaved(payload) {
    state.problem = String(payload.problem || "").trim();
    state.problemDetails = String(payload.problem_details || "").trim();
    state.problemType = String(payload.problem_type || "").trim();
    state.inferredProblemType = String(payload.problem_type || "").trim();
    state.assessmentTitle = String(payload.assessment_title || "").trim();
    state.assessmentRecap = String(payload.assessment_recap || "").trim();

    const seen = new Set();
    const rawNodes = Array.isArray(payload.nodes) ? payload.nodes : [];
    state.nodes = rawNodes.map((raw, i) => {
      const baseId = "n_" + (i + 1) + "_" + (slugify(raw.title) || "node");
      let id = baseId, n = 1;
      while (seen.has(id)) { n++; id = baseId + "_" + n; }
      seen.add(id);
      return {
        id,
        title: String(raw.title || ("Node " + (i + 1))).trim(),
        description: String(raw.why || "").trim(),
        breakdown: String(raw.breakdown || "").trim(),
        isCustom: !!raw.is_custom,
      };
    });

    state.nodeBuilds = {};
    state.nodes.forEach((node, i) => {
      const raw = rawNodes[i] || {};
      const build = raw.build && typeof raw.build === "object" ? raw.build : {};
      const workstreams = Array.isArray(build.workstreams) ? build.workstreams : [];
      const thinking = workstreams.map((w) => ({
        label: String(w.name || "").trim() || "Workstream",
        text: String(w.purpose || "").trim(),
      }));
      const items = Array.isArray(build.execution_items) ? build.execution_items : [];
      const actions = items.map((item, k) => {
        const actionText = String(item.action || "").trim();
        return {
          id: "a_" + node.id + "_" + (k + 1),
          title: actionText ? truncate(actionText, 80) : ("Action " + (k + 1)),
          detail: actionText,
          owner: String(item.owner || "").trim(),
          collaborator: String(item.collaborator || "").trim(),
          source: String(item.source || "").trim(),
          artifact: String(item.artifact || "").trim(),
          approval: APPROVAL_OPTIONS.includes(String(item.approval || "").trim())
            ? String(item.approval).trim()
            : APPROVAL_OPTIONS[0],
          blockers: String(item.blockers || "").trim(),
          fromQ: null,
        };
      });
      const rawQs = Array.isArray(raw.questions) ? raw.questions : [];
      const questions = rawQs.map((q, k) => {
        const ans = String(q.answer || "").trim();
        return {
          id: "q_" + node.id + "_" + (k + 1),
          text: String(q.text || "").trim(),
          answer: ans,
          responseType: ans ? (String(q.response_type || "").trim() || "assumption") : "",
          followup: String(q.followup || "").trim(),
        };
      });
      state.nodeBuilds[node.id] = {
        loading: false,
        loaded: true,
        error: null,
        brief: {
          summary: String(build.execution_summary || "").trim(),
          thinking,
        },
        questions,
        actions,
        nextActionIdx: actions.length,
      };
    });
    state.activeNodeId = state.nodes[0] ? state.nodes[0].id : null;
    state.editingQid = null;
    state.nextCustomIdx = state.nodes.length + 1;
  }

  /* ============ Step 2 — roadmap ============ */
  async function callRoadmap(forcedType) {
    const response = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem: state.problem,
        problem_details: state.problemDetails,
        problem_type: forcedType || "",
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Unable to generate roadmap.");
    return payload;
  }

  function ingestRoadmapResponse(payload) {
    state.problem = payload.problem || state.problem;
    state.problemDetails = payload.problem_details || state.problemDetails;
    state.problemType = String(payload.problem_type || "").trim();
    /* Note: we intentionally do NOT overwrite state.inferredProblemType here.
       The "Recommended" marker should stay pinned to the system's ORIGINAL
       suggestion across re-generate calls. submitProblem() seeds it; the
       second call (from "Update analysis path") preserves it. */
    state.assessmentTitle = String(payload.assessment_title || "").trim();
    state.assessmentRecap = String(payload.assessment_recap || "").trim();

    const seen = new Set();
    state.nodes = (payload.roadmap || []).map((raw, i) => {
      const baseId = "n_" + (i + 1) + "_" + (slugify(raw.title) || "node");
      let id = baseId, n = 1;
      while (seen.has(id)) { n++; id = baseId + "_" + n; }
      seen.add(id);
      return {
        id,
        title: String(raw.title || ("Node " + (i + 1))).trim(),
        description: (raw.why || raw.suggested_context || "").trim(),
        breakdown: String(raw.breakdown || "").trim(),
        isCustom: false,
      };
    });
    state.nextCustomIdx = state.nodes.length + 1;
  }

  function renderRoadmapTitle() {
    const total = state.nodes.length;
    const word = NUMBER_WORDS[total] || String(total);
    roadmapTitle.textContent = total ? word + " nodes. Work them in any order." : "No nodes generated.";
  }

  function renderRoadmap() {
    renderRoadmapTitle();
    roadmapQuestion.value = state.problem;
    const typeLabel = formatProblemType(state.problemType || state.inferredProblemType);
    roadmapTypeChip.innerHTML = '<span class="dot"></span> ' + escapeHtml(typeLabel);
    assessmentWhy.textContent = state.assessmentRecap || "Assessment unavailable. Backend did not provide a recap.";

    problemTypes.querySelectorAll('input[name="ptype"]').forEach((r) => {
      r.checked = r.value === state.problemType;
    });
    problemTypes.querySelectorAll(".recommended-slot").forEach((slot) => {
      slot.innerHTML = slot.dataset.type === state.inferredProblemType
        ? '<span class="recommended">Recommended</span>' : "";
    });
    updatePathBtn.style.display = "none";

    renderNodeList();
    updateSettledCount();
  }

  function renderNodeList() {
    if (!state.nodes.length) {
      nodeListEl.innerHTML =
        '<div style="padding: var(--s-5) var(--s-5); color: var(--muted); font-size: var(--text-sm);">No nodes yet. Submit a question on Step 1 to generate a roadmap.</div>';
      return;
    }
    nodeListEl.innerHTML = state.nodes.map((node, i) => {
      const st = nodeStatus(node.id);
      const stCls = st === "settled" ? "settled" : st === "in-progress" ? "in-progress" : "";
      const stHtml = st === "settled"
        ? '<span class="chip ok"><span class="dot"></span> Settled</span>'
        : st === "in-progress"
          ? renderInProgressChip(node.id)
          : "Not started";
      const action = st === "settled" ? "Review →" : st === "in-progress" ? "Continue →" : "Start →";
      const descSafe = escapeHtml(node.description || "");
      return (
        '<a class="node-row ' + stCls + '" href="#" data-node-id="' +
        escapeHtml(node.id) + '" draggable="true">' +
        '<div class="nr-grip" data-grip="1"><span></span><span></span><span></span></div>' +
        '<span class="nr-num">' + pad2(i + 1) + "</span>" +
        '<div class="nr-body">' +
          '<div class="nr-title">' + escapeHtml(node.title) + "</div>" +
          (descSafe ? '<div class="nr-desc">' + descSafe + "</div>" : "") +
        "</div>" +
        '<span class="nr-status">' + stHtml + "</span>" +
        '<span class="nr-action">' + action + "</span>" +
        "</a>"
      );
    }).join("");

    nodeListEl.querySelectorAll(".node-row").forEach((row) => {
      row.addEventListener("click", (e) => {
        e.preventDefault();
        if (state.justDragged) { state.justDragged = false; return; }
        openNodeInBuildup(row.dataset.nodeId);
      });
    });
  }

  function renderInProgressChip(nodeId) {
    const build = state.nodeBuilds[nodeId];
    if (!build || !build.questions) return '<span class="chip warn"><span class="dot"></span> In progress</span>';
    const total = build.questions.length;
    const answered = build.questions.filter((q) => q.answer && q.answer.trim()).length;
    return '<span class="chip warn"><span class="dot"></span> ' + answered + " of " + total + "</span>";
  }

  function updateSettledCount() {
    const total = state.nodes.length;
    const settled = state.nodes.filter((n) => nodeStatus(n.id) === "settled").length;
    settledCountEl.textContent = settled + " of " + total + " settled";
  }

  /* ============ Step 2 — problem-type radios ============ */
  function onProblemTypeChange() {
    const selected = (problemTypes.querySelector('input[name="ptype"]:checked') || {}).value;
    if (!selected) { updatePathBtn.style.display = "none"; return; }
    if (selected !== state.problemType) {
      updatePathBtn.style.display = "";
      assessmentWhy.innerHTML =
        "You selected <strong>" + escapeHtml(formatProblemType(selected)) + "</strong>. " +
        "Updating will regenerate the node list for this problem type.";
    } else {
      updatePathBtn.style.display = "none";
      assessmentWhy.textContent = state.assessmentRecap || "Assessment unavailable.";
    }
  }

  async function triggerUpdatePath() {
    const selected = (problemTypes.querySelector('input[name="ptype"]:checked') || {}).value;
    if (!selected || selected === state.problemType) return;
    updatePathBtn.disabled = true; updatePathBtn.textContent = "Updating…";
    nodeListEl.style.opacity = "0.4"; nodeListEl.style.transition = "opacity 200ms ease";
    try {
      const payload = await callRoadmap(selected);
      ingestRoadmapResponse(payload);
      state.nodeBuilds = {}; // type changed → invalidate per-node state
      renderRoadmap();
      persistState();
    } catch (err) {
      alert("Could not update analysis path: " + err.message);
    } finally {
      updatePathBtn.disabled = false; updatePathBtn.textContent = "Update analysis path";
      nodeListEl.style.opacity = "";
    }
  }

  /* ============ Step 2 — drag-and-drop ============ */
  function wireDragAndDrop() {
    nodeListEl.addEventListener("mousedown", (e) => {
      state.isDragFromGrip = !!e.target.closest(".nr-grip");
    });
    nodeListEl.addEventListener("dragstart", (e) => {
      const row = e.target.closest(".node-row");
      if (!row) return;
      if (!state.isDragFromGrip) { e.preventDefault(); return; }
      state.draggingNodeId = row.dataset.nodeId;
      row.classList.add("dragging");
      try {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", row.dataset.nodeId);
      } catch (_) {}
      state.justDragged = true;
    });
    nodeListEl.addEventListener("dragend", (e) => {
      const row = e.target.closest(".node-row");
      if (row) row.classList.remove("dragging");
      nodeListEl.querySelectorAll(".drag-over, .drag-over-below").forEach((el) =>
        el.classList.remove("drag-over", "drag-over-below"));
      state.draggingNodeId = null; state.isDragFromGrip = false;
    });
    nodeListEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const row = e.target.closest(".node-row");
      if (!row || row.dataset.nodeId === state.draggingNodeId) return;
      nodeListEl.querySelectorAll(".drag-over, .drag-over-below").forEach((el) =>
        el.classList.remove("drag-over", "drag-over-below"));
      const rect = row.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      row.classList.add(e.clientY < midY ? "drag-over" : "drag-over-below");
    });
    nodeListEl.addEventListener("dragleave", (e) => {
      const row = e.target.closest(".node-row");
      if (row) row.classList.remove("drag-over", "drag-over-below");
    });
    nodeListEl.addEventListener("drop", (e) => {
      e.preventDefault();
      const row = e.target.closest(".node-row");
      if (!row || !state.draggingNodeId || row.dataset.nodeId === state.draggingNodeId) return;
      const fromIdx = state.nodes.findIndex((n) => n.id === state.draggingNodeId);
      if (fromIdx < 0) return;
      const rect = row.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const insertBefore = e.clientY < midY;
      const [moved] = state.nodes.splice(fromIdx, 1);
      let insertIdx = state.nodes.findIndex((n) => n.id === row.dataset.nodeId);
      if (!insertBefore) insertIdx += 1;
      state.nodes.splice(insertIdx, 0, moved);
      renderNodeList(); updateSettledCount();
      persistState();
    });
  }

  /* ============ Step 2 — add custom node ============ */
  function checkNodeForm() {
    saveNodeBtn.disabled = newNodeName.value.trim().length < 2;
  }
  function openAddNodeForm() {
    addNodeTrigger.style.display = "none";
    addNodeForm.classList.add("open"); newNodeName.focus();
  }
  function closeAddNodeForm() {
    addNodeForm.classList.remove("open");
    addNodeTrigger.style.display = "";
    newNodeName.value = ""; newNodeDesc.value = "";
    saveNodeBtn.disabled = true;
  }
  function saveCustomNode() {
    if (saveNodeBtn.disabled) return;
    const name = newNodeName.value.trim();
    const desc = newNodeDesc.value.trim() || "Custom node added by the user.";
    const idx = state.nextCustomIdx++;
    state.nodes.push({
      id: "custom_" + idx + "_" + (slugify(name) || "node"),
      title: name, description: desc, breakdown: "",
      isCustom: true,
    });
    closeAddNodeForm();
    renderNodeList(); renderRoadmapTitle(); updateSettledCount();
    persistState();
    setTimeout(() => {
      const last = nodeListEl.querySelector(".node-row:last-child");
      if (last) last.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  /* ============ Step 3 — build cache + fetch ============ */
  function ensureBuildSlot(nodeId) {
    if (!state.nodeBuilds[nodeId]) {
      state.nodeBuilds[nodeId] = {
        loading: false,
        loaded: false,
        error: null,
        brief: { summary: "", thinking: [] },
        questions: [],
        actions: [],
        nextActionIdx: 0,
      };
    }
    return state.nodeBuilds[nodeId];
  }

  async function fetchNodeBuild(node) {
    const slot = ensureBuildSlot(node.id);
    if (slot.loaded || slot.loading) return slot;
    slot.loading = true; slot.error = null;
    renderBuildupBriefAndThread(); // show loading state
    try {
      const response = await fetch("/api/node-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: state.problem,
          problem_details: state.problemDetails,
          problem_type: state.problemType,
          node_title: node.title,
          node_why: node.description,
          node_breakdown: node.breakdown || "",
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load node detail.");

      const ws = Array.isArray(payload.workstreams) ? payload.workstreams : [];
      const ec = Array.isArray(payload.extracted_context) ? payload.extracted_context : [];
      const thinking = ws.length
        ? ws.map((w) => ({
            label: String(w.name || w.purpose || "").trim() || "Workstream",
            text: String(w.purpose || w.completion_criteria || "").trim(),
          }))
        : ec.map((line, i) => ({ label: "Step " + (i + 1), text: String(line || "").trim() }));

      const oq = Array.isArray(payload.open_questions) ? payload.open_questions : [];
      slot.questions = oq.map((text, i) => ({
        id: "q_" + node.id + "_" + (i + 1),
        text: String(text || "").trim(),
      }));

      const items = Array.isArray(payload.execution_items) ? payload.execution_items : [];
      slot.nextActionIdx = items.length;
      slot.actions = items.map((item, i) => ({
        id: "a_" + node.id + "_" + (i + 1),
        title: String(item.action || "").trim() || ("Action " + (i + 1)),
        detail: String(item.action || "").trim(),
        owner: String(item.owner || "").trim(),
        collaborator: String(item.collaborator || "").trim(),
        source: String(item.source || "").trim(),
        artifact: String(item.artifact || "").trim(),
        approval: APPROVAL_OPTIONS.includes(String(item.approval || "").trim())
          ? String(item.approval).trim()
          : APPROVAL_OPTIONS[0],
        blockers: String(item.blockers || "").trim(),
        fromQ: null, // backend doesn't tag execution_items to questions
      }));

      slot.brief = {
        summary: String(payload.execution_summary || payload.key_question || "").trim(),
        thinking,
      };
      slot.loaded = true;
    } catch (err) {
      slot.error = err.message || "Unable to load node detail.";
    } finally {
      slot.loading = false;
      if (state.activeNodeId === node.id) {
        renderBuildupShell();
        renderBuildupBriefAndThread();
        renderActions();
        renderProgressStrip();
      }
    }
    return slot;
  }

  /* ============ Step 3 — open a node ============ */
  function openNodeInBuildup(nodeId) {
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    state.activeNodeId = nodeId;
    state.editingQid = null;
    showView("buildup");
    renderBuildupShell();
    ensureBuildSlot(nodeId);
    fetchNodeBuild(node); // async; will trigger re-render when done
    renderBuildupBriefAndThread();
    renderActions();
    renderProgressStrip();
  }

  /* ============ Step 3 — render ============ */
  function renderBuildupShell() {
    /* Tabs */
    nodeTabsEl.innerHTML = state.nodes.map((node) => {
      const st = nodeStatus(node.id);
      const onCls = node.id === state.activeNodeId ? " on" : "";
      const doneCls = st === "settled" ? " done" : "";
      const idx = state.nodes.indexOf(node) + 1;
      const tnum = st === "settled" ? "✓" : pad2(idx);
      return (
        '<button type="button" class="node-tab' + onCls + doneCls + '" data-node-id="' +
        escapeHtml(node.id) + '">' +
        '<span class="tnum">' + tnum + "</span> " +
        escapeHtml(node.title) +
        "</button>"
      );
    }).join("");
    nodeTabsEl.querySelectorAll(".node-tab").forEach((tab) => {
      tab.addEventListener("click", () => openNodeInBuildup(tab.dataset.nodeId));
    });

    const node = state.nodes.find((n) => n.id === state.activeNodeId);
    if (node) {
      buildupTitle.textContent = node.title;
      crumbNode.textContent = node.title;
      document.title = "Strenaysis — Workspace · " + node.title;
    }

    /* Persistent "Answering: <thesis>" reminder. Anchors the user to the
       original problem while they work in a specific node. */
    const thesisEl = document.getElementById("buildup-thesis-context");
    const thesisText = document.getElementById("buildup-thesis-text");
    const thesis = (state.problem || "").trim();
    if (thesis) {
      thesisText.textContent = truncate(thesis, 220);
      thesisText.title = thesis; // full text on hover
      thesisEl.hidden = false;
    } else {
      thesisEl.hidden = true;
    }
  }

  function renderBuildupBriefAndThread() {
    const node = state.nodes.find((n) => n.id === state.activeNodeId);
    const slot = state.nodeBuilds[state.activeNodeId];
    if (!node || !slot) return;

    /* Brief */
    nbDesc.textContent = node.description || "—";
    if (slot.loading) {
      nbGuidance.textContent = "Loading guidance…";
    } else if (slot.error) {
      nbGuidance.textContent = "Could not load: " + slot.error;
    } else {
      nbGuidance.textContent = slot.brief.summary || "Guidance unavailable.";
    }
    if (slot.brief.thinking && slot.brief.thinking.length) {
      nbThinking.style.display = "";
      nbThinking.removeAttribute("open");
      nbThinkingBody.innerHTML =
        "<ol>" +
        slot.brief.thinking.map((t) =>
          "<li><strong>" + escapeHtml(t.label) + "</strong> — " + escapeHtml(t.text) + "</li>"
        ).join("") +
        "</ol>";
    } else {
      nbThinking.style.display = "none";
    }

    /* Thread */
    if (slot.loading) {
      threadEl.innerHTML = '<div class="thread-loading">Loading guided questions…</div>';
      return;
    }
    if (slot.error) {
      threadEl.innerHTML = '<div class="thread-empty">' + escapeHtml(slot.error) + "</div>";
      return;
    }
    if (!slot.questions.length) {
      threadEl.innerHTML =
        '<div class="thread-empty">No coaching questions were generated for this node. Move on or revisit later.</div>';
      return;
    }

    /* Find first unanswered */
    let firstUnansweredIdx = slot.questions.findIndex((q) => !q.answer || !q.answer.trim());
    threadEl.innerHTML = slot.questions.map((q, i) => {
      const total = slot.questions.length;
      const isAnswered = q.answer && q.answer.trim();
      const isEditing = state.editingQid === q.id;
      const isCurrent = !isAnswered && i === firstUnansweredIdx;

      let body = '<div class="ai-msg">' +
        '<div class="ai-avatar">S</div>' +
        '<div class="ai-body">' +
          '<div class="ai-label"><span class="q-num">Q' + (i + 1) + " of " + total + "</span></div>" +
          '<div class="ai-text">' + escapeHtml(q.text) + "</div>" +
        "</div></div>";

      if (isAnswered && !isEditing) {
        const t = q.responseType || "assumption";
        body += '<div class="user-resp">' +
          '<div class="ur-head">' +
            '<span class="ur-type ' + t + '">' + escapeHtml(t.charAt(0).toUpperCase() + t.slice(1)) + "</span>" +
          "</div>" +
          '<div class="ur-text">' + escapeHtml(q.answer) + "</div>" +
          '<button type="button" class="ur-edit" data-qid="' + escapeHtml(q.id) + '">Edit response</button>' +
        "</div>";
        if (q.followup) {
          body += '<div class="ai-followup">' + escapeHtml(q.followup) + "</div>";
        }
      } else if (isCurrent || isEditing) {
        const prefill = isEditing ? (q.answer || "") : "";
        const prefillType = isEditing ? (q.responseType || "assumption") : "assumption";
        body += renderComposerHtml(q.id, prefill, prefillType, isEditing);
      }
      /* Future unanswered → just the question, no composer */

      return '<div class="exchange">' + body + "</div>";
    }).join("");

    wireThreadHandlers();
  }

  function renderComposerHtml(qid, prefill, type, isEditing) {
    const types = ["confirmed", "assumption", "hypothesis"];
    return '<div class="composer" data-qid="' + escapeHtml(qid) + '">' +
      '<textarea class="answer-input" placeholder="Type your answer…">' +
        escapeHtml(prefill) +
      "</textarea>" +
      '<div class="composer-bar">' +
        '<select class="resp-type">' +
          types.map((t) =>
            '<option value="' + t + '"' + (t === type ? " selected" : "") + ">" +
            (t.charAt(0).toUpperCase() + t.slice(1)) + "</option>"
          ).join("") +
        "</select>" +
        '<span class="spacer"></span>' +
        '<span class="composer-charcount">' + (prefill.length || 0) + ' chars</span>' +
        (isEditing
          ? '<button type="button" class="btn btn-ghost cancel-edit-btn">Cancel</button>'
          : "") +
        '<button type="button" class="btn btn-primary submit-answer-btn"' +
          (prefill.trim().length >= MIN_ANSWER_CHARS ? "" : " disabled") + ">" +
          (isEditing ? "Save changes" : "Submit answer") +
        "</button>" +
      "</div>" +
    "</div>";
  }

  function wireThreadHandlers() {
    threadEl.querySelectorAll(".composer").forEach((box) => {
      const ta = box.querySelector(".answer-input");
      const cc = box.querySelector(".composer-charcount");
      const submitBtn = box.querySelector(".submit-answer-btn");
      const select = box.querySelector(".resp-type");
      const cancelBtn = box.querySelector(".cancel-edit-btn");

      ta.addEventListener("input", () => {
        const len = ta.value.trim().length;
        cc.textContent = ta.value.length + " chars";
        submitBtn.disabled = len < MIN_ANSWER_CHARS;
      });

      submitBtn.addEventListener("click", () => {
        const qid = box.dataset.qid;
        const text = ta.value.trim();
        const type = select.value;
        if (text.length < MIN_ANSWER_CHARS) return;
        submitAnswer(qid, text, type);
      });

      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          state.editingQid = null;
          renderBuildupBriefAndThread();
        });
      }

      /* Cmd/Ctrl+Enter in this textarea */
      ta.addEventListener("keydown", (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          if (!submitBtn.disabled) submitBtn.click();
        }
      });
    });

    threadEl.querySelectorAll(".ur-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.editingQid = btn.dataset.qid;
        renderBuildupBriefAndThread();
        setTimeout(() => {
          const ta = threadEl.querySelector('.composer[data-qid="' + btn.dataset.qid + '"] .answer-input');
          if (ta) ta.focus();
        }, 0);
      });
    });
  }

  /* ============ Step 3 — answer submit ============ */
  function submitAnswer(qid, text, type) {
    const slot = state.nodeBuilds[state.activeNodeId];
    if (!slot) return;
    const q = slot.questions.find((x) => x.id === qid);
    if (!q) return;

    const wasEdit = !!q.answer;
    q.answer = text;
    q.responseType = type;
    if (!wasEdit) {
      q.followup = "Noted. The next question builds on this position, so keep it in mind as you continue.";
      /* Auto-suggest an action item tied to this question */
      const qIdx = slot.questions.indexOf(q);
      slot.nextActionIdx = (slot.nextActionIdx || slot.actions.length) + 1;
      slot.actions.push({
        id: "a_" + state.activeNodeId + "_auto_" + slot.nextActionIdx,
        title: "Review and validate: " + truncate(text, 70),
        detail: "This was tagged as " + type + ". Confirm with the data or a subject-matter expert before building on it.",
        owner: "", collaborator: "", source: "", artifact: "",
        approval: APPROVAL_OPTIONS[0],
        blockers: "",
        fromQ: qIdx + 1,
      });
    }
    state.editingQid = null;
    pulseSave();
    /* Re-render in dependency order: node status may have changed → tabs + Step 2 list */
    renderBuildupShell();
    renderBuildupBriefAndThread();
    renderActions();
    renderProgressStrip();
    persistState();

    setTimeout(() => {
      const nextComposer = threadEl.querySelector(".composer");
      const target = nextComposer || threadEl.querySelector(".exchange:last-child");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  }

  /* ============ Step 3 — action items ============ */
  function renderActions() {
    const slot = state.nodeBuilds[state.activeNodeId];
    if (!slot) return;
    const acts = slot.actions || [];
    if (!acts.length) {
      actionListEl.innerHTML =
        '<div class="actions-empty">No action items yet. Answer follow-up questions to generate suggested items for your workplan.</div>';
      actionsCountEl.textContent = "no items yet";
      return;
    }
    actionsCountEl.textContent = acts.length + " item" + (acts.length !== 1 ? "s" : "");
    actionListEl.innerHTML = acts.map((a, i) => {
      const letter = ALPHABET[i] || String(i + 1);
      const fromHtml = a.fromQ ? "From Q" + a.fromQ : "Suggested";
      return (
        '<details class="action-item" data-action-id="' + escapeHtml(a.id) + '">' +
        '<summary>' +
          '<span class="ai-num">' + letter + "</span>" +
          '<span class="ai-title">' + escapeHtml(a.title) + "</span>" +
          '<span class="ai-meta">' + escapeHtml(fromHtml) + "</span>" +
          '<span class="chev">›</span>' +
        "</summary>" +
        '<div class="action-body">' +
          renderActionField("wide", "Action", "textarea", "detail", a.detail) +
          renderActionField("", "Owner", "input", "owner", a.owner, "Who owns this?") +
          renderActionField("", "Collaborator", "input", "collaborator", a.collaborator, "Optional") +
          renderActionField("", "Source / system", "input", "source", a.source, "Table or system") +
          renderActionApprovalSelect(a.approval) +
          renderActionField("wide", "Artifact to create", "input", "artifact", a.artifact, "What deliverable comes out of this?") +
          renderActionField("wide", "Blockers", "input", "blockers", a.blockers, "Anything blocking this work?") +
        "</div>" +
        '<div class="action-footer">' +
          '<span class="count">Auto-saved (locally)</span>' +
          '<button type="button" class="btn btn-ghost btn-danger remove-action-btn">Remove item</button>' +
        "</div>" +
        "</details>"
      );
    }).join("");

    /* Accordion: one open at a time */
    actionListEl.querySelectorAll(".action-item").forEach((item) => {
      item.addEventListener("toggle", () => {
        if (item.open) {
          actionListEl.querySelectorAll(".action-item[open]").forEach((other) => {
            if (other !== item) other.removeAttribute("open");
          });
        }
      });
    });

    /* Field changes */
    actionListEl.querySelectorAll("[data-field]").forEach((el) => {
      el.addEventListener("input", onActionFieldChange);
      el.addEventListener("change", onActionFieldChange);
    });

    /* Remove buttons */
    actionListEl.querySelectorAll(".remove-action-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.closest(".action-item");
        const id = item.dataset.actionId;
        slot.actions = slot.actions.filter((a) => a.id !== id);
        pulseSave();
        renderActions();
        persistState();
      });
    });
  }

  function renderActionField(cls, label, kind, field, value, placeholder) {
    const safePh = placeholder ? ' placeholder="' + escapeHtml(placeholder) + '"' : "";
    const safeVal = escapeHtml(value || "");
    if (kind === "textarea") {
      return '<div class="' + cls + '">' +
        '<label class="field-label">' + escapeHtml(label) + "</label>" +
        '<textarea rows="2" data-field="' + field + '"' + safePh + ">" + safeVal + "</textarea>" +
        "</div>";
    }
    return '<div class="' + cls + '">' +
      '<label class="field-label">' + escapeHtml(label) + "</label>" +
      '<input type="text" data-field="' + field + '" value="' + safeVal + '"' + safePh + " />" +
      "</div>";
  }

  function renderActionApprovalSelect(current) {
    return '<div>' +
      '<label class="field-label">Needs approval</label>' +
      '<select data-field="approval">' +
        APPROVAL_OPTIONS.map((opt) =>
          '<option' + (opt === current ? " selected" : "") + ">" + escapeHtml(opt) + "</option>"
        ).join("") +
      "</select>" +
    "</div>";
  }

  function onActionFieldChange(e) {
    const item = e.target.closest(".action-item");
    if (!item) return;
    const slot = state.nodeBuilds[state.activeNodeId];
    if (!slot) return;
    const a = slot.actions.find((x) => x.id === item.dataset.actionId);
    if (!a) return;
    const field = e.target.dataset.field;
    a[field] = e.target.value;
    if (field === "detail") a.title = truncate(e.target.value || "Untitled action", 80);
    pulseSave();
    persistState(); // debounced — handles rapid typing
    /* Don't fully re-render — keep focus + accordion state */
  }

  function addAction() {
    const slot = state.nodeBuilds[state.activeNodeId];
    if (!slot) return;
    slot.nextActionIdx = (slot.nextActionIdx || slot.actions.length) + 1;
    const newAct = {
      id: "a_" + state.activeNodeId + "_manual_" + slot.nextActionIdx,
      title: "New action item",
      detail: "", owner: "", collaborator: "", source: "", artifact: "",
      approval: APPROVAL_OPTIONS[0], blockers: "", fromQ: null,
    };
    slot.actions.push(newAct);
    pulseSave();
    renderActions();
    persistState();
    /* Open the new one */
    setTimeout(() => {
      const item = actionListEl.querySelector('.action-item[data-action-id="' + newAct.id + '"]');
      if (item) {
        item.open = true;
        const ta = item.querySelector('[data-field="detail"]');
        if (ta) ta.focus();
        item.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 0);
  }

  /* ============ Step 3 — sticky bar ============ */
  function renderProgressStrip() {
    const total = state.nodes.length;
    const settled = state.nodes.filter((n) => nodeStatus(n.id) === "settled").length;
    const activeIdx = state.nodes.findIndex((n) => n.id === state.activeNodeId);
    let html = "";
    for (let i = 0; i < total; i++) {
      const st = nodeStatus(state.nodes[i].id);
      const cls = st === "settled" ? "bar on" : i === activeIdx ? "bar now" : "bar";
      html += '<span class="' + cls + '"></span>';
    }
    html += '<span class="progress-counter" id="progress-counter" style="margin-left:8px;">' +
      settled + " of " + total + " settled</span>";
    progressStripEl.innerHTML = html;
  }

  function pulseSave() {
    saveIndicator.innerHTML =
      '<span class="saved-dot" style="background:var(--accent)"></span> Saving…';
    clearTimeout(state._saveTimeout);
    state._saveTimeout = setTimeout(() => {
      saveIndicator.innerHTML = '<span class="saved-dot"></span> Saved just now';
    }, 500);
  }

  /* ============ Step 4 — render ============ */
  function renderSummary() {
    /* Title — the THESIS question itself, not the AI's classification commentary.
       (assessment_title is meta-reasoning about the template choice; it belongs
       in the callout below, not as the page headline.) */
    /* Split the thesis at the first sentence boundary: h1 gets the headline
       statement, the lede gets the supporting context. If the remainder is
       trivially short (or absent), hide the lede so the page breathes. */
    const { lead, trail } = splitThesis(state.problem);
    summaryTitle.textContent = lead ? truncate(lead, 280) : "Problem review";
    const ledeEl = document.getElementById("summary-lede");
    if (trail) {
      ledeEl.textContent = trail;
      ledeEl.hidden = false;
    } else {
      ledeEl.textContent = "";
      ledeEl.hidden = true;
    }
    document.title = "Strenaysis — Review";

    /* "Why this template" callout — show only when the backend provided either
       assessment_title or assessment_recap. */
    const calloutEl = document.getElementById("summary-assessment-callout");
    const calloutTitle = document.getElementById("summary-assessment-title");
    const calloutBody = document.getElementById("summary-assessment-recap");
    const hasTitle = !!state.assessmentTitle;
    const hasRecap = !!state.assessmentRecap;
    calloutEl.hidden = !(hasTitle || hasRecap);
    calloutTitle.textContent = state.assessmentTitle || "";
    calloutTitle.hidden = !hasTitle;
    calloutBody.textContent = state.assessmentRecap || "";
    calloutBody.hidden = !hasRecap;

    /* Status chip */
    const totalNodes = state.nodes.length;
    const settledNodes = state.nodes.filter((n) => nodeStatus(n.id) === "settled").length;
    const isComplete = totalNodes > 0 && settledNodes === totalNodes;
    summaryStatusChip.className = "chip " + (isComplete ? "ok" : "active");
    summaryStatusChip.innerHTML = '<span class="dot"></span> ' +
      (isComplete ? "Complete" : "In progress");

    /* Meta strip */
    metaType.textContent = formatProblemType(state.problemType || state.inferredProblemType);
    metaNodes.textContent = totalNodes
      ? settledNodes + " of " + totalNodes + " settled"
      : "—";
    const totalActions = state.nodes.reduce((acc, n) => {
      const slot = state.nodeBuilds[n.id];
      return acc + (slot && slot.actions ? slot.actions.length : 0);
    }, 0);
    metaActions.textContent = totalActions ? String(totalActions) : "—";
    metaDate.textContent = new Date().toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });

    /* Executive summary */
    execSummaryText.textContent = composeExecutiveSummary(settledNodes, totalNodes, totalActions);

    /* Per-node reports */
    renderNodeReports();

    /* Consolidated workplan */
    renderWorkplan();
  }

  function composeExecutiveSummary(settledNodes, totalNodes, totalActions) {
    /* Note: we deliberately do NOT lead with state.assessmentRecap here —
       it now lives in the "Why this template" callout above. The exec summary
       should be about what the user did, not why the AI picked the template. */
    const pieces = [];

    /* Answer-type counts across all nodes */
    let confirmed = 0, assumption = 0, hypothesis = 0, answered = 0, totalQ = 0;
    Object.values(state.nodeBuilds).forEach((slot) => {
      if (!slot || !slot.questions) return;
      totalQ += slot.questions.length;
      slot.questions.forEach((q) => {
        if (!q.answer || !q.answer.trim()) return;
        answered++;
        const t = (q.responseType || "").toLowerCase();
        if (t === "confirmed") confirmed++;
        else if (t === "hypothesis") hypothesis++;
        else assumption++;
      });
    });

    const statline = [
      settledNodes + " of " + totalNodes + " nodes settled",
      answered + " of " + totalQ + " coaching questions addressed",
      totalActions + " action item" + (totalActions === 1 ? "" : "s") + " in the workplan",
    ];
    pieces.push(statline.join(" · ") + ".");

    if (answered > 0) {
      const tagPieces = [];
      if (confirmed) tagPieces.push(confirmed + " confirmed");
      if (assumption) tagPieces.push(assumption + " assumption" + (assumption === 1 ? "" : "s"));
      if (hypothesis) tagPieces.push(hypothesis + " hypothes" + (hypothesis === 1 ? "is" : "es"));
      pieces.push("Positions taken: " + tagPieces.join(", ") + ".");
    } else {
      pieces.push("No coaching answers have been recorded yet — every node is still open.");
    }

    return pieces.join(" ");
  }

  function composeNodeSummary(node) {
    const slot = state.nodeBuilds[node.id];
    if (!slot || !slot.loaded) {
      return "Node detail has not been loaded yet. Open it in the workspace to generate the coaching breakdown.";
    }
    const total = slot.questions.length;
    const answered = slot.questions.filter((q) => q.answer && q.answer.trim()).length;
    const summary = slot.brief.summary || node.description || "";

    if (total === 0) {
      return summary || "This node was generated but had no coaching questions in the breakdown.";
    }
    if (answered === 0) {
      return (summary ? summary + " " : "") +
        "No coaching questions answered yet — " + total + " open below.";
    }
    let confirmed = 0, assumption = 0, hypothesis = 0;
    slot.questions.forEach((q) => {
      if (!q.answer || !q.answer.trim()) return;
      const t = (q.responseType || "").toLowerCase();
      if (t === "confirmed") confirmed++;
      else if (t === "hypothesis") hypothesis++;
      else assumption++;
    });
    const tagPieces = [];
    if (confirmed) tagPieces.push(confirmed + " confirmed");
    if (assumption) tagPieces.push(assumption + " assumption" + (assumption === 1 ? "" : "s"));
    if (hypothesis) tagPieces.push(hypothesis + " hypothes" + (hypothesis === 1 ? "is" : "es"));
    const tagLine = tagPieces.length ? " (" + tagPieces.join(", ") + ")" : "";
    const intro = summary ? summary + " " : "";
    if (answered === total) {
      return intro + "All " + total + " coaching questions are addressed" + tagLine + ".";
    }
    return intro + answered + " of " + total + " coaching questions answered" + tagLine +
      ". The remaining " + (total - answered) + " are still open.";
  }

  function renderNodeReports() {
    if (!state.nodes.length) {
      nodeReportsEl.innerHTML =
        '<div class="recent-empty">No nodes in this roadmap yet.</div>';
      return;
    }
    nodeReportsEl.innerHTML = state.nodes.map((node, idx) => {
      const slot = state.nodeBuilds[node.id];
      const st = nodeStatus(node.id);
      const chipCls = st === "settled" ? "chip ok" : st === "in-progress" ? "chip warn" : "chip";
      const chipLabel = st === "settled" ? "Settled" : st === "in-progress" ? "In progress" : "Open";
      const narrative = composeNodeSummary(node);
      return (
        '<section class="node-report">' +
          '<div class="nr-header">' +
            '<span class="nr-num">' + pad2(idx + 1) + "</span>" +
            "<h2>" + escapeHtml(node.title) + "</h2>" +
            '<span class="spacer"></span>' +
            '<span class="' + chipCls + '"><span class="dot"></span> ' + chipLabel + "</span>" +
          "</div>" +
          '<p class="nr-summary">' + escapeHtml(narrative) + "</p>" +
          renderQaDisclosure(slot) +
          renderNodeActionsTable(slot) +
        "</section>"
      );
    }).join("");
  }

  function renderQaDisclosure(slot) {
    if (!slot || !slot.loaded || !slot.questions.length) {
      return '<p class="no-actions">No coaching questions recorded for this node.</p>';
    }
    const qs = slot.questions;
    const answered = qs.filter((q) => q.answer && q.answer.trim()).length;
    const summary = answered === qs.length
      ? qs.length + " question" + (qs.length === 1 ? "" : "s") + " answered"
      : answered + " answered, " + (qs.length - answered) + " remaining";
    const rows = qs.map((q) => {
      const isAnswered = q.answer && q.answer.trim();
      let body = '<span class="qa-q-label">Q</span>' +
        '<div class="qa-q-text">' + escapeHtml(q.text) + "</div>";
      body += '<span class="qa-a-label">A</span>';
      if (isAnswered) {
        const t = (q.responseType || "assumption").toLowerCase();
        body += "<div>" +
          '<span class="qa-type ' + t + '">' + (t.charAt(0).toUpperCase() + t.slice(1)) + "</span>" +
          '<div class="qa-a-text">' + escapeHtml(q.answer) + "</div>" +
          "</div>";
        if (q.followup) {
          body += '<span></span>' +
            '<div class="qa-followup">' + escapeHtml(q.followup) + "</div>";
        }
      } else {
        body += '<div class="qa-unanswered">Not yet answered</div>';
      }
      return '<div class="qa-exchange">' + body + "</div>";
    }).join("");
    return '<details class="qa-disclosure">' +
      '<summary><span class="chev">›</span> ' + summary + "</summary>" +
      '<div class="qa-thread">' + rows + "</div>" +
    "</details>";
  }

  function renderNodeActionsTable(slot) {
    if (!slot || !slot.loaded || !slot.actions.length) {
      return '<p class="no-actions">No action items for this node.</p>';
    }
    const rows = slot.actions.map((a, i) => {
      const letter = ALPHABET[i] || String(i + 1);
      const ownerHtml = a.owner
        ? '<td class="at-owner">' + escapeHtml(a.owner) + "</td>"
        : '<td class="at-owner unassigned">Unassigned</td>';
      return "<tr>" +
        '<td class="at-num">' + letter + "</td>" +
        '<td class="at-action">' + escapeHtml(a.detail || a.title) + "</td>" +
        ownerHtml +
        '<td class="at-approval">' + escapeHtml(a.approval || "—") + "</td>" +
      "</tr>";
    }).join("");
    return '<table class="actions-table">' +
      "<thead><tr><th></th><th>Action item</th><th>Owner</th><th>Approval</th></tr></thead>" +
      "<tbody>" + rows + "</tbody>" +
    "</table>";
  }

  function renderWorkplan() {
    const rows = [];
    let num = 1;
    state.nodes.forEach((node) => {
      const slot = state.nodeBuilds[node.id];
      if (!slot || !slot.actions) return;
      slot.actions.forEach((a) => {
        const ownerHtml = a.owner
          ? '<td class="wp-owner">' + escapeHtml(a.owner) + "</td>"
          : '<td class="wp-owner unassigned">Unassigned</td>';
        rows.push("<tr>" +
          '<td class="wp-num">' + num + "</td>" +
          '<td class="wp-node">' + escapeHtml(truncate(node.title, 18)) + "</td>" +
          "<td>" + escapeHtml(a.detail || a.title) + "</td>" +
          ownerHtml +
          '<td class="wp-approval">' + escapeHtml(a.approval || "—") + "</td>" +
        "</tr>");
        num++;
      });
    });
    if (!rows.length) {
      workplanTbody.innerHTML =
        '<tr><td colspan="5" class="no-actions" style="padding: var(--s-4) 0;">' +
        "No action items across nodes yet. Answer coaching questions in Step 3 to generate suggestions." +
        "</td></tr>";
    } else {
      workplanTbody.innerHTML = rows.join("");
    }
  }

  /* ============ Step 4 — serialize for backend ============ */
  function serializeForBackend() {
    const today = new Date();
    const isoDate = today.getFullYear() + "-" +
      pad2(today.getMonth() + 1) + "-" + pad2(today.getDate());

    const nodes = state.nodes.map((node, i) => {
      const slot = state.nodeBuilds[node.id] || {};
      const st = nodeStatus(node.id);
      const actions = (slot.actions || []).map((a) => ({
        action: a.detail || a.title,
        owner: a.owner || "",
        collaborator: a.collaborator || "",
        source: a.source || "",
        artifact: a.artifact || "",
        approval: a.approval || "",
        blockers: a.blockers || "",
      }));
      const workstreams = (slot.brief && slot.brief.thinking || []).map((t) => ({
        name: t.label || "",
        purpose: t.text || "",
      }));
      return {
        position: i + 1,
        title: node.title,
        why: node.description || "",
        breakdown: node.breakdown || "",
        is_custom: !!node.isCustom,
        status: st,
        questions: (slot.questions || []).map((q) => ({
          text: q.text,
          answer: q.answer || "",
          response_type: q.responseType || "",
          followup: q.followup || "",
        })),
        build: {
          execution_summary: (slot.brief && slot.brief.summary) || "",
          workstreams,
          execution_items: actions,
        },
        /* Backend uses this magic-string match (see server.py:283) to count
           ready_count in the recent list. */
        suggested_context: st === "settled" ? "no additional suggested item" : "",
      };
    });

    return {
      problem: state.problem,
      problem_details: state.problemDetails,
      problem_type: state.problemType,
      assessment_title: state.assessmentTitle,
      assessment_recap: state.assessmentRecap,
      saved_date: isoDate,
      priority: "Medium",
      /* problem_name is a short label used in the file name + recent-list
         display. Derive it from the THESIS (state.problem), not the AI's
         classification commentary (state.assessmentTitle) — that's the same
         mistake the Step 4 H1 made. */
      problem_name: truncate(state.problem || "Problem", 60),
      nodes,
    };
  }

  function showSaveToast(msg, isError) {
    if (!saveToast) return;
    saveToast.textContent = msg;
    saveToast.classList.toggle("is-error", !!isError);
    saveToast.classList.add("is-visible");
    clearTimeout(state._saveToastTimer);
    state._saveToastTimer = setTimeout(() => {
      saveToast.classList.remove("is-visible");
    }, 2500);
  }

  async function saveToHistory() {
    if (!state.problem) {
      showSaveToast("Nothing to save yet — no problem in state.", true);
      return;
    }
    const payload = serializeForBackend();
    saveHistoryBtn.disabled = true;
    const originalText = saveHistoryBtn.textContent;
    saveHistoryBtn.textContent = "Saving…";
    try {
      const response = await fetch("/api/save-problem-framing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Save failed (" + response.status + ").");
      showSaveToast("Saved to history.");
      /* Refresh Step 1's recent list so it's fresh next visit */
      loadRecent();
    } catch (err) {
      showSaveToast(err.message || "Save failed.", true);
    } finally {
      saveHistoryBtn.disabled = false;
      saveHistoryBtn.textContent = originalText;
    }
  }

  async function exportFile(format) {
    if (!state.problem) {
      showSaveToast("Nothing to export yet.", true);
      return;
    }
    const btn = format === "docx" ? exportDocxBtn : exportPptxBtn;
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Building…";
    try {
      const payload = Object.assign({ format }, serializeForBackend());
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let msg = "Export failed (" + response.status + ").";
        try { const j = await response.json(); if (j.error) msg = j.error; } catch (_) {}
        throw new Error(msg);
      }
      const blob = await response.blob();
      const filename = "strenaysis-workflow." + format;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showSaveToast("Downloaded ." + format + ".");
    } catch (err) {
      showSaveToast(err.message || "Export failed.", true);
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  }

  function startNewProblem() {
    const hasWork = !!state.problem ||
      !!Object.keys(state.nodeBuilds).length;
    if (hasWork && !window.confirm("Start a new problem? Your current in-memory work will be cleared (saved framings are unaffected).")) {
      return;
    }
    state.problem = "";
    state.problemDetails = "";
    state.problemType = "";
    state.inferredProblemType = "";
    state.assessmentTitle = "";
    state.assessmentRecap = "";
    state.nodes = [];
    state.nodeBuilds = {};
    state.activeNodeId = null;
    state.editingQid = null;
    if (problemInput) problemInput.value = "";
    if (problemDetailsInput) problemDetailsInput.value = "";
    if (contextDetails) contextDetails.open = false;
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    clearPersistedState();
    updateComposer();
    showView("home");
  }

  /* ============ Init ============ */
  function resolveDOM() {
    problemInput = document.getElementById("problem-input");
    problemDetailsInput = document.getElementById("problem-details-input");
    contextDetails = document.getElementById("context-details");
    charCounter = document.getElementById("char-counter");
    structureBtn = document.getElementById("structure-problem-btn");
    saveDraftBtn = document.getElementById("save-draft-btn");
    recentCount = document.getElementById("recent-count");
    recentList = document.getElementById("recent-list");
    sideRecentNav = document.getElementById("side-recent-nav");
    sideHistoryCount = document.getElementById("side-history-count");

    sideStep1 = document.getElementById("side-step1");
    sideCurrentProblem = document.getElementById("side-current-problem");
    cpSteps = Array.from(sideCurrentProblem.querySelectorAll(".side-step"));

    homeView = document.getElementById("view-home");
    roadmapView = document.getElementById("view-roadmap");
    buildupView = document.getElementById("view-buildup");
    summaryView = document.getElementById("view-summary");

    roadmapTitle = document.getElementById("roadmap-title");
    roadmapQuestion = document.getElementById("roadmap-question");
    roadmapTypeChip = document.getElementById("roadmap-type-chip");
    assessmentWhy = document.getElementById("assessment-why");
    problemTypes = document.getElementById("problem-types");
    updatePathBtn = document.getElementById("update-path-btn");
    nodeListEl = document.getElementById("node-list");
    addNodeTrigger = document.getElementById("add-node-trigger");
    addNodeForm = document.getElementById("add-node-form");
    newNodeName = document.getElementById("new-node-name");
    newNodeDesc = document.getElementById("new-node-desc");
    saveNodeBtn = document.getElementById("save-node-btn");
    cancelNodeBtn = document.getElementById("cancel-node-btn");
    settledCountEl = document.getElementById("settled-count");
    backToHomeBtn = document.getElementById("back-to-home-btn");
    toWorkspaceBtn = document.getElementById("to-workspace-btn");

    crumbNode = document.getElementById("crumb-node");
    buildupTitle = document.getElementById("buildup-title");
    nodeTabsEl = document.getElementById("node-tabs");
    nbDesc = document.getElementById("nb-desc");
    nbGuidance = document.getElementById("nb-guidance");
    nbThinking = document.getElementById("nb-thinking");
    nbThinkingBody = document.getElementById("nb-thinking-body");
    threadEl = document.getElementById("buildup-thread");
    actionsCountEl = document.getElementById("actions-count");
    actionListEl = document.getElementById("action-list");
    addActionBtn = document.getElementById("add-action-btn");
    saveIndicator = document.getElementById("save-indicator");
    progressStripEl = document.getElementById("progress-strip");
    progressCounter = document.getElementById("progress-counter");
    backToRoadmapBtn = document.getElementById("back-to-roadmap-btn");
    toSummaryBtn = document.getElementById("to-summary-btn");

    summaryStatusChip = document.getElementById("summary-status-chip");
    summaryTitle = document.getElementById("summary-title");
    metaType = document.getElementById("meta-type");
    metaNodes = document.getElementById("meta-nodes");
    metaActions = document.getElementById("meta-actions");
    metaDate = document.getElementById("meta-date");
    execSummaryText = document.getElementById("exec-summary-text");
    nodeReportsEl = document.getElementById("node-reports");
    workplanSectionEl = document.getElementById("workplan-section");
    workplanTbody = document.getElementById("workplan-tbody");
    exportDocxBtn = document.getElementById("export-docx-btn");
    exportPptxBtn = document.getElementById("export-pptx-btn");
    backToBuildupBtn = document.getElementById("back-to-buildup-btn");
    startNewBtn = document.getElementById("start-new-btn");
    saveHistoryBtn = document.getElementById("save-history-btn");
    saveToast = document.getElementById("save-toast");
  }

  function wire() {
    /* Step 1 */
    problemInput.addEventListener("input", updateComposer);
    structureBtn.addEventListener("click", submitProblem);
    saveDraftBtn.addEventListener("click", saveDraft);

    /* Step 2 */
    roadmapQuestion.addEventListener("input", () => { state.problem = roadmapQuestion.value; });
    problemTypes.addEventListener("change", onProblemTypeChange);
    updatePathBtn.addEventListener("click", triggerUpdatePath);
    wireDragAndDrop();
    addNodeTrigger.addEventListener("click", openAddNodeForm);
    cancelNodeBtn.addEventListener("click", closeAddNodeForm);
    newNodeName.addEventListener("input", checkNodeForm);
    newNodeDesc.addEventListener("input", checkNodeForm);
    saveNodeBtn.addEventListener("click", saveCustomNode);
    backToHomeBtn.addEventListener("click", () => showView("home"));
    toWorkspaceBtn.addEventListener("click", () => {
      const first = state.nodes[0];
      if (first) openNodeInBuildup(first.id);
    });

    /* Step 3 */
    backToRoadmapBtn.addEventListener("click", () => {
      renderNodeList(); renderRoadmap();
      showView("roadmap");
    });
    toSummaryBtn.addEventListener("click", () => {
      renderSummary();
      showView("summary");
    });
    addActionBtn.addEventListener("click", addAction);

    /* Step 4 */
    backToBuildupBtn.addEventListener("click", () => {
      if (state.activeNodeId) openNodeInBuildup(state.activeNodeId);
      else showView("roadmap");
    });
    startNewBtn.addEventListener("click", startNewProblem);
    saveHistoryBtn.addEventListener("click", saveToHistory);
    exportDocxBtn.addEventListener("click", () => exportFile("docx"));
    exportPptxBtn.addEventListener("click", () => exportFile("pptx"));

    /* Sidebar nav */
    document.querySelectorAll('[data-nav="home"]').forEach((el) => {
      el.addEventListener("click", (e) => { e.preventDefault(); showView("home"); });
    });
    cpSteps.forEach((el) => {
      el.addEventListener("click", (e) => {
        if (el.classList.contains("is-disabled")) { e.preventDefault(); return; }
        e.preventDefault();
        const step = Number(el.dataset.step);
        if (step === 1) showView("home");
        else if (step === 2) showView("roadmap");
        else if (step === 3) {
          if (state.activeNodeId) openNodeInBuildup(state.activeNodeId);
          else if (state.nodes[0]) openNodeInBuildup(state.nodes[0].id);
        } else if (step === 4) {
          renderSummary(); showView("summary");
        }
      });
    });

    /* Global keyboard */
    document.addEventListener("keydown", (e) => {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key === "Enter") {
        if (state.view === "home") { e.preventDefault(); submitProblem(); }
        else if (state.view === "roadmap" && addNodeForm.classList.contains("open") && !saveNodeBtn.disabled) {
          e.preventDefault(); saveCustomNode();
        } else if (state.view === "roadmap") {
          e.preventDefault(); toWorkspaceBtn.click();
        }
        /* Cmd+Enter inside Step 3 textareas is handled per-composer */
      }
      if (e.key === "Escape" && addNodeForm.classList.contains("open")) {
        closeAddNodeForm();
      }
      /* Cmd/Ctrl+S in summary view triggers Save to history */
      if (cmd && (e.key === "s" || e.key === "S") && state.view === "summary") {
        e.preventDefault();
        saveToHistory();
      }
    });
  }

  function init() {
    resolveDOM();
    wire();
    restoreDraft();
    updateComposer();
    loadRecent();

    /* Try to restore a full in-progress state. If nothing was saved (or it's
       corrupt / first visit), fall back to the home view. */
    const restoredView = restoreState();
    if (restoredView === "roadmap") {
      renderRoadmap();
      showView("roadmap");
    } else if (restoredView === "buildup") {
      const node = state.nodes.find((n) => n.id === state.activeNodeId)
        || state.nodes[0];
      if (node) {
        state.activeNodeId = node.id;
        renderBuildupShell();
        renderBuildupBriefAndThread();
        renderActions();
        renderProgressStrip();
        showView("buildup");
      } else {
        showView("home");
      }
    } else if (restoredView === "summary") {
      renderSummary();
      showView("summary");
    } else {
      showView("home");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
