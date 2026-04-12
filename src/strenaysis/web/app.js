const state = {
  problem: "",
  problemDetails: "",
  problemTypeKey: "",
  inferredProblemTypeKey: "",
  problemType: "",
  assessmentTitle: "",
  assessmentRecap: "",
  roadmap: [],
  notes: {},
  currentIndex: 0,
  nextNodeId: 1,
  polishedDraft: null,
  sequenceEditMode: false,
  dragNodeId: null,
  activeNodeId: null,
};

const panels = {
  problem: document.getElementById("step-problem"),
  roadmap: document.getElementById("step-roadmap"),
  details: document.getElementById("step-details"),
  summary: document.getElementById("step-summary"),
};

const problemInput = document.getElementById("problem-input");
const problemDetailsInput = document.getElementById("problem-details-input");
const problemDetailsPreview = document.getElementById("problem-details-preview");
const openProblemDetailsButton = document.getElementById("open-problem-details");
const startRoadmapButton = document.getElementById("start-roadmap");
const roadmapList = document.getElementById("roadmap-list");
const confirmRoadmapButton = document.getElementById("confirm-roadmap");
const editSequenceButton = document.getElementById("edit-sequence");
const saveSequenceButton = document.getElementById("save-sequence");
const deleteSequenceZone = document.getElementById("delete-sequence-zone");
const roadmapSource = document.getElementById("roadmap-source");
const roadmapProblemInput = document.getElementById("roadmap-problem-input");
const roadmapProblemDetailsInput = document.getElementById("roadmap-problem-details-input");
const roadmapProblemDetailsPreview = document.getElementById("roadmap-problem-details-preview");
const openRoadmapProblemDetailsButton = document.getElementById("open-roadmap-problem-details");
const refreshQuestionButton = document.getElementById("refresh-question");
const assessmentType = document.getElementById("assessment-type");
const updateRoadbuildButton = document.getElementById("update-roadbuild");
const assessmentTitle = document.getElementById("assessment-title");
const assessmentRecap = document.getElementById("assessment-recap");
const assessmentHighPriority = document.getElementById("assessment-high-priority");
const assessmentMediumPriority = document.getElementById("assessment-medium-priority");
const assessmentLowPriority = document.getElementById("assessment-low-priority");
const newNodeDraft = document.getElementById("new-node-draft");
const polishNodeButton = document.getElementById("polish-node");
const confirmAddNodeButton = document.getElementById("confirm-add-node");
const newNodePreview = document.getElementById("new-node-preview");
const newNodeTitleInput = document.getElementById("new-node-title-input");
const newNodeWhyInput = document.getElementById("new-node-why-input");
const newNodeBreakdownInput = document.getElementById("new-node-breakdown-input");
const newNodeContextInput = document.getElementById("new-node-context-input");
const detailTitle = document.getElementById("detail-title");
const detailSubtitle = document.getElementById("detail-subtitle");
const detailProgress = document.getElementById("detail-progress");
const detailNotes = document.getElementById("detail-notes");
const prevNodeButton = document.getElementById("prev-node");
const nextNodeButton = document.getElementById("next-node");
const summaryContent = document.getElementById("summary-content");
const restartFlowButton = document.getElementById("restart-flow");
const nodeTemplate = document.getElementById("roadmap-node-template");
const detailsModal = document.getElementById("details-modal");
const detailsModalBackdrop = document.getElementById("details-modal-backdrop");
const closeDetailsModalButton = document.getElementById("close-details-modal");
const saveDetailsModalButton = document.getElementById("save-details-modal");
const detailsModalInput = document.getElementById("details-modal-input");
const nodeModal = document.getElementById("node-modal");
const nodeModalBackdrop = document.getElementById("node-modal-backdrop");
const closeNodeModalButton = document.getElementById("close-node-modal");
const saveNodeModalButton = document.getElementById("save-node-modal");
const nodeModalName = document.getElementById("node-modal-name");
const nodeModalWhy = document.getElementById("node-modal-why");
const nodeModalBreakdown = document.getElementById("node-modal-breakdown");
const nodeModalContext = document.getElementById("node-modal-context");
const sidebarNavItems = Array.from(document.querySelectorAll(".nav-item"));
const NO_ADDITIONAL_SUGGESTED_ITEM = "No Additional Suggested Item";

let detailsModalTarget = "problem";

