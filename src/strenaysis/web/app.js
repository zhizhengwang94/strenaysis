const state = {
  problem: "",
  problemDetails: "",
  problemTypeKey: "",
  inferredProblemTypeKey: "",
  problemType: "",
  assessmentTitle: "",
  assessmentRecap: "",
  roadmap: [],
  nodeBuilds: {},
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
const detailStepTitle = document.getElementById("detail-step-title");
const detailSubtitle = document.getElementById("detail-subtitle");
const detailProgress = document.getElementById("detail-progress");
const detailNodeName = document.getElementById("detail-node-name");
const detailNodeDescriptionPreview = document.getElementById("detail-node-description-preview");
const detailNodeBreakdownPreview = document.getElementById("detail-node-breakdown-preview");
const detailNodeDescription = document.getElementById("detail-node-description");
const detailNodeBreakdown = document.getElementById("detail-node-breakdown");
const refreshNodeBuildButton = document.getElementById("refresh-node-build");
const openDetailBriefModalButton = document.getElementById("open-detail-brief-modal");
const detailExecutionSummary = document.getElementById("detail-execution-summary");
const detailExecutionSummaryPreview = document.getElementById("detail-execution-summary-preview");
const detailKeyQuestion = document.getElementById("detail-key-question");
const detailKeyQuestionPreview = document.getElementById("detail-key-question-preview");
const detailWorkstreams = document.getElementById("detail-workstreams");
const detailWorkstreamsPreview = document.getElementById("detail-workstreams-preview");
const detailExtractedContext = document.getElementById("detail-extracted-context");
const detailExtractedContextPreview = document.getElementById("detail-extracted-context-preview");
const detailOpenQuestions = document.getElementById("detail-open-questions");
const detailOpenQuestionsPreview = document.getElementById("detail-open-questions-preview");
const addWorkItemButton = document.getElementById("add-work-item");
const detailWorkItems = document.getElementById("detail-work-items");
const executionItemsPreview = document.getElementById("execution-items-preview");
const synthesizeOutputButton = document.getElementById("synthesize-output");
const detailOutputFocus = document.getElementById("detail-output-focus");
const detailOutputWork = document.getElementById("detail-output-work");
const detailOutputOwners = document.getElementById("detail-output-owners");
const detailOutputRisks = document.getElementById("detail-output-risks");
const detailOutput = document.getElementById("detail-output");
const prevNodeButton = document.getElementById("prev-node");
const nextNodeButton = document.getElementById("next-node");
const summaryContent = document.getElementById("summary-content");
const restartFlowButton = document.getElementById("restart-flow");
const exportDocxButton = document.getElementById("export-docx");
const exportPptxButton = document.getElementById("export-pptx");
const nodeTemplate = document.getElementById("roadmap-node-template");
const workItemTemplate = document.getElementById("work-item-template");
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
const detailBriefModal = document.getElementById("detail-brief-modal");
const detailBriefModalBackdrop = document.getElementById("detail-brief-modal-backdrop");
const closeDetailBriefModalButton = document.getElementById("close-detail-brief-modal");
const saveDetailBriefModalButton = document.getElementById("save-detail-brief-modal");
const detailBriefModalName = document.getElementById("detail-brief-modal-name");
const detailBriefModalDescription = document.getElementById("detail-brief-modal-description");
const detailBriefModalBreakdown = document.getElementById("detail-brief-modal-breakdown");
const executionModal = document.getElementById("execution-modal");
const executionModalBackdrop = document.getElementById("execution-modal-backdrop");
const openExecutionModalButton = document.getElementById("open-execution-modal");
const closeExecutionModalButton = document.getElementById("close-execution-modal");
const agentNoteModal = document.getElementById("agent-note-modal");
const agentNoteModalBackdrop = document.getElementById("agent-note-modal-backdrop");
const closeAgentNoteModalButton = document.getElementById("close-agent-note-modal");
const agentNoteModalTitle = document.getElementById("agent-note-modal-title");
const agentNoteModalCopy = document.getElementById("agent-note-modal-copy");
const agentNoteModalContent = document.getElementById("agent-note-modal-content");
const summaryNodeModal = document.getElementById("summary-node-modal");
const summaryNodeModalBackdrop = document.getElementById("summary-node-modal-backdrop");
const closeSummaryNodeModalButton = document.getElementById("close-summary-node-modal");
const summaryNodeModalTitle = document.getElementById("summary-node-modal-title");
const summaryNodeModalCopy = document.getElementById("summary-node-modal-copy");
const summaryNodeModalBody = document.getElementById("summary-node-modal-body");
const summaryProblemModal = document.getElementById("summary-problem-modal");
const summaryProblemModalBackdrop = document.getElementById("summary-problem-modal-backdrop");
const closeSummaryProblemModalButton = document.getElementById("close-summary-problem-modal");
const summaryProblemModalBody = document.getElementById("summary-problem-modal-body");
const sidebarNavItems = Array.from(document.querySelectorAll(".nav-item"));
const sectionToggles = Array.from(document.querySelectorAll(".section-toggle"));
const contextHelpButtons = Array.from(document.querySelectorAll(".context-help-button"));
const NO_ADDITIONAL_SUGGESTED_ITEM = "No Additional Suggested Item";

let detailsModalTarget = "problem";

refreshNodeBuildButton.addEventListener("click", async () => {
  await loadNodeBuild(state.roadmap[state.currentIndex], true);
});

openDetailBriefModalButton.addEventListener("click", openDetailBriefModal);
closeDetailBriefModalButton.addEventListener("click", closeDetailBriefModal);
detailBriefModalBackdrop.addEventListener("click", closeDetailBriefModal);
saveDetailBriefModalButton.addEventListener("click", saveDetailBriefModal);
openExecutionModalButton.addEventListener("click", openExecutionModal);
closeExecutionModalButton.addEventListener("click", closeExecutionModal);
executionModalBackdrop.addEventListener("click", closeExecutionModal);
closeAgentNoteModalButton.addEventListener("click", closeAgentNoteModal);
agentNoteModalBackdrop.addEventListener("click", closeAgentNoteModal);
closeSummaryNodeModalButton.addEventListener("click", closeSummaryNodeModal);
summaryNodeModalBackdrop.addEventListener("click", closeSummaryNodeModal);
closeSummaryProblemModalButton.addEventListener("click", closeSummaryProblemModal);
summaryProblemModalBackdrop.addEventListener("click", closeSummaryProblemModal);
sectionToggles.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.target;
    const section = document.querySelector(`.collapsible-section[data-section="${target}"]`);
    if (!section) {
      return;
    }
    section.classList.toggle("is-open");
    button.textContent = section.classList.contains("is-open") ? "Collapse" : "Expand";
  });
});
contextHelpButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.helpTarget;
    if (target === "guiding-question") {
      openAgentNoteModal(
        "Guiding Question",
        "This is the agent's distilled question behind the node.",
        [detailKeyQuestion.value.trim() || "No guiding question yet."],
      );
      return;
    }
    if (target === "open-questions") {
      openAgentNoteModal(
        "Open Questions",
        "These are the unresolved questions the agent still sees around this node.",
        parseList(detailOpenQuestions.value),
      );
    }
  });
});