startRoadmapButton.addEventListener("click", async () => {
  const problem = problemInput.value.trim();
  const problemDetails = problemDetailsInput.value.trim();
  if (!problem) {
    window.alert("Please add a problem to solve first.");
    return;
  }

  await generateRoadmap(problem, {
    problemDetails,
    problemType: state.problemTypeKey,
    button: startRoadmapButton,
    loadingText: "Building...",
    idleText: "Start to Build the Structure",
    resetNotes: true,
    showRoadmap: true,
  });
});

refreshQuestionButton.addEventListener("click", async () => {
  const problem = roadmapProblemInput.value.trim();
  const problemDetails = roadmapProblemDetailsInput.value.trim();
  if (!problem) {
    window.alert("Please keep a problem statement before refreshing the glossary.");
    return;
  }

  await generateRoadmap(problem, {
    problemDetails,
    problemType: assessmentType.value,
    button: refreshQuestionButton,
    loadingText: "Refreshing...",
    idleText: "Refresh Question",
    resetNotes: false,
    showRoadmap: false,
  });
});

updateRoadbuildButton.addEventListener("click", async () => {
  const problem = roadmapProblemInput.value.trim();
  if (!problem) {
    return;
  }
  await generateRoadmap(problem, {
    problemDetails: roadmapProblemDetailsInput.value.trim(),
    problemType: assessmentType.value,
    button: updateRoadbuildButton,
    loadingText: "Updating...",
    idleText: "Update Roadbuild",
    resetNotes: false,
    showRoadmap: false,
  });
});

editSequenceButton.addEventListener("click", () => {
  state.sequenceEditMode = true;
  renderRoadmapEditor();
});

saveSequenceButton.addEventListener("click", () => {
  state.sequenceEditMode = false;
  renderRoadmapEditor();
});

deleteSequenceZone.addEventListener("dragover", (event) => {
  if (!state.sequenceEditMode || !state.dragNodeId) {
    return;
  }
  event.preventDefault();
  deleteSequenceZone.classList.add("is-active");
});

deleteSequenceZone.addEventListener("dragleave", () => {
  deleteSequenceZone.classList.remove("is-active");
});

deleteSequenceZone.addEventListener("drop", (event) => {
  if (!state.sequenceEditMode) {
    return;
  }
  event.preventDefault();
  deleteSequenceZone.classList.remove("is-active");
  if (!state.dragNodeId) {
    return;
  }
  state.roadmap = state.roadmap.filter((node) => node.id !== state.dragNodeId);
  state.dragNodeId = null;
  renderRoadmapEditor();
});

openProblemDetailsButton.addEventListener("click", () => {
  openDetailsModal("problem");
});

openRoadmapProblemDetailsButton.addEventListener("click", () => {
  openDetailsModal("roadmap");
});

closeDetailsModalButton.addEventListener("click", closeDetailsModal);
detailsModalBackdrop.addEventListener("click", closeDetailsModal);
saveDetailsModalButton.addEventListener("click", () => {
  const value = detailsModalInput.value.trim();
  setProblemDetails(value);
  closeDetailsModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !detailsModal.hidden) {
    closeDetailsModal();
  }
  if (event.key === "Escape" && !nodeModal.hidden) {
    closeNodeModal();
  }
});
closeNodeModalButton.addEventListener("click", closeNodeModal);
nodeModalBackdrop.addEventListener("click", closeNodeModal);
saveNodeModalButton.addEventListener("click", saveNodeModal);

confirmRoadmapButton.addEventListener("click", () => {
  const cleaned = state.roadmap
    .map((node) => ({
      id: node.id ?? makeNodeId(),
      title: node.title.trim(),
      why: node.why.trim(),
      breakdown: node.breakdown.trim(),
      suggested_context: node.suggested_context.trim(),
    }))
    .filter((node) => node.title && node.why && node.breakdown && node.suggested_context);

  if (!cleaned.length) {
    window.alert("Please keep at least one roadmap node with a title, explanation, breakdown, and suggested context.");
    return;
  }

  const updatedProblem = roadmapProblemInput.value.trim();
  const updatedProblemDetails = roadmapProblemDetailsInput.value.trim();
  if (!updatedProblem) {
    window.alert("Please keep a problem statement on the glossary page.");
    return;
  }

  state.problem = updatedProblem;
  state.problemDetails = updatedProblemDetails;
  problemInput.value = updatedProblem;
  problemDetailsInput.value = updatedProblemDetails;
  updateProblemDetailsPreviews();
  state.roadmap = cleaned;
  state.currentIndex = 0;
  for (const key of Object.keys(state.notes)) {
    if (!state.roadmap.some((node) => node.id === key)) {
      delete state.notes[key];
    }
  }
  loadDetailStep();
  showPanel("details");
});

polishNodeButton.addEventListener("click", async () => {
  const draft = buildPolishDraft();
  if (!draft) {
    window.alert("Please describe what the new roadmap step should cover.");
    return;
  }

  polishNodeButton.disabled = true;
  polishNodeButton.textContent = "Polishing...";
  try {
    const response = await fetch("/api/polish-node", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem: state.problem, problem_details: state.problemDetails, draft }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to polish this node.");
    }
    state.polishedDraft = {
      id: state.polishedDraft?.id || makeNodeId(),
      title: payload.title.trim(),
      why: payload.why.trim(),
      breakdown: payload.breakdown.trim(),
      suggested_context: payload.suggested_context.trim(),
    };
    newNodeTitleInput.value = state.polishedDraft.title;
    newNodeWhyInput.value = state.polishedDraft.why;
    newNodeBreakdownInput.value = state.polishedDraft.breakdown;
    newNodeContextInput.value = state.polishedDraft.suggested_context;
    newNodePreview.hidden = false;
    confirmAddNodeButton.disabled = false;
    autoResizeAll();
  } catch (error) {
    window.alert(error.message);
  } finally {
    polishNodeButton.disabled = false;
    polishNodeButton.textContent = "Polish";
  }
});

confirmAddNodeButton.addEventListener("click", () => {
  if (!state.polishedDraft) {
    return;
  }
  const cleaned = readCustomNodeDraft();
  if (!cleaned) {
    window.alert("Please keep the custom node title, explanation, breakdown, and suggested context filled in before adding it.");
    return;
  }
  state.polishedDraft = { ...state.polishedDraft, ...cleaned };
  state.roadmap.push(state.polishedDraft);
  renderRoadmapEditor();
  resetNewNodeDraft();
  autoResizeAll();
});

prevNodeButton.addEventListener("click", () => {
  saveCurrentNote();
  if (state.currentIndex > 0) {
    state.currentIndex -= 1;
    loadDetailStep();
  } else {
    showPanel("roadmap");
  }
});

nextNodeButton.addEventListener("click", () => {
  saveCurrentNote();
  if (state.currentIndex < state.roadmap.length - 1) {
    state.currentIndex += 1;
    loadDetailStep();
  } else {
    renderSummary();
    showPanel("summary");
  }
});

restartFlowButton.addEventListener("click", () => {
  state.problem = "";
  state.problemDetails = "";
  state.problemTypeKey = "";
  state.inferredProblemTypeKey = "";
  state.problemType = "";
  state.assessmentTitle = "";
  state.assessmentRecap = "";
  state.roadmap = [];
  state.notes = {};
  state.currentIndex = 0;
  state.nextNodeId = 1;
  state.sequenceEditMode = false;
  state.dragNodeId = null;
  state.activeNodeId = null;
  problemInput.value = "";
  problemDetailsInput.value = "";
  roadmapProblemInput.value = "";
  roadmapProblemDetailsInput.value = "";
  roadmapList.innerHTML = "";
  summaryContent.innerHTML = "";
  updateAssessmentFields();
  updateProblemDetailsPreviews();
  resetNewNodeDraft();
  refreshRoadmapCompletionState();
  updateAssessmentPrioritySummary();
  showPanel("problem");
});