synthesizeOutputButton.addEventListener("click", async () => {
  const currentNode = state.roadmap[state.currentIndex];
  if (!currentNode) {
    return;
  }
  synthesizeOutputButton.disabled = true;
  synthesizeOutputButton.textContent = "Synthesizing...";
  try {
    const response = await fetch("/api/node-output", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem: state.problem,
        problem_details: state.problemDetails,
        node_title: detailNodeName.textContent.trim() || currentNode.title,
        node_description: detailNodeDescription.value.trim(),
        node_breakdown: detailNodeBreakdown.value.trim(),
        key_question: detailKeyQuestion.value.trim(),
        extracted_context: detailExtractedContext.value.trim(),
        execution_items: collectWorkItems(),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to synthesize this node output.");
    }
    applyStructuredOutput(payload.output || "", payload.output_sections || {});
    autoResizeAll();
  } catch (error) {
    window.alert(error.message);
  } finally {
    synthesizeOutputButton.disabled = false;
    synthesizeOutputButton.textContent = "Synthesize Output";
  }
});

addWorkItemButton.addEventListener("click", () => {
  renderWorkItemCard({
    action: "",
    owner: "",
    collaborator: "",
    source: "",
    artifact: "",
    approval: "No approval needed",
    blockers: "No blocker identified yet.",
  });
  autoResizeAll();
});

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
  if (event.key === "Escape" && !detailBriefModal.hidden) {
    closeDetailBriefModal();
  }
  if (event.key === "Escape" && !executionModal.hidden) {
    closeExecutionModal();
  }
  if (event.key === "Escape" && !agentNoteModal.hidden) {
    closeAgentNoteModal();
  }
  if (event.key === "Escape" && !summaryNodeModal.hidden) {
    closeSummaryNodeModal();
  }
  if (event.key === "Escape" && !summaryProblemModal.hidden) {
    closeSummaryProblemModal();
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
  for (const key of Object.keys(state.nodeBuilds)) {
    if (!state.roadmap.some((node) => node.id === key)) {
      delete state.nodeBuilds[key];
    }
  }
  showPanel("details");
  loadDetailStep();
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
  if (
    !detailOutputFocus.value.trim() ||
    !detailOutputWork.value.trim() ||
    !detailOutputOwners.value.trim() ||
    !detailOutputRisks.value.trim()
  ) {
    window.alert("Please complete all structured output boxes before continuing.");
    detailOutputFocus.focus();
    return;
  }
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
  state.nodeBuilds = {};
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
  detailWorkItems.innerHTML = "";
  summaryContent.innerHTML = "";
  updateAssessmentFields();
  updateProblemDetailsPreviews();
  resetNewNodeDraft();
  refreshRoadmapCompletionState();
  updateAssessmentPrioritySummary();
  showPanel("problem");
});

exportDocxButton.addEventListener("click", () => exportWorkflow("docx", exportDocxButton, "Download Word"));
exportPptxButton.addEventListener("click", () => exportWorkflow("pptx", exportPptxButton, "Download PowerPoint"));

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
  resetDetailSections();
  detailTitle.textContent = "Roadmap Buildup";
  if (detailStepTitle) {
    detailStepTitle.textContent = currentNode.title;
  }
  detailNodeName.textContent = currentNode.title;
  detailNodeDescription.value = currentNode.why;
  detailNodeBreakdown.value = currentNode.breakdown;
  syncBriefPreviews();
  detailSubtitle.textContent = `Build out the ${currentNode.title.toLowerCase()} node in detail before moving to the next part of the roadmap. ${currentNode.why}`;
  detailProgress.textContent = `${state.currentIndex + 1} of ${state.roadmap.length}`;
  nextNodeButton.textContent =
    state.currentIndex === state.roadmap.length - 1 ? "Finish Workflow" : "Save and Continue";
  loadNodeBuild(currentNode, false);
}

async function loadNodeBuild(node, forceRefresh) {
  if (!node) {
    return;
  }
  const existing = state.nodeBuilds[node.id];
  if (existing && !forceRefresh) {
    hydrateNodeBuild(existing);
    return;
  }

  refreshNodeBuildButton.disabled = true;
  refreshNodeBuildButton.textContent = forceRefresh ? "Refreshing..." : "Loading...";
  try {
    const response = await fetch("/api/node-build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem: state.problem,
        problem_details: state.problemDetails,
        problem_type: state.problemTypeKey,
        node_title: node.title,
        node_why: node.why,
        node_breakdown: node.breakdown,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to prepare this node build.");
    }
    const scaffold = {
      node_name: node.title,
      node_description: node.why,
      node_breakdown: node.breakdown,
      execution_summary: payload.execution_summary || "",
      key_question: payload.key_question || "",
      workstreams: Array.isArray(payload.workstreams) ? payload.workstreams : [],
      extracted_context: payload.extracted_context || "",
      open_questions: Array.isArray(payload.open_questions) ? payload.open_questions : [],
      execution_items: Array.isArray(payload.execution_items) ? payload.execution_items : [],
      output: payload.output || "",
      output_sections: normalizeOutputSections(payload.output_sections || parseStructuredOutput(payload.output || "")),
    };
    state.nodeBuilds[node.id] = scaffold;
    hydrateNodeBuild(scaffold);
  } catch (error) {
    window.alert(error.message);
  } finally {
    refreshNodeBuildButton.disabled = false;
    refreshNodeBuildButton.textContent = "Refresh Node Draft";
  }
}