function renderRoadmapEditor() {
  roadmapList.innerHTML = "";
  editSequenceButton.hidden = state.roadmap.length === 0 || state.sequenceEditMode;
  saveSequenceButton.hidden = !state.sequenceEditMode;
  deleteSequenceZone.hidden = !state.sequenceEditMode;
  deleteSequenceZone.classList.remove("is-active");
  state.roadmap.forEach((node, index) => {
    const fragment = nodeTemplate.content.cloneNode(true);
    const row = fragment.querySelector(".roadmap-node");
    const shell = fragment.querySelector(".roadmap-node-shell");
    const order = fragment.querySelector(".node-order");
    const titleText = fragment.querySelector(".node-title-text");
    const stateChip = fragment.querySelector(".node-state-chip");
    const openNode = fragment.querySelector(".open-node");
    const position = getRoadmapPosition(index);
    const connector = getRoadmapConnector(index, state.roadmap.length);

    const isComplete = isNoAdditionalSuggestedItem(node.suggested_context || "");
    row.classList.toggle("is-draggable", state.sequenceEditMode);
    row.draggable = state.sequenceEditMode;
    row.dataset.nodeId = node.id;
    row.style.gridColumnStart = String(position.column);
    row.style.gridRowStart = String(position.row);
    row.classList.toggle("connector-right", connector === "right");
    row.classList.toggle("connector-left", connector === "left");
    row.classList.toggle("connector-down", connector === "down");
    shell.classList.toggle("is-complete", isComplete);
    shell.classList.toggle("needs-attention", !isComplete);
    order.textContent = `${index + 1}`;
    titleText.textContent = node.title;
    stateChip.textContent = isComplete ? "Ready" : "Needs Context";
    stateChip.classList.toggle("is-complete", isComplete);
    stateChip.classList.toggle("needs-attention", !isComplete);
    openNode.textContent = state.sequenceEditMode ? "Reorder" : "Details";
    openNode.disabled = state.sequenceEditMode;
    openNode.addEventListener("click", () => openNodeModal(node.id));
    shell.addEventListener("click", (event) => {
      if (state.sequenceEditMode || event.target.closest(".open-node")) {
        return;
      }
      openNodeModal(node.id);
    });
    row.addEventListener("dragstart", (event) => {
      if (!state.sequenceEditMode) {
        return;
      }
      state.dragNodeId = node.id;
      row.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", node.id);
    });
    row.addEventListener("dragend", () => {
      state.dragNodeId = null;
      row.classList.remove("is-dragging");
      roadmapList.querySelectorAll(".roadmap-node").forEach((item) => item.classList.remove("drag-target"));
      deleteSequenceZone.classList.remove("is-active");
    });
    row.addEventListener("dragover", (event) => {
      if (!state.sequenceEditMode || state.dragNodeId === node.id) {
        return;
      }
      event.preventDefault();
      row.classList.add("drag-target");
    });
    row.addEventListener("dragleave", () => {
      row.classList.remove("drag-target");
    });
    row.addEventListener("drop", (event) => {
      if (!state.sequenceEditMode) {
        return;
      }
      event.preventDefault();
      row.classList.remove("drag-target");
      const fromId = state.dragNodeId || event.dataTransfer.getData("text/plain");
      reorderNodeById(fromId, node.id);
    });

    roadmapList.appendChild(row);
  });
  refreshRoadmapCompletionState();
  updateAssessmentPrioritySummary();
}

function getRoadmapPosition(index) {
  const row = Math.floor(index / 3) + 1;
  const offset = index % 3;
  const column = row % 2 === 1 ? offset + 1 : 3 - offset;
  return { row, column };
}

function getRoadmapConnector(index, total) {
  const nextIndex = index + 1;
  if (nextIndex >= total) {
    return "none";
  }
  const current = getRoadmapPosition(index);
  const next = getRoadmapPosition(nextIndex);
  if (current.row === next.row) {
    return next.column > current.column ? "right" : "left";
  }
  return "down";
}

function moveNode(from, to) {
  if (to < 0 || to >= state.roadmap.length) {
    return;
  }
  const [item] = state.roadmap.splice(from, 1);
  state.roadmap.splice(to, 0, item);
  renderRoadmapEditor();
}

function reorderNodeById(fromId, toId) {
  if (!fromId || !toId || fromId === toId) {
    return;
  }
  const fromIndex = state.roadmap.findIndex((node) => node.id === fromId);
  const toIndex = state.roadmap.findIndex((node) => node.id === toId);
  if (fromIndex === -1 || toIndex === -1) {
    return;
  }
  const [item] = state.roadmap.splice(fromIndex, 1);
  state.roadmap.splice(toIndex, 0, item);
  renderRoadmapEditor();
}