function hydrateNodeBuild(build) {
  detailNodeName.textContent = build.node_name || "";
  detailNodeDescription.value = build.node_description || "";
  detailNodeBreakdown.value = build.node_breakdown || "";
  syncBriefPreviews();
  detailExecutionSummary.value = build.execution_summary || "";
  detailKeyQuestion.value = build.key_question || "";
  detailWorkstreams.value = formatWorkstreams(build.workstreams || []);
  detailExtractedContext.value = build.extracted_context || "";
  detailOpenQuestions.value = formatList(build.open_questions || []);
  applyStructuredOutput(build.output || "", build.output_sections || parseStructuredOutput(build.output || ""));
  detailWorkItems.innerHTML = "";
  (build.execution_items || []).forEach((item) => renderWorkItemCard(item));
  refreshContextPreviews();
  refreshExecutionPreview();
  autoResizeAll();
}

function renderWorkItemCard(item) {
  const fragment = workItemTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".work-item-card");
  const summaryButton = fragment.querySelector(".work-item-summary");
  const summaryTitle = fragment.querySelector(".work-item-summary-title");
  const summaryMeta = fragment.querySelector(".work-item-summary-meta");
  const summaryToggle = fragment.querySelector(".work-item-summary-toggle");
  const actionInput = fragment.querySelector(".work-item-action");
  const ownerInput = fragment.querySelector(".work-item-owner");
  const collaboratorInput = fragment.querySelector(".work-item-collaborator");
  const sourceInput = fragment.querySelector(".work-item-source");
  const artifactInput = fragment.querySelector(".work-item-artifact");
  const approvalInput = fragment.querySelector(".work-item-approval");
  const blockersInput = fragment.querySelector(".work-item-blockers");
  const removeButton = fragment.querySelector(".remove-work-item");
  actionInput.value = item.action || "";
  ownerInput.value = item.owner || "";
  collaboratorInput.value = item.collaborator || "";
  sourceInput.value = item.source || "";
  artifactInput.value = item.artifact || "";
  const approvalValue = item.approval || "No approval needed";
  if (!Array.from(approvalInput.options).some((option) => option.value === approvalValue)) {
    const option = document.createElement("option");
    option.value = approvalValue;
    option.textContent = approvalValue;
    approvalInput.appendChild(option);
  }
  approvalInput.value = approvalValue;
  blockersInput.value = item.blockers || "";
  const refreshSummary = () => {
    const action = actionInput.value.trim() || "New action item";
    const owner = ownerInput.value.trim() || "Owner not set";
    const source = sourceInput.value.trim() || "Source not set";
    summaryTitle.textContent = action;
    summaryMeta.textContent = `${owner} | ${source}`;
  };
  [actionInput, ownerInput, sourceInput].forEach((input) => {
    input.addEventListener("input", () => {
      refreshSummary();
      refreshExecutionPreview();
    });
  });
  summaryButton.addEventListener("click", () => {
    const shouldOpen = !card.classList.contains("is-open");
    detailWorkItems.querySelectorAll(".work-item-card").forEach((itemCard) => {
      itemCard.classList.remove("is-open");
      const toggle = itemCard.querySelector(".work-item-summary-toggle");
      if (toggle) {
        toggle.textContent = "Expand";
      }
    });
    if (shouldOpen) {
      card.classList.add("is-open");
      summaryToggle.textContent = "Collapse";
    }
  });
  removeButton.addEventListener("click", () => {
    card.remove();
    refreshExecutionPreview();
  });
  refreshSummary();
  detailWorkItems.appendChild(card);
}

function saveCurrentNote() {
  const currentNode = state.roadmap[state.currentIndex];
  if (!currentNode) {
    return;
  }
  currentNode.title = detailNodeName.textContent.trim() || currentNode.title;
  currentNode.why = detailNodeDescription.value.trim();
  currentNode.breakdown = detailNodeBreakdown.value.trim();

  const workItems = collectWorkItems();

  state.nodeBuilds[currentNode.id] = {
    node_name: detailNodeName.textContent.trim() || currentNode.title,
    node_description: detailNodeDescription.value.trim(),
    node_breakdown: detailNodeBreakdown.value.trim(),
    execution_summary: detailExecutionSummary.value.trim(),
    key_question: detailKeyQuestion.value.trim(),
    workstreams: parseWorkstreams(detailWorkstreams.value),
    extracted_context: detailExtractedContext.value.trim(),
    open_questions: parseList(detailOpenQuestions.value),
    execution_items: workItems,
    output: buildStructuredOutput(),
    output_sections: normalizeOutputSections({
      focus: detailOutputFocus.value.trim(),
      work_to_complete: detailOutputWork.value.trim(),
      owners_and_sources: detailOutputOwners.value.trim(),
      risks_and_handoff: detailOutputRisks.value.trim(),
    }),
  };
  syncBriefPreviews();
  refreshContextPreviews();
  refreshExecutionPreview();
}

function renderSummary() {
  summaryContent.innerHTML = "";
  const allActions = state.roadmap.flatMap((node) =>
    ((state.nodeBuilds[node.id]?.execution_items || []).map((item) => ({ ...item, node: node.title }))),
  );
  const readyCount = state.roadmap.filter((node) => isNoAdditionalSuggestedItem(node.suggested_context || "")).length;
  const overview = document.createElement("section");
  overview.className = "summary-overview-grid";
  overview.innerHTML = `
    <article class="summary-overview-card problem">
      <p class="card-label">Problem Review</p>
      <h3>Main Question</h3>
      <p>${escapeHtml(state.problem)}</p>
      <button class="ghost-button summary-problem-button" type="button">Review Detail</button>
    </article>
    <article class="summary-overview-card actions">
      <p class="card-label">Action Coverage</p>
      <h3>Actionable Items</h3>
      <strong>${allActions.length}</strong>
      <p>Concrete actions captured across the full roadmap buildup.</p>
    </article>
    <article class="summary-overview-card readiness">
      <p class="card-label">Readiness</p>
      <h3>Ready Nodes</h3>
      <strong>${readyCount}/${state.roadmap.length}</strong>
      <p>Nodes that no longer need additional suggested context.</p>
    </article>
  `;
  summaryContent.appendChild(overview);
  overview.querySelector(".summary-problem-button")?.addEventListener("click", openSummaryProblemModal);

  const nodesSection = document.createElement("section");
  nodesSection.className = "summary-section-card";
  nodesSection.innerHTML = `
    <div class="summary-section-header">
      <div>
        <p class="card-label">Node Review</p>
        <h3>Roadmap Build Summary</h3>
        <p class="section-copy">Review the framework node by node, then open any node to inspect the execution items behind it.</p>
      </div>
      <span class="status-chip">${state.roadmap.length} nodes</span>
    </div>
  `;
  const nodeGrid = document.createElement("div");
  nodeGrid.className = "summary-node-grid";
  state.roadmap.forEach((node) => {
    const nodeBuild = state.nodeBuilds[node.id] || {};
    const outputSections = normalizeOutputSections(nodeBuild.output_sections || parseStructuredOutput(nodeBuild.output || ""));
    const actionCount = Array.isArray(nodeBuild.execution_items) ? nodeBuild.execution_items.length : 0;
    const isReady = isNoAdditionalSuggestedItem(node.suggested_context || "");
    const card = document.createElement("article");
    card.className = `summary-node-card ${isReady ? "ready" : "needs-attention"}`;
    card.innerHTML = `
      <div class="summary-node-top">
        <div>
          <h4>${escapeHtml(node.title)}</h4>
          <p>${escapeHtml(node.why)}</p>
        </div>
        <span class="status-chip">${isReady ? "Ready" : "Needs Context"}</span>
      </div>
      <div class="summary-node-copy">
        <p>${escapeHtml(nodeBuild.execution_summary || "No execution summary added yet.")}</p>
        <p>${escapeHtml(outputSections.focus || "No focus added yet.")}</p>
      </div>
      <div class="summary-section-header">
        <span class="status-chip">${actionCount} actions</span>
        <button class="ghost-button summary-review-button" type="button">Review Node</button>
      </div>
    `;
    card.querySelector(".summary-review-button")?.addEventListener("click", () => openSummaryNodeModal(node, nodeBuild));
    nodeGrid.appendChild(card);
  });
  nodesSection.appendChild(nodeGrid);
  summaryContent.appendChild(nodesSection);
}