function loadDetailStep() {
  const currentNode = state.roadmap[state.currentIndex];
  detailTitle.textContent = currentNode.title;
  detailSubtitle.textContent = `${currentNode.why} ${currentNode.breakdown} Capture the details you want the agentic workflow to build for the ${currentNode.title.toLowerCase()} stage.`;
  detailProgress.textContent = `${state.currentIndex + 1} of ${state.roadmap.length}`;
  detailNotes.placeholder = `Add the guiding questions, expectations, or notes for ${currentNode.title}.`;
  detailNotes.value = state.notes[currentNode.id] || "";
  nextNodeButton.textContent =
    state.currentIndex === state.roadmap.length - 1 ? "Finish Workflow" : "Save and Continue";
}

function saveCurrentNote() {
  const currentNode = state.roadmap[state.currentIndex];
  if (!currentNode) {
    return;
  }
  state.notes[currentNode.id] = detailNotes.value.trim();
}

function renderSummary() {
  summaryContent.innerHTML = "";

  const intro = document.createElement("article");
  intro.className = "summary-card";
  intro.innerHTML = `
    <h3>Problem to Solve</h3>
    <p>${escapeHtml(state.problem)}</p>
    <p>${escapeHtml(state.problemDetails || "No detailed bucket added yet.")}</p>
    <p>${escapeHtml(state.problemType || "Problem type not set yet.")}</p>
    <p>${escapeHtml(state.assessmentTitle || "No assessment added yet.")}</p>
    <p>${escapeHtml(state.assessmentRecap || "No recap added yet.")}</p>
  `;
  summaryContent.appendChild(intro);

  state.roadmap.forEach((node) => {
    const card = document.createElement("article");
    card.className = "summary-card";
    card.innerHTML = `
      <h3>${escapeHtml(node.title)}</h3>
      <p>${escapeHtml(node.why)}</p>
      <p>${escapeHtml(node.breakdown)}</p>
      <p>${escapeHtml(node.suggested_context || "No suggested context added yet.")}</p>
      <p>${escapeHtml(state.notes[node.id] || "No notes added yet.")}</p>
    `;
    summaryContent.appendChild(card);
  });
}

function showPanel(name) {
  Object.entries(panels).forEach(([key, panel]) => {
    panel.classList.toggle("active", key === name);
  });
  const activeNav = name === "details" ? "actions" : name === "summary" ? "review" : "problems";
  sidebarNavItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.nav === activeNav);
  });
  requestAnimationFrame(() => {
    autoResizeAll();
    updateAssessmentFields();
  });
}