async function exportWorkflow(format, button, idleText) {
  const payload = buildExportPayload(format);
  button.disabled = true;
  button.textContent = format === "docx" ? "Preparing Word..." : "Preparing PowerPoint...";
  try {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let message = "Unable to export this workflow.";
      try {
        const data = await response.json();
        message = data.error || message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = format === "docx" ? "strenaysis-workflow.docx" : "strenaysis-workflow.pptx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    window.alert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = idleText;
  }
}

function buildExportPayload(format) {
  return {
    format,
    problem: state.problem,
    problem_details: state.problemDetails,
    problem_type: state.problemType,
    assessment_title: state.assessmentTitle,
    assessment_recap: state.assessmentRecap,
    nodes: state.roadmap.map((node) => ({
      title: node.title,
      why: node.why,
      breakdown: node.breakdown,
      suggested_context: node.suggested_context,
      build: state.nodeBuilds[node.id] || {},
    })),
  };
}

function showPanel(name) {
  Object.entries(panels).forEach(([key, panel]) => {
    panel.classList.toggle("active", key === name);
  });
  const activeNav = name === "summary" ? "review" : "problems";
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
      state.nodeBuilds = {};
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

function collectWorkItems() {
  return Array.from(detailWorkItems.querySelectorAll(".work-item-card"))
    .map((card) => ({
      action: card.querySelector(".work-item-action")?.value.trim() || "",
      owner: card.querySelector(".work-item-owner")?.value.trim() || "",
      collaborator: card.querySelector(".work-item-collaborator")?.value.trim() || "",
      source: card.querySelector(".work-item-source")?.value.trim() || "",
      artifact: card.querySelector(".work-item-artifact")?.value.trim() || "",
      approval: card.querySelector(".work-item-approval")?.value.trim() || "",
      blockers: card.querySelector(".work-item-blockers")?.value.trim() || "",
    }))
    .filter(
      (item) =>
        item.action ||
        item.owner ||
        item.collaborator ||
        item.source ||
        item.artifact ||
        item.blockers ||
        item.approval !== "No approval needed",
    );
}

function formatList(items) {
  return (items || []).join("\n");
}

function parseList(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatWorkstreams(items) {
  return (items || [])
    .map((item) => `${item.name}: ${item.purpose} | Priority: ${item.priority} | Done when: ${item.completion_criteria}`)
    .join("\n");
}

function syncBriefPreviews() {
  if (detailNodeDescriptionPreview) {
    detailNodeDescriptionPreview.textContent = detailNodeDescription.value.trim() || "No node description added yet.";
  }
  if (detailNodeBreakdownPreview) {
    detailNodeBreakdownPreview.textContent = detailNodeBreakdown.value.trim() || "No node breakdown added yet.";
  }
}

function refreshContextPreviews() {
  if (detailExecutionSummaryPreview) {
    detailExecutionSummaryPreview.textContent = detailExecutionSummary.value.trim() || "No execution summary yet.";
  }
  if (detailKeyQuestionPreview) {
    detailKeyQuestionPreview.textContent = detailKeyQuestion.value.trim() || "No guiding question yet.";
  }
  renderPreviewList(detailWorkstreamsPreview, parseWorkstreams(detailWorkstreams.value).map((item) => item.name || item.purpose || ""));
  renderPreviewList(detailExtractedContextPreview, parseList(detailExtractedContext.value));
  renderPreviewList(detailOpenQuestionsPreview, parseList(detailOpenQuestions.value));
}

function renderPreviewList(container, items) {
  if (!container) {
    return;
  }
  const values = (items || []).filter((item) => String(item || "").trim());
  if (!values.length) {
    container.innerHTML = `<div class="context-preview-item">No items added yet.</div>`;
    return;
  }
  container.innerHTML = values
    .map((item) => `<div class="context-preview-item">${escapeHtml(String(item))}</div>`)
    .join("");
}

function refreshExecutionPreview() {
  if (!executionItemsPreview) {
    return;
  }
  const items = collectWorkItems();
  if (!items.length) {
    executionItemsPreview.innerHTML = `
      <div class="execution-preview-copy">
        No action items yet. Open planning to add tasks, owners, approvals, and blockers.
      </div>
    `;
    return;
  }
  executionItemsPreview.innerHTML = items
    .map(
      (item, index) => `
        <div class="execution-preview-item">
          <div class="execution-preview-main">
            <div class="execution-preview-title">${escapeHtml(item.action || `Action item ${index + 1}`)}</div>
            <div class="execution-preview-meta">${escapeHtml(`${item.owner || "Owner not set"} | ${item.source || "Source not set"}`)}</div>
          </div>
        </div>
      `,
    )
    .join("");
}

function normalizeOutputSections(sections) {
  return {
    focus: String(sections?.focus || "").trim(),
    work_to_complete: String(sections?.work_to_complete || "").trim(),
    owners_and_sources: String(sections?.owners_and_sources || "").trim(),
    risks_and_handoff: String(sections?.risks_and_handoff || "").trim(),
  };
}

function parseStructuredOutput(text) {
  const sections = {
    focus: "",
    work_to_complete: "",
    owners_and_sources: "",
    risks_and_handoff: "",
  };
  String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      if (line.startsWith("Focus:")) {
        sections.focus = line.replace("Focus:", "").trim();
      } else if (line.startsWith("What will be done:")) {
        sections.work_to_complete = line.replace("What will be done:", "").trim();
      } else if (line.startsWith("Who and where:")) {
        sections.owners_and_sources = line.replace("Who and where:", "").trim();
      } else if (line.startsWith("Deliverable and risk:")) {
        sections.risks_and_handoff = line.replace("Deliverable and risk:", "").trim();
      }
    });
  return sections;
}

function buildStructuredOutput() {
  const sections = normalizeOutputSections({
    focus: detailOutputFocus.value.trim(),
    work_to_complete: detailOutputWork.value.trim(),
    owners_and_sources: detailOutputOwners.value.trim(),
    risks_and_handoff: detailOutputRisks.value.trim(),
  });
  detailOutput.value = [
    `Focus: ${sections.focus}`,
    `What will be done: ${sections.work_to_complete}`,
    `Who and where: ${sections.owners_and_sources}`,
    `Deliverable and risk: ${sections.risks_and_handoff}`,
  ].join("\n");
  return detailOutput.value;
}

function applyStructuredOutput(output, sections) {
  const normalized = normalizeOutputSections(Object.values(sections || {}).some(Boolean) ? sections : parseStructuredOutput(output));
  detailOutputFocus.value = normalized.focus;
  detailOutputWork.value = normalized.work_to_complete;
  detailOutputOwners.value = normalized.owners_and_sources;
  detailOutputRisks.value = normalized.risks_and_handoff;
  detailOutput.value = output || buildStructuredOutput();
}

function parseWorkstreams(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ name: line, purpose: "", priority: "", completion_criteria: "" }));
}

function openDetailBriefModal() {
  detailBriefModalName.value = detailNodeName.textContent.trim();
  detailBriefModalDescription.value = detailNodeDescription.value;
  detailBriefModalBreakdown.value = detailNodeBreakdown.value;
  detailBriefModal.hidden = false;
  document.body.style.overflow = "hidden";
  autoResize(detailBriefModalDescription);
  autoResize(detailBriefModalBreakdown);
}

function closeDetailBriefModal() {
  detailBriefModal.hidden = true;
  document.body.style.overflow = "";
}

function openExecutionModal() {
  executionModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeExecutionModal() {
  executionModal.hidden = true;
  document.body.style.overflow = "";
}

function openAgentNoteModal(title, copy, items) {
  agentNoteModalTitle.textContent = title;
  agentNoteModalCopy.textContent = copy;
  const values = (items || []).filter((item) => String(item || "").trim());
  agentNoteModalContent.innerHTML = values.length
    ? values.map((item) => `<div class="context-preview-item">${escapeHtml(String(item))}</div>`).join("")
    : `<div class="context-preview-item">No agent note available yet.</div>`;
  agentNoteModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeAgentNoteModal() {
  agentNoteModal.hidden = true;
  document.body.style.overflow = "";
}

function openSummaryNodeModal(node, nodeBuild) {
  const outputSections = normalizeOutputSections(nodeBuild.output_sections || parseStructuredOutput(nodeBuild.output || ""));
  const workstreams = Array.isArray(nodeBuild.workstreams)
    ? nodeBuild.workstreams.map((item) => item.name || item.purpose || "").filter(Boolean)
    : [];
  const actions = Array.isArray(nodeBuild.execution_items) ? nodeBuild.execution_items : [];
  summaryNodeModalTitle.textContent = node.title;
  summaryNodeModalCopy.textContent = node.why || "Review the full node synthesis and execution trail.";
  summaryNodeModalBody.className = "modal-body summary-modal-body";
  summaryNodeModalBody.innerHTML = `
    <section class="summary-modal-section">
      <h4>Node Breakdown</h4>
      <p>${escapeHtml(node.breakdown || "No node breakdown added yet.")}</p>
    </section>
    <section class="summary-modal-section">
      <h4>Execution Summary</h4>
      <p>${escapeHtml(nodeBuild.execution_summary || "No execution summary added yet.")}</p>
    </section>
    <section class="summary-modal-section">
      <h4>Problem Parse</h4>
      <p>${escapeHtml(nodeBuild.extracted_context || "No extracted context added yet.")}</p>
    </section>
    <section class="summary-modal-section">
      <h4>Workstreams</h4>
      <div class="summary-modal-list">
        ${
          workstreams.length
            ? workstreams.map((item) => `<div class="summary-modal-item">${escapeHtml(item)}</div>`).join("")
            : `<div class="summary-modal-item">No workstreams added yet.</div>`
        }
      </div>
    </section>
    <section class="summary-modal-section">
      <h4>Action Items</h4>
      <div class="summary-modal-list">
        ${
          actions.length
            ? actions
                .map(
                  (item) => `
                    <div class="summary-modal-item">
                      <p>${escapeHtml(item.action || "No action title")}</p>
                      <p>${escapeHtml(`Owner: ${item.owner || "Not set"} | Collaborator: ${item.collaborator || "Not set"}`)}</p>
                      <p>${escapeHtml(`Source: ${item.source || "Not set"}`)}</p>
                      <p>${escapeHtml(`Artifact: ${item.artifact || "Not set"}`)}</p>
                      <p>${escapeHtml(`Approval: ${item.approval || "Not set"} | Blocker: ${item.blockers || "Not set"}`)}</p>
                    </div>
                  `,
                )
                .join("")
            : `<div class="summary-modal-item">No action items added yet.</div>`
        }
      </div>
    </section>
    <section class="summary-modal-section">
      <h4>Deck Background Context</h4>
      <div class="summary-modal-list">
        <div class="summary-modal-item">${escapeHtml(`Focus: ${outputSections.focus || "No focus added yet."}`)}</div>
        <div class="summary-modal-item">${escapeHtml(`Work to complete: ${outputSections.work_to_complete || "No work summary added yet."}`)}</div>
        <div class="summary-modal-item">${escapeHtml(`Owners and sources: ${outputSections.owners_and_sources || "No owners or sources added yet."}`)}</div>
        <div class="summary-modal-item">${escapeHtml(`Risks and handoff: ${outputSections.risks_and_handoff || "No risks or handoff added yet."}`)}</div>
      </div>
    </section>
  `;
  summaryNodeModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeSummaryNodeModal() {
  summaryNodeModal.hidden = true;
  document.body.style.overflow = "";
}

function openSummaryProblemModal() {
  summaryProblemModalBody.innerHTML = `
    <section class="summary-modal-section">
      <h4>Main Question</h4>
      <p>${escapeHtml(state.problem || "No problem captured yet.")}</p>
    </section>
    <section class="summary-modal-section">
      <h4>Detailed Context</h4>
      <p>${escapeHtml(state.problemDetails || "No detailed bucket added yet.")}</p>
    </section>
    <section class="summary-modal-section">
      <h4>Assessment</h4>
      <p>${escapeHtml(state.problemType || "Problem type not set yet.")}</p>
      <p>${escapeHtml(state.assessmentTitle || "No assessment explanation yet.")}</p>
      <p>${escapeHtml(state.assessmentRecap || "No recap added yet.")}</p>
    </section>
  `;
  summaryProblemModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeSummaryProblemModal() {
  summaryProblemModal.hidden = true;
  document.body.style.overflow = "";
}

function saveDetailBriefModal() {
  detailNodeName.textContent = detailBriefModalName.value.trim();
  detailNodeDescription.value = detailBriefModalDescription.value.trim();
  detailNodeBreakdown.value = detailBriefModalBreakdown.value.trim();
  if (detailStepTitle) {
    detailStepTitle.textContent = detailNodeName.textContent || "Detail Builder";
  }
  syncBriefPreviews();
  autoResize(detailNodeDescription);
  autoResize(detailNodeBreakdown);
  closeDetailBriefModal();
}

function resetDetailSections() {
  document.querySelectorAll(".collapsible-section").forEach((section) => {
    section.classList.add("is-open");
  });
  sectionToggles.forEach((button) => {
    button.textContent = "Collapse";
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