async function generateRoadmap(problem, options) {
  state.problem = problem;
  state.problemDetails = options.problemDetails || "";
  if (options.button) {
    options.button.disabled = true;
    options.button.textContent = options.loadingText;
  }
  if (options.button !== updateRoadbuildButton) {
    updateRoadbuildButton.disabled = true;
  }

  try {
    const response = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem,
        problem_details: state.problemDetails,
        problem_type: options.problemType || "",
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to generate roadmap.");
    }

    state.roadmap = normalizeRoadmap(payload.roadmap);
    state.sequenceEditMode = false;
    state.dragNodeId = null;
    state.activeNodeId = null;
    state.problemTypeKey = String(payload.problem_type || options.problemType || "").trim();
    state.inferredProblemTypeKey = String(payload.inferred_problem_type || "").trim();
    state.problemType = normalizeProblemType(payload.problem_type);
    state.assessmentTitle = String(payload.assessment_title || "").trim();
    state.assessmentRecap = String(payload.assessment_recap || "").trim();
    if (options.resetNotes) {
      state.notes = {};
    }
    state.nextNodeId = state.roadmap.length + 1;
    problemInput.value = problem;
    problemDetailsInput.value = state.problemDetails;
    roadmapProblemInput.value = problem;
    roadmapProblemDetailsInput.value = state.problemDetails;
    updateAssessmentFields();
    updateProblemDetailsPreviews();
    resetNewNodeDraft();
    renderRoadmapEditor();
    roadmapSource.textContent =
      payload.source === "openai" ? "OpenAI generated" : "Template generated";
    if (options.showRoadmap) {
      showPanel("roadmap");
    } else {
      autoResizeAll();
    }
  } catch (error) {
    window.alert(error.message);
  } finally {
    if (options.button) {
      options.button.disabled = false;
      options.button.textContent = options.idleText;
    }
    if (options.button !== updateRoadbuildButton) {
      updateRoadbuildButton.disabled = false;
    }
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeRoadmap(rawRoadmap) {
  return (rawRoadmap || [])
    .map((item) => {
      if (typeof item === "string") {
        const title = item.trim();
        return {
          id: makeNodeId(),
          title,
          why: `Explains why ${title.toLowerCase()} matters in the workflow.`,
          breakdown: `Outlines what ${title.toLowerCase()} should cover so the roadmap is understandable at a glance.`,
          suggested_context: `What extra context should be added to sharpen ${title.toLowerCase()}?`,
        };
      }
      if (item && typeof item === "object") {
        const title =
          typeof item.title === "string"
            ? item.title.trim()
            : typeof item.name === "string"
              ? item.name.trim()
              : "";
        const why =
          typeof item.why === "string"
            ? item.why.trim()
            : typeof item.description === "string"
              ? item.description.trim()
              : "";
        const breakdown =
          typeof item.breakdown === "string"
            ? item.breakdown.trim()
            : typeof item.summary === "string"
              ? item.summary.trim()
              : title
                ? `Outlines what ${title.toLowerCase()} should cover so the roadmap is understandable at a glance.`
                : "";
        return {
          id: makeNodeId(),
          title,
          why,
          breakdown,
          suggested_context:
            typeof item.suggested_context === "string"
              ? item.suggested_context.trim()
              : typeof item.context_prompt === "string"
                ? item.context_prompt.trim()
                : title
                  ? `What extra context should be added to sharpen ${title.toLowerCase()}?`
                  : "",
        };
      }
      return {
        id: makeNodeId(),
        title: "",
        why: "",
        breakdown: "",
        suggested_context: "",
      };
    })
    .filter((item) => item.title && item.why && item.breakdown && item.suggested_context);
}

function normalizeProblemType(value) {
  const labels = {
    descriptive_analysis: "Descriptive Analysis",
    predictive_modeling: "Predictive Modeling",
    experiment_causal_question: "Experiment / Causal Question",
    operational_optimization: "Operational Optimization",
  };
  if (labels[value]) {
    return labels[value];
  }
  return String(value || "")
    .replaceAll("_", " ")
    .replaceAll("/", " / ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function updateAssessmentFields() {
  assessmentType.value = state.problemTypeKey || "predictive_modeling";
  const mismatch =
    Boolean(state.problemTypeKey) &&
    Boolean(state.inferredProblemTypeKey) &&
    state.problemTypeKey !== state.inferredProblemTypeKey;
  assessmentType.classList.toggle("mismatch", mismatch);
  assessmentTitle.value = state.assessmentTitle || "No explanation yet.";
  assessmentTitle.classList.toggle("mismatch", mismatch);
  assessmentRecap.value = state.assessmentRecap || "No interview recap yet.";
  autoResize(assessmentTitle);
  autoResize(assessmentRecap);
}

function updateAssessmentPrioritySummary() {
  const totals = state.roadmap.reduce(
    (accumulator, node) => {
      const prompt = (node.suggested_context || "").trim();
      if (!prompt) {
        accumulator.medium += 1;
      } else if (isNoAdditionalSuggestedItem(prompt)) {
        accumulator.low += 1;
      } else {
        accumulator.high += 1;
      }
      return accumulator;
    },
    { high: 0, medium: 0, low: 0 },
  );

  if (assessmentHighPriority) {
    assessmentHighPriority.textContent = String(totals.high);
  }
  if (assessmentMediumPriority) {
    assessmentMediumPriority.textContent = String(totals.medium);
  }
  if (assessmentLowPriority) {
    assessmentLowPriority.textContent = String(totals.low);
  }
}

function openNodeModal(nodeId) {
  const node = state.roadmap.find((item) => item.id === nodeId);
  if (!node) {
    return;
  }
  state.activeNodeId = nodeId;
  nodeModalName.value = node.title;
  nodeModalWhy.value = node.why;
  nodeModalBreakdown.value = node.breakdown;
  nodeModalContext.value = node.suggested_context;
  nodeModal.hidden = false;
  document.body.style.overflow = "hidden";
  autoResize(nodeModalWhy);
  autoResize(nodeModalBreakdown);
  autoResize(nodeModalContext);
}

function closeNodeModal() {
  nodeModal.hidden = true;
  state.activeNodeId = null;
  document.body.style.overflow = "";
}

function saveNodeModal() {
  const node = state.roadmap.find((item) => item.id === state.activeNodeId);
  if (!node) {
    return;
  }
  node.title = nodeModalName.value.trim();
  node.why = nodeModalWhy.value.trim();
  node.breakdown = nodeModalBreakdown.value.trim();
  node.suggested_context = nodeModalContext.value.trim();
  renderRoadmapEditor();
  closeNodeModal();
}

function removeActiveNode() {
  return;
}

function makeNodeId() {
  const id = `node-${state.nextNodeId}`;
  state.nextNodeId += 1;
  return id;
}

function resetNewNodeDraft() {
  state.polishedDraft = null;
  newNodeDraft.value = "";
  newNodePreview.hidden = true;
  newNodeTitleInput.value = "";
  newNodeWhyInput.value = "";
  newNodeBreakdownInput.value = "";
  newNodeContextInput.value = "";
  confirmAddNodeButton.disabled = true;
  autoResizeAll();
}

function openDetailsModal(target) {
  detailsModalTarget = target;
  detailsModalInput.value =
    target === "roadmap" ? roadmapProblemDetailsInput.value : problemDetailsInput.value;
  detailsModal.hidden = false;
  document.body.style.overflow = "hidden";
  detailsModalInput.scrollTop = 0;
  detailsModalInput.focus();
}

function closeDetailsModal() {
  detailsModal.hidden = true;
  document.body.style.overflow = "";
}

function setProblemDetails(value) {
  state.problemDetails = value;
  problemDetailsInput.value = value;
  roadmapProblemDetailsInput.value = value;
  updateProblemDetailsPreviews();
}

function updateProblemDetailsPreviews() {
  const value = state.problemDetails || problemDetailsInput.value || roadmapProblemDetailsInput.value || "";
  [problemDetailsPreview, roadmapProblemDetailsPreview].forEach((preview) => {
    preview.textContent = value
      ? 'Details added. Click "Insert Details" to review or edit.'
      : "No detailed bucket added yet.";
    preview.classList.toggle("empty", !value);
    preview.classList.toggle("has-content", Boolean(value));
  });
}

function isNoAdditionalSuggestedItem(value) {
  return value.trim().toLowerCase() === NO_ADDITIONAL_SUGGESTED_ITEM.toLowerCase();
}

function applyFollowUpPromptStyle(element) {
  if (!element) {
    return;
  }
  const isComplete = isNoAdditionalSuggestedItem(element.value || "");
  element.classList.toggle("is-complete", isComplete);
  element.classList.toggle("needs-attention", !isComplete && element.value.trim().length > 0);
}

function refreshRoadmapCompletionState() {
  const allComplete =
    state.roadmap.length > 0 &&
    state.roadmap.every((node) => isNoAdditionalSuggestedItem(node.suggested_context || ""));

  confirmRoadmapButton.classList.toggle("ready", allComplete);
  confirmRoadmapButton.classList.toggle("needs-attention", !allComplete);
}

function buildPolishDraft() {
  const draft = newNodeDraft.value.trim();
  const existing = readCustomNodeDraft();
  if (!existing) {
    return draft;
  }
  return [
    draft,
    `Current title: ${existing.title}`,
    `Current why: ${existing.why}`,
    `Current breakdown:\n${existing.breakdown}`,
    `Current suggested context: ${existing.suggested_context}`,
  ].filter(Boolean).join("\n\n");
}

function readCustomNodeDraft() {
  const title = newNodeTitleInput.value.trim();
  const why = newNodeWhyInput.value.trim();
  const breakdown = newNodeBreakdownInput.value.trim();
  const suggested_context = newNodeContextInput.value.trim();
  if (!title && !why && !breakdown && !suggested_context) {
    return null;
  }
  return { title, why, breakdown, suggested_context };
}

function autoResize(element) {
  if (!element || element.tagName !== "TEXTAREA") {
    return;
  }
  if (element.id === "details-modal-input") {
    return;
  }
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

function autoResizeAll() {
  document.querySelectorAll("textarea").forEach((textarea) => autoResize(textarea));
}

document.addEventListener("input", (event) => {
  autoResize(event.target);
  if (event.target.classList?.contains("node-context-input")) {
    applyFollowUpPromptStyle(event.target);
    refreshRoadmapCompletionState();
  }
});

autoResizeAll();
updateAssessmentFields();
updateProblemDetailsPreviews();
refreshRoadmapCompletionState();
updateAssessmentPrioritySummary();
