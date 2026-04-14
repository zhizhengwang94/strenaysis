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
  activeProblemPanel: "problem",
};

const panels = {
  problem: document.getElementById("step-problem"),
  roadmap: document.getElementById("step-roadmap"),
  details: document.getElementById("step-details"),
  summary: document.getElementById("step-summary"),
  actions: document.getElementById("step-actions"),
  review: document.getElementById("step-review"),
  profile: document.getElementById("step-profile"),
};

const problemInput = document.getElementById("problem-input");
const problemDetailsInput = document.getElementById("problem-details-input");
const problemDetailsPreview = document.getElementById("problem-details-preview");
const openProblemDetailsButton = document.getElementById("open-problem-details");
const startRoadmapButton = document.getElementById("start-roadmap");
const roadmapList = document.getElementById("roadmap-list");
const confirmRoadmapButton = document.getElementById("confirm-roadmap");
const openRoadmapLogButton = document.getElementById("open-roadmap-log");
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
  const addNodeCard = document.getElementById("add-node-card");
  const openAddNodeButton = document.getElementById("open-add-node");
  const polishNodeButton = document.getElementById("polish-node");
  const confirmAddNodeButton = document.getElementById("confirm-add-node");
const newNodePreview = document.getElementById("new-node-preview");
const newNodeAdvisory = document.getElementById("new-node-advisory");
const newNodeTitleInput = document.getElementById("new-node-title-input");
const newNodeWhyInput = document.getElementById("new-node-why-input");
const newNodeBreakdownInput = document.getElementById("new-node-breakdown-input");
const newNodeContextInput = document.getElementById("new-node-context-input");
const detailTitle = document.getElementById("detail-title");
const detailStepTitle = document.getElementById("detail-step-title");
const detailSubtitle = document.getElementById("detail-subtitle");
const detailProgress = document.getElementById("detail-progress");
const detailNodeSwitcher = document.getElementById("detail-node-switcher");
const detailNodeName = document.getElementById("detail-node-name");
const detailNodeDescriptionPreview = document.getElementById("detail-node-description-preview");
const detailNodeBreakdownPreview = document.getElementById("detail-node-breakdown-preview");
const detailNodeDescription = document.getElementById("detail-node-description");
const detailNodeBreakdown = document.getElementById("detail-node-breakdown");
const detailCoverageReview = document.getElementById("detail-coverage-review");
const refreshNodeBuildButton = document.getElementById("refresh-node-build");
const openDetailBriefModalButton = document.getElementById("open-detail-brief-modal");
const detailExecutionSummary = document.getElementById("detail-execution-summary");
const detailExecutionSummaryPreview = document.getElementById("detail-execution-summary-preview");
const detailKeyQuestion = document.getElementById("detail-key-question");
const detailWorkstreams = document.getElementById("detail-workstreams");
const detailExtractedContext = document.getElementById("detail-extracted-context");
const detailOpenQuestions = document.getElementById("detail-open-questions");
const detailFollowUpPrompt = document.getElementById("detail-followup-prompt");
const detailFollowUpSupport = document.getElementById("detail-followup-support");
const detailFollowUpResponses = document.getElementById("detail-followup-responses");
const detailFollowUpType = document.getElementById("detail-followup-type");
const detailFollowUpInput = document.getElementById("detail-followup-input");
const addFollowUpResponseButton = document.getElementById("add-followup-response");
const addWorkItemButton = document.getElementById("add-work-item");
const detailWorkItems = document.getElementById("detail-work-items");
const executionItemsPreview = document.getElementById("execution-items-preview");
const detailOutputFocus = document.getElementById("detail-output-focus");
const detailOutputWork = document.getElementById("detail-output-work");
const detailOutputOwners = document.getElementById("detail-output-owners");
const detailOutputRisks = document.getElementById("detail-output-risks");
const detailOutput = document.getElementById("detail-output");
const prevNodeButton = document.getElementById("prev-node");
const nextNodeButton = document.getElementById("next-node");
const summaryContent = document.getElementById("summary-content");
const restartFlowButton = document.getElementById("restart-flow");
const saveProblemFramingButton = document.getElementById("save-problem-framing");
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
const nodeModalFollowUpResponses = document.getElementById("node-modal-followup-responses");
const nodeModalFollowUpType = document.getElementById("node-modal-followup-type");
const nodeModalFollowUpInput = document.getElementById("node-modal-followup-input");
const nodeModalAddFollowUpButton = document.getElementById("node-modal-add-followup");
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
const roadmapLogModal = document.getElementById("roadmap-log-modal");
const roadmapLogModalBackdrop = document.getElementById("roadmap-log-modal-backdrop");
const closeRoadmapLogModalButton = document.getElementById("close-roadmap-log-modal");
const roadmapLogModalBody = document.getElementById("roadmap-log-modal-body");
const profileStatus = document.getElementById("profile-status");
const profileHistoryList = document.getElementById("profile-history-list");
const actionsStatus = document.getElementById("actions-status");
const actionsOverview = document.getElementById("actions-overview");
const actionsCalendar = document.getElementById("actions-calendar");
const actionsList = document.getElementById("actions-list");
const addActionProblemButton = document.getElementById("add-action-problem");
const pipelineStatus = document.getElementById("pipeline-status");
const pipelineOverview = document.getElementById("pipeline-overview");
const pipelineStages = document.getElementById("pipeline-stages");
const pipelineActivity = document.getElementById("pipeline-activity");
const profileItemModal = document.getElementById("profile-item-modal");
const profileItemModalBackdrop = document.getElementById("profile-item-modal-backdrop");
const closeProfileItemModalButton = document.getElementById("close-profile-item-modal");
const profileItemModalTitle = document.getElementById("profile-item-modal-title");
const profileItemModalBody = document.getElementById("profile-item-modal-body");
const loadProfileHistoryButton = document.getElementById("load-profile-history");
const saveProblemModal = document.getElementById("save-problem-modal");
const saveProblemModalBackdrop = document.getElementById("save-problem-modal-backdrop");
const closeSaveProblemModalButton = document.getElementById("close-save-problem-modal");
const confirmSaveProblemButton = document.getElementById("confirm-save-problem");
const saveProblemNameInput = document.getElementById("save-problem-name");
const saveProblemDateInput = document.getElementById("save-problem-date");
const saveProblemPriorityInput = document.getElementById("save-problem-priority");
const addNodeModal = document.getElementById("add-node-modal");
const addNodeModalBackdrop = document.getElementById("add-node-modal-backdrop");
const closeAddNodeModalButton = document.getElementById("close-add-node-modal");
const appToast = document.getElementById("app-toast");
const appToastEyebrow = document.getElementById("app-toast-eyebrow");
const appToastMessage = document.getElementById("app-toast-message");
const appToastCloseButton = document.getElementById("app-toast-close");
const startRoadmapStatus = document.getElementById("start-roadmap-status");
const glossaryStatus = document.getElementById("glossary-status");
const assessmentStatus = document.getElementById("assessment-status");
const frameworkStatus = document.getElementById("framework-status");
const customNodeStatus = document.getElementById("custom-node-status");
const detailBuildStatus = document.getElementById("detail-build-status");
const outputStatus = document.getElementById("output-status");
const sidebarNavItems = Array.from(document.querySelectorAll(".nav-item"));
const problemSubsteps = Array.from(document.querySelectorAll(".nav-substep"));
const sectionToggles = Array.from(document.querySelectorAll(".section-toggle"));
const contextHelpButtons = Array.from(document.querySelectorAll(".context-help-button"));
const NO_ADDITIONAL_SUGGESTED_ITEM = "No Additional Suggested Item";

const analysisStatusMap = {
  startRoadmap: startRoadmapStatus,
  glossary: glossaryStatus,
  assessment: assessmentStatus,
  framework: frameworkStatus,
  customNode: customNodeStatus,
  detailBuild: detailBuildStatus,
  output: outputStatus,
  actions: actionsStatus,
  review: pipelineStatus,
  profile: profileStatus,
};

let detailsModalTarget = "problem";
let appToastTimer = null;

refreshNodeBuildButton.addEventListener("click", async () => {
  await loadNodeBuild(state.roadmap[state.currentIndex], true);
});

if (openDetailBriefModalButton) {
  openDetailBriefModalButton.addEventListener("click", openDetailBriefModal);
}
if (closeDetailBriefModalButton) {
  closeDetailBriefModalButton.addEventListener("click", closeDetailBriefModal);
}
if (detailBriefModalBackdrop) {
  detailBriefModalBackdrop.addEventListener("click", closeDetailBriefModal);
}
if (saveDetailBriefModalButton) {
  saveDetailBriefModalButton.addEventListener("click", saveDetailBriefModal);
}
openExecutionModalButton.addEventListener("click", openExecutionModal);
closeExecutionModalButton.addEventListener("click", closeExecutionModal);
executionModalBackdrop.addEventListener("click", closeExecutionModal);
closeAgentNoteModalButton.addEventListener("click", closeAgentNoteModal);
agentNoteModalBackdrop.addEventListener("click", closeAgentNoteModal);
closeSummaryNodeModalButton.addEventListener("click", closeSummaryNodeModal);
summaryNodeModalBackdrop.addEventListener("click", closeSummaryNodeModal);
closeSummaryProblemModalButton.addEventListener("click", closeSummaryProblemModal);
summaryProblemModalBackdrop.addEventListener("click", closeSummaryProblemModal);
openRoadmapLogButton.addEventListener("click", openRoadmapLogModal);
closeRoadmapLogModalButton.addEventListener("click", closeRoadmapLogModal);
roadmapLogModalBackdrop.addEventListener("click", closeRoadmapLogModal);
  closeProfileItemModalButton.addEventListener("click", closeProfileItemModal);
  profileItemModalBackdrop.addEventListener("click", closeProfileItemModal);
  closeSaveProblemModalButton.addEventListener("click", closeSaveProblemModal);
  saveProblemModalBackdrop.addEventListener("click", closeSaveProblemModal);
  closeAddNodeModalButton.addEventListener("click", closeAddNodeModal);
  addNodeModalBackdrop.addEventListener("click", closeAddNodeModal);
  loadProfileHistoryButton.addEventListener("click", loadProfileHistory);
appToastCloseButton.addEventListener("click", hideAppToast);
addActionProblemButton.addEventListener("click", () => {
  showAppToast("Action conversion is the next step. For now, this workspace is a high-level tracker.", "Actions workspace");
});
addFollowUpResponseButton.addEventListener("click", () => {
  const response = detailFollowUpInput.value.trim();
  if (!response) {
    window.alert("Please add a response before saving it to the node.");
    return;
  }
  const currentNode = state.roadmap[state.currentIndex];
  if (!currentNode) {
    return;
  }
  const existingBuild = state.nodeBuilds[currentNode.id] || {};
  const nextResponses = [...(existingBuild.follow_up_responses || []), {
    type: detailFollowUpType.value,
    text: response,
  }];
  existingBuild.follow_up_responses = nextResponses;
  state.nodeBuilds[currentNode.id] = existingBuild;
  detailFollowUpInput.value = "";
  renderFollowUpResponses(nextResponses);
  autoResize(detailFollowUpInput);
});
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
    statusKeys: ["startRoadmap"],
    statusText: "Analyzing question",
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
    statusKeys: ["glossary", "assessment", "framework"],
    statusText: "Refreshing question",
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
    statusKeys: ["assessment", "framework"],
    statusText: "Updating approach",
    resetNotes: false,
    showRoadmap: false,
  });
});

  if (openAddNodeButton) {
    openAddNodeButton.addEventListener("click", () => {
      if (state.sequenceEditMode) {
        return;
      }
      openAddNodeModal();
    });
  }

  editSequenceButton.addEventListener("click", () => {
    state.sequenceEditMode = true;
    closeAddNodeModal();
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

if (openRoadmapProblemDetailsButton) {
  openRoadmapProblemDetailsButton.addEventListener("click", () => {
    openDetailsModal("roadmap");
  });
}

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
  if (event.key === "Escape" && !roadmapLogModal.hidden) {
    closeRoadmapLogModal();
  }
  if (event.key === "Escape" && !profileItemModal.hidden) {
    closeProfileItemModal();
  }
  if (event.key === "Escape" && !saveProblemModal.hidden) {
    closeSaveProblemModal();
  }
  if (event.key === "Escape" && !addNodeModal.hidden) {
    closeAddNodeModal();
  }
});
closeNodeModalButton.addEventListener("click", closeNodeModal);
nodeModalBackdrop.addEventListener("click", closeNodeModal);
saveNodeModalButton.addEventListener("click", saveNodeModal);
nodeModalAddFollowUpButton.addEventListener("click", async () => {
  const node = state.roadmap.find((item) => item.id === state.activeNodeId);
  if (!node) {
    return;
  }
  const nodeIndex = state.roadmap.findIndex((item) => item.id === node.id);
  const response = nodeModalFollowUpInput.value.trim();
  if (!response) {
    window.alert("Please add a response before saving it to the node.");
    return;
  }
  const prompt = nodeModalContext.value.trim();
  const threads = normalizeNodeFollowUpThreads(node);
  threads.push({
    prompt: prompt || "No Additional Suggested Item",
    responses: [{
      type: nodeModalFollowUpType.value,
      text: response,
    }],
  });
  node.follow_up_threads = threads;
  node.follow_up_responses = [];
  nodeModalFollowUpInput.value = "";
  nodeModalFollowUpType.value = "Confirmed fact";
  renderNodeModalFollowUpResponses(node.follow_up_threads);
  nodeModalAddFollowUpButton.disabled = true;
  nodeModalAddFollowUpButton.textContent = "Saving...";
  try {
    await refreshRoadmapFollowUps(nodeIndex);
    const refreshedNode = state.roadmap.find((item) => item.id === node.id);
    nodeModalContext.value = refreshedNode?.suggested_context || NO_ADDITIONAL_SUGGESTED_ITEM;
  } catch (error) {
    window.alert(error.message);
    nodeModalContext.value = getNextNodeFollowUpPrompt(node, threads);
  } finally {
    nodeModalAddFollowUpButton.disabled = false;
    nodeModalAddFollowUpButton.textContent = "Add Response";
    autoResize(nodeModalFollowUpInput);
    autoResize(nodeModalContext);
  }
});

confirmRoadmapButton.addEventListener("click", () => {
  const cleaned = state.roadmap
    .map((node) => ({
      id: node.id ?? makeNodeId(),
      title: node.title.trim(),
      why: node.why.trim(),
      breakdown: node.breakdown.trim(),
      suggested_context: node.suggested_context.trim(),
      follow_up_threads: normalizeNodeFollowUpThreads(node),
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
    polishNodeButton.textContent = "Generating...";
  setAnalysisStatus(["customNode"], true, "Polishing node");
  try {
    const response = await fetch("/api/polish-node", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem: state.problem,
        problem_details: state.problemDetails,
        draft,
        roadmap_titles: state.roadmap.map((node) => node.title),
      }),
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
      recommendation: String(payload.recommendation || "recommended").trim(),
      advisory: String(payload.advisory || "").trim(),
    };
    newNodeTitleInput.value = state.polishedDraft.title;
    newNodeWhyInput.value = state.polishedDraft.why;
    newNodeBreakdownInput.value = state.polishedDraft.breakdown;
    newNodeContextInput.value = state.polishedDraft.suggested_context;
    renderNewNodeAdvisory(state.polishedDraft);
    newNodePreview.hidden = false;
    confirmAddNodeButton.disabled = false;
      confirmAddNodeButton.textContent = state.polishedDraft.recommendation === "caution" ? "Add Anyway" : "Confirm Add Node";
      autoResizeAll();
    } catch (error) {
      window.alert(error.message);
    } finally {
      setAnalysisStatus(["customNode"], false);
      polishNodeButton.disabled = false;
      polishNodeButton.textContent = "Polish and Generate Node Info";
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
  if (!state.polishedDraft.recommendation) {
    state.polishedDraft.recommendation = "recommended";
    }
    state.roadmap.push(state.polishedDraft);
    renderRoadmapEditor();
    resetNewNodeDraft();
    closeAddNodeModal();
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

saveProblemFramingButton.addEventListener("click", async () => {
  return;
});

confirmSaveProblemButton.addEventListener("click", async () => {
  const selectedDate = saveProblemDateInput.value || new Date().toISOString().slice(0, 10);
  const displayName = saveProblemNameInput.value.trim() || `Problem_${selectedDate}`;

  confirmSaveProblemButton.disabled = true;
  confirmSaveProblemButton.textContent = "Saving...";
  try {
    const response = await fetch("/api/save-problem-framing", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem: state.problem,
        problem_name: displayName,
        problem_details: state.problemDetails,
        problem_type: state.problemType,
        assessment_title: state.assessmentTitle,
        assessment_recap: state.assessmentRecap,
        priority: saveProblemPriorityInput.value,
        saved_date: selectedDate,
        nodes: state.roadmap.map((node) => ({
          title: node.title,
          why: node.why,
          breakdown: node.breakdown,
          suggested_context: node.suggested_context,
          build: state.nodeBuilds[node.id] || {},
        })),
      }),
    });
    const raw = await response.text();
    let payload = {};
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(raw || "Unable to save this problem framing.");
    }
    if (!response.ok) {
      throw new Error(payload.error || "Unable to save this problem framing.");
    }
    closeSaveProblemModal();
    showAppToast(`Saved locally: ${payload.problem_name || payload.problem}`, "Problem framing saved");
    showPanel("profile");
    await loadProfileHistory();
  } catch (error) {
    window.alert(error.message);
  } finally {
    confirmSaveProblemButton.disabled = false;
    confirmSaveProblemButton.textContent = "Save Locally";
  }
});

exportDocxButton.addEventListener("click", () => exportWorkflow("docx", exportDocxButton, "Download Word"));
exportPptxButton.addEventListener("click", () => exportWorkflow("pptx", exportPptxButton, "Download PowerPoint"));

sidebarNavItems.forEach((item) => {
  item.addEventListener("click", async () => {
    const nav = item.dataset.nav;
    if (nav === "actions") {
      showPanel("actions");
      await loadActionProblems();
      return;
    }
    if (nav === "review") {
      showPanel("review");
      await loadPipelineOverview();
      return;
    }
    if (nav === "profile") {
      showPanel("profile");
      return;
    }
    showPanel(state.activeProblemPanel || "problem");
  });
});

problemSubsteps.forEach((item) => {
  item.addEventListener("click", () => {
    const target = item.dataset.problemStep;
    if (!target || !["problem", "roadmap", "details", "summary"].includes(target)) {
      return;
    }
    showPanel(target);
    if (target === "details" && state.roadmap.length) {
      loadDetailStep();
    }
    if (target === "summary" && state.roadmap.length) {
      renderSummary();
    }
  });
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
    if (addNodeCard) {
      const nextPosition = getRoadmapPosition(state.roadmap.length);
      addNodeCard.classList.toggle("is-disabled", state.sequenceEditMode);
      addNodeCard.style.gridColumn = String(nextPosition.column);
      addNodeCard.style.gridRowStart = String(nextPosition.row);
      roadmapList.appendChild(addNodeCard);
    }
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
  renderDetailNodeSwitcher();
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

function renderDetailNodeSwitcher() {
  if (!detailNodeSwitcher) {
    return;
  }
  detailNodeSwitcher.innerHTML = "";
  state.roadmap.forEach((node, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "detail-node-switcher-button";
    if (index === state.currentIndex) {
      button.classList.add("is-active");
    }
    button.innerHTML = `
      <span class="detail-node-switcher-index">${index + 1}</span>
      <span>${escapeHtml(node.title || `Node ${index + 1}`)}</span>
    `;
    button.addEventListener("click", () => {
      if (index === state.currentIndex) {
        return;
      }
      saveCurrentNote();
      state.currentIndex = index;
      loadDetailStep();
    });
    detailNodeSwitcher.appendChild(button);
  });
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

  setAnalysisStatus(["detailBuild"], true, forceRefresh ? "Refreshing node analysis" : "Preparing node analysis");
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
    setAnalysisStatus(["detailBuild"], false);
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
  renderDetailCoverageReview();
  renderFollowUpPrompt();
  renderFollowUpResponses(build.follow_up_responses || []);
  applyStructuredOutput(build.output || "", build.output_sections || parseStructuredOutput(build.output || ""));
  detailWorkItems.innerHTML = "";
  (build.execution_items || []).forEach((item) => renderWorkItemCard(item));
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
      follow_up_responses: collectFollowUpResponses(),
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
    renderFollowUpPrompt();
    renderFollowUpResponses(state.nodeBuilds[currentNode.id].follow_up_responses || []);
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
    <article class="summary-overview-card actions">
      <p class="card-label">Roadmap Coverage</p>
      <h3>Nodes Reviewed</h3>
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

async function loadProfileHistory() {
  setAnalysisStatus(["profile"], true, "Loading history");
  profileHistoryList.innerHTML = `<article class="profile-history-card"><div class="profile-history-meta">Loading saved structures...</div></article>`;
  try {
    const response = await fetch("/api/problem-framings");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load saved problem structures.");
    }
    renderProfileHistory(payload.items || []);
  } catch (error) {
    profileHistoryList.innerHTML = `<article class="profile-history-card"><div class="profile-history-meta">${escapeHtml(error.message)}</div></article>`;
  } finally {
    setAnalysisStatus(["profile"], false);
  }
}

async function loadActionProblems() {
  setAnalysisStatus(["actions"], true, "Loading action workspace");
  actionsOverview.innerHTML = "";
  actionsCalendar.innerHTML = `<article class="action-calendar-item">Loading calendar...</article>`;
  actionsList.innerHTML = `<article class="action-list-card">Loading action problems...</article>`;
  try {
    const response = await fetch("/api/action-problems");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load active problems.");
    }
    renderActionsDashboard(payload.summary || {}, payload.calendar || [], payload.items || []);
  } catch (error) {
    actionsOverview.innerHTML = `
      <article class="summary-overview-card actions">
        <p class="card-label">Actions</p>
        <h3>Unavailable</h3>
        <p>${escapeHtml(error.message)}</p>
      </article>
    `;
    actionsCalendar.innerHTML = `<article class="action-calendar-item">${escapeHtml(error.message)}</article>`;
    actionsList.innerHTML = `<article class="action-list-card">${escapeHtml(error.message)}</article>`;
  } finally {
    setAnalysisStatus(["actions"], false);
  }
}

async function loadPipelineOverview() {
  setAnalysisStatus(["review"], true, "Loading pipeline");
  pipelineOverview.innerHTML = "";
  pipelineStages.innerHTML = `<article class="pipeline-stage-card">Loading stage counts...</article>`;
  pipelineActivity.innerHTML = `<article class="action-list-card">Loading recent movement...</article>`;
  try {
    const response = await fetch("/api/pipeline-overview");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load pipeline overview.");
    }
    renderPipelineOverview(payload.summary || {}, payload.stages || [], payload.recent_activity || []);
  } catch (error) {
    pipelineOverview.innerHTML = `
      <article class="summary-overview-card problem">
        <p class="card-label">Pipeline</p>
        <h3>Unavailable</h3>
        <p>${escapeHtml(error.message)}</p>
      </article>
    `;
    pipelineStages.innerHTML = `<article class="pipeline-stage-card">${escapeHtml(error.message)}</article>`;
    pipelineActivity.innerHTML = `<article class="action-list-card">${escapeHtml(error.message)}</article>`;
  } finally {
    setAnalysisStatus(["review"], false);
  }
}

function renderPipelineOverview(summary, stages, activity) {
  pipelineOverview.innerHTML = `
    <article class="summary-overview-card problem">
      <p class="card-label">Framed Problems</p>
      <h3>Total Structured</h3>
      <strong>${Number(summary.framed_total || 0)}</strong>
      <p>The total number of problems that have been fully framed in Strenaysis.</p>
    </article>
    <article class="summary-overview-card actions">
      <p class="card-label">Activated</p>
      <h3>Moved Into Actions</h3>
      <strong>${Number(summary.activated_total || 0)}</strong>
      <p>${Number(summary.conversion_rate || 0)}% of framed problems have been activated into work.</p>
    </article>
    <article class="summary-overview-card readiness">
      <p class="card-label">Still Framed Only</p>
      <h3>Not Yet Activated</h3>
      <strong>${Number(summary.framed_only || 0)}</strong>
      <p>These problems are saved in the library but have not been turned into action.</p>
    </article>
    <article class="summary-overview-card actions">
      <p class="card-label">Current Progress</p>
      <h3>In Progress / Resolved</h3>
      <strong>${Number(summary.in_progress || 0)} / ${Number(summary.resolved || 0)}</strong>
      <p>${Number(summary.active_total || 0)} active problems total, with ${Number(summary.not_started || 0)} not started and ${Number(summary.blocked || 0)} blocked.</p>
    </article>
  `;

  if (!stages.length) {
    pipelineStages.innerHTML = `<article class="pipeline-stage-card">No lifecycle stages available yet.</article>`;
  } else {
    pipelineStages.innerHTML = "";
    stages.forEach((stage) => {
      const card = document.createElement("article");
      card.className = `pipeline-stage-card pipeline-stage-${escapeHtml(String(stage.tone || "framed"))}`;
      card.innerHTML = `
        <span class="card-label">${escapeHtml(stage.label || "Stage")}</span>
        <strong>${Number(stage.count || 0)}</strong>
      `;
      pipelineStages.appendChild(card);
    });
  }

  if (!activity.length) {
    pipelineActivity.innerHTML = `<article class="action-list-card">No movement recorded yet.</article>`;
    return;
  }
  pipelineActivity.innerHTML = "";
  activity.forEach((item) => {
    const card = document.createElement("article");
    card.className = "action-list-card";
    card.innerHTML = `
      <div class="action-list-header">
        <div>
          <h4>${escapeHtml(item.problem_name || "Untitled problem")}</h4>
          <p>${escapeHtml(item.owner || "No owner listed")}</p>
        </div>
        <span class="status-chip">${escapeHtml(item.stage || "Framed")}</span>
      </div>
      <div class="action-list-footer">
        <span>${escapeHtml(`Date: ${item.date ? formatSavedDate(item.date) : "Not available"}`)}</span>
      </div>
    `;
    pipelineActivity.appendChild(card);
  });
}

function renderActionsDashboard(summary, calendar, items) {
  actionsOverview.innerHTML = `
    <article class="summary-overview-card actions">
      <p class="card-label">In Progress</p>
      <h3>Problems In Progress</h3>
      <strong>${Number(summary.in_progress || 0)}</strong>
      <p>Problems currently being worked through in the action workspace.</p>
    </article>
    <article class="summary-overview-card readiness">
      <p class="card-label">Resolved</p>
      <h3>Resolved Problems</h3>
      <strong>${Number(summary.resolved || 0)}</strong>
      <p>Problems already closed out and moved beyond active management.</p>
    </article>
    <article class="summary-overview-card problem">
      <p class="card-label">Open</p>
      <h3>Open Problems</h3>
      <strong>${Number(summary.open || 0)}</strong>
      <p>The current number of open or in-progress problems underway.</p>
    </article>
    <article class="summary-overview-card actions">
      <p class="card-label">Calendar</p>
      <h3>Due This Week</h3>
      <strong>${Number(summary.due_this_week || 0)}</strong>
      <p>${Number(summary.high_priority || 0)} high-priority problems currently being tracked.</p>
    </article>
  `;

  if (!calendar.length) {
    actionsCalendar.innerHTML = `<article class="action-calendar-item">No upcoming dates in the current action workspace.</article>`;
  } else {
    actionsCalendar.innerHTML = "";
    calendar.forEach((item) => {
      const element = document.createElement("article");
      element.className = "action-calendar-item";
      element.innerHTML = `
        <div>
          <strong>${escapeHtml(item.problem_name || "Untitled problem")}</strong>
          <p>${escapeHtml(item.status || "Open")}</p>
        </div>
        <span class="status-chip">${escapeHtml(formatSavedDate(item.due_date))}</span>
      `;
      actionsCalendar.appendChild(element);
    });
  }

  const activeItems = items.filter((item) => String(item.status || "").toLowerCase() !== "resolved");
  if (!activeItems.length) {
    actionsList.innerHTML = `<article class="action-list-card">No open problems yet. Seed examples or future action conversions will appear here.</article>`;
    return;
  }

  actionsList.innerHTML = "";
  activeItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "action-list-card";
    card.innerHTML = `
      <div class="action-list-header">
        <div>
          <h4>${escapeHtml(item.problem_name || "Untitled problem")}</h4>
          <p>${escapeHtml(item.summary || "No summary added yet.")}</p>
        </div>
        <span class="status-chip ${priorityClassName(item.priority)}">${escapeHtml(item.priority || "Medium")}</span>
      </div>
      <div class="action-list-meta">
        <span class="profile-history-metric">${escapeHtml(item.status || "Open")}</span>
        <span class="profile-history-metric">${escapeHtml(item.workstream || "General")}</span>
        <span class="profile-history-metric">${escapeHtml(`Owner: ${item.owner || "Unassigned"}`)}</span>
        <span class="profile-history-metric">${escapeHtml(`Approver: ${item.approver || "Not set"}`)}</span>
      </div>
      <div class="action-list-footer">
        <span>${escapeHtml(`Due: ${item.due_date ? formatSavedDate(item.due_date) : "Not set"}`)}</span>
        <span>${escapeHtml(`Updated: ${item.updated_at ? formatSavedDate(item.updated_at) : "Not available"}`)}</span>
      </div>
    `;
    actionsList.appendChild(card);
  });
}

function renderProfileHistory(items) {
  if (!items.length) {
    profileHistoryList.innerHTML = `
      <article class="profile-history-card">
        <div class="profile-history-meta">
          No saved problem structures yet. Save one from Workflow Summary and it will appear here.
        </div>
      </article>
    `;
    return;
  }

  profileHistoryList.innerHTML = "";
  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "profile-history-card";
    card.innerHTML = `
      <div class="profile-history-header">
        <div>
          <h4>${escapeHtml(item.problem_name || item.problem || "Untitled problem framing")}</h4>
          <div class="profile-history-meta">
            <div>${escapeHtml(formatSavedDate(item.saved_at))}</div>
            <div>${escapeHtml(item.problem_type || "Not set")}</div>
          </div>
        </div>
        <span class="status-chip ${priorityClassName(item.priority)}">${escapeHtml(item.priority || "Medium")}</span>
      </div>
      <div class="profile-history-metrics">
        <span class="profile-history-metric">${escapeHtml(`${item.node_count || 0} nodes`)}</span>
        <span class="profile-history-metric">${escapeHtml(`${item.ready_count || 0} ready`)}</span>
        <span class="profile-history-metric">${escapeHtml(`${item.action_count || 0} actions`)}</span>
      </div>
      <button class="ghost-button profile-view-button" type="button">View Structure</button>
    `;
    card.querySelector(".profile-view-button")?.addEventListener("click", () => openProfileItem(item.filename));
    profileHistoryList.appendChild(card);
  });
}

async function openProfileItem(filename) {
  try {
    const response = await fetch(`/api/problem-framings/${encodeURIComponent(filename)}`);
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to open this saved framing.");
    }
    profileItemModalTitle.textContent = payload.problem_name || payload.problem || "Saved Problem Framing";
    profileItemModalBody.innerHTML = `
      <section class="summary-modal-section">
        <h4>Saved Metadata</h4>
        <p>${escapeHtml(`Saved on: ${formatSavedDate(payload.saved_at)}`)}</p>
        <p>${escapeHtml(`Priority: ${payload.priority || "Medium"}`)}</p>
        <p>${escapeHtml(`Problem type: ${payload.problem_type || "Not set"}`)}</p>
      </section>
      <section class="summary-modal-section">
        <h4>Problem Detail</h4>
        <p>${escapeHtml(payload.problem_name || "No custom problem name saved.")}</p>
        <p>${escapeHtml(payload.problem || "No problem captured.")}</p>
        <p>${escapeHtml(payload.problem_details || "No detailed bucket added.")}</p>
      </section>
      <section class="summary-modal-section">
        <h4>Assessment</h4>
        <p>${escapeHtml(payload.assessment_title || "No assessment saved.")}</p>
        <p>${escapeHtml(payload.assessment_recap || "No recap saved.")}</p>
      </section>
      <section class="summary-modal-section">
        <h4>Structure Summary</h4>
        <p>${escapeHtml(`${payload.node_count || 0} nodes | ${payload.ready_count || 0} ready | ${payload.action_count || 0} actions`)}</p>
      </section>
    `;
    profileItemModal.hidden = false;
    document.body.style.overflow = "hidden";
  } catch (error) {
    window.alert(error.message);
  }
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
  if (!["profile", "actions", "review"].includes(name)) {
    state.activeProblemPanel = name;
  }
  const activeNav = ["profile", "actions", "review"].includes(name) ? name : "problems";
  sidebarNavItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.nav === activeNav);
  });
  problemSubsteps.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.problemStep === state.activeProblemPanel);
  });
  requestAnimationFrame(() => {
    autoResizeAll();
    updateAssessmentFields();
  });
}

async function generateRoadmap(problem, options) {
  state.problem = problem;
  state.problemDetails = options.problemDetails || "";
  setAnalysisStatus(options.statusKeys || [], true, options.statusText || "Analyzing");
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
    setAnalysisStatus(options.statusKeys || [], false);
    if (options.button) {
      options.button.disabled = false;
      options.button.textContent = options.idleText;
    }
    if (options.button !== updateRoadbuildButton) {
      updateRoadbuildButton.disabled = false;
    }
  }
}

function setAnalysisStatus(keys, active, text = "") {
  (keys || []).forEach((key) => {
    const element = analysisStatusMap[key];
    if (!element) {
      return;
    }
    const textElement = element.querySelector(".analysis-status-text");
    if (active) {
      if (textElement && text) {
        textElement.textContent = text;
      }
      element.hidden = false;
    } else {
      element.hidden = true;
    }
  });
}

function closeProfileItemModal() {
  profileItemModal.hidden = true;
  document.body.style.overflow = "";
}

function openSaveProblemModal() {
  saveProblemNameInput.value = "";
  saveProblemDateInput.value = new Date().toISOString().slice(0, 10);
  saveProblemPriorityInput.value = "Medium";
  saveProblemModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeSaveProblemModal() {
  saveProblemModal.hidden = true;
  document.body.style.overflow = "";
}

function showAppToast(message, eyebrow = "Saved locally") {
  if (!appToast || !appToastMessage || !appToastEyebrow) {
    return;
  }
  if (appToastTimer) {
    window.clearTimeout(appToastTimer);
  }
  appToastEyebrow.textContent = eyebrow;
  appToastMessage.textContent = message;
  appToast.hidden = false;
  appToastTimer = window.setTimeout(() => {
    hideAppToast();
  }, 3200);
}

function hideAppToast() {
  if (!appToast) {
    return;
  }
  if (appToastTimer) {
    window.clearTimeout(appToastTimer);
    appToastTimer = null;
  }
  appToast.hidden = true;
}

function priorityClassName(priority) {
  const value = String(priority || "").toLowerCase();
  if (value === "high") {
    return "priority-chip-high";
  }
  if (value === "low") {
    return "priority-chip-low";
  }
  return "priority-chip-medium";
}

function formatSavedDate(value) {
  if (!value) {
    return "Saved date not available";
  }
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString();
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
  const assessmentState = getAssessmentConfidenceState();
  assessmentType.classList.remove("assessment-match", "assessment-caution", "assessment-mismatch");
  assessmentTitle.classList.remove("assessment-match", "assessment-caution", "assessment-mismatch");
  assessmentType.classList.add(`assessment-${assessmentState}`);
  assessmentTitle.value = state.assessmentTitle || "No explanation yet.";
  assessmentTitle.classList.add(`assessment-${assessmentState}`);
  assessmentRecap.value = state.assessmentRecap || "No interview recap yet.";
  autoResize(assessmentTitle);
  autoResize(assessmentRecap);
}

function getAssessmentConfidenceState() {
  const selected = String(state.problemTypeKey || "").trim();
  const inferred = String(state.inferredProblemTypeKey || "").trim();
  if (!selected || !inferred || selected === inferred) {
    return "match";
  }

  const acceptableMatches = {
    descriptive_analysis: ["predictive_modeling", "operational_optimization"],
    predictive_modeling: ["descriptive_analysis", "experiment_causal_question", "operational_optimization"],
    experiment_causal_question: ["predictive_modeling", "descriptive_analysis"],
    operational_optimization: ["predictive_modeling", "descriptive_analysis"],
  };

  return acceptableMatches[inferred]?.includes(selected) ? "caution" : "mismatch";
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
  renderNodeModalFollowUpResponses(node.follow_up_threads || []);
  nodeModalFollowUpInput.value = "";
  nodeModalFollowUpType.value = "Confirmed fact";
  nodeModal.hidden = false;
  document.body.style.overflow = "hidden";
  autoResize(nodeModalWhy);
  autoResize(nodeModalBreakdown);
  autoResize(nodeModalContext);
  autoResize(nodeModalFollowUpInput);
}

function closeNodeModal() {
  nodeModal.hidden = true;
  state.activeNodeId = null;
  document.body.style.overflow = "";
}

async function saveNodeModal() {
  const node = state.roadmap.find((item) => item.id === state.activeNodeId);
  if (!node) {
    return;
  }
  const nodeIndex = state.roadmap.findIndex((item) => item.id === node.id);
  node.title = nodeModalName.value.trim();
  node.why = nodeModalWhy.value.trim();
  node.breakdown = nodeModalBreakdown.value.trim();
  node.suggested_context = nodeModalContext.value.trim();
  persistPendingNodeModalResponse(node);
  try {
    await refreshRoadmapFollowUps(0);
  } catch (error) {
    window.alert(error.message);
  }
  renderRoadmapEditor();
  closeNodeModal();
}

function renderNodeModalFollowUpResponses(items) {
  if (!nodeModalFollowUpResponses) {
    return;
  }
  const values = normalizeNodeFollowUpThreads({ follow_up_threads: items });
  if (!values.length) {
    nodeModalFollowUpResponses.innerHTML = `
      <article class="followup-response-empty node-followup-empty">
        Saved responses will appear here as you add them. Keep only the key follow-up context that has already been covered.
      </article>
    `;
    return;
  }
  nodeModalFollowUpResponses.innerHTML = "";
  values.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "followup-response-card node-followup-card";
    card.innerHTML = `
      <button class="followup-response-summary" type="button">
        <div class="followup-response-summary-copy">
          <span class="followup-response-summary-type">${escapeHtml(compactFollowUpText(String(item.prompt || "Follow-Up Prompt"), 52))}</span>
          <span class="followup-response-summary-text">${escapeHtml(`${item.responses.length} response${item.responses.length === 1 ? "" : "s"}`)}</span>
        </div>
        <span class="followup-response-summary-toggle">Expand</span>
      </button>
      <div class="followup-response-body" hidden>
        <div class="followup-thread-question">${escapeHtml(String(item.prompt || "No prompt recorded."))}</div>
        <div class="followup-thread-answer-list"></div>
        <div class="followup-response-actions">
          <button class="ghost-button followup-response-remove" type="button">Remove</button>
        </div>
      </div>
    `;
    const summaryButton = card.querySelector(".followup-response-summary");
    const summaryToggle = card.querySelector(".followup-response-summary-toggle");
    const body = card.querySelector(".followup-response-body");
    const answerList = card.querySelector(".followup-thread-answer-list");
    const removeButton = card.querySelector(".followup-response-remove");
    answerList.innerHTML = (item.responses || []).map((response, responseIndex) => `
      <article class="followup-thread-answer">
        <div class="followup-thread-answer-top">
          <select class="followup-response-type assessment-type-select" data-response-index="${responseIndex}">
            ${buildFollowUpTypeOptions(String(response.type || "Confirmed fact"))}
          </select>
        </div>
        <textarea class="followup-response-text" data-response-index="${responseIndex}" rows="3" placeholder="Add the response you want to keep tied to this node."></textarea>
      </article>
    `).join("");
    answerList.querySelectorAll(".followup-response-type").forEach((typeInput) => {
      const responseIndex = Number(typeInput.dataset.responseIndex || "0");
      const textInput = answerList.querySelector(`.followup-response-text[data-response-index="${responseIndex}"]`);
      if (textInput) {
        textInput.value = String(item.responses?.[responseIndex]?.text || "");
        autoResize(textInput);
        typeInput.addEventListener("change", () => updateNodeModalFollowUpResponse(index, responseIndex, { type: typeInput.value, text: textInput.value.trim() }));
        textInput.addEventListener("input", () => {
          autoResize(textInput);
          updateNodeModalFollowUpResponse(index, responseIndex, { type: typeInput.value, text: textInput.value.trim() });
        });
      }
    });
    summaryButton.addEventListener("click", () => {
      const willOpen = body.hasAttribute("hidden");
      nodeModalFollowUpResponses.querySelectorAll(".followup-response-body").forEach((element) => element.setAttribute("hidden", ""));
      nodeModalFollowUpResponses.querySelectorAll(".followup-response-summary-toggle").forEach((element) => {
        element.textContent = "Expand";
      });
      if (willOpen) {
        body.removeAttribute("hidden");
        summaryToggle.textContent = "Collapse";
      }
    });
    removeButton.addEventListener("click", () => removeNodeModalFollowUpResponse(index));
    nodeModalFollowUpResponses.appendChild(card);
  });
}

function compactFollowUpText(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "No response text added yet.";
  }
  return normalized.length > 96 ? `${normalized.slice(0, 93)}...` : normalized;
}

function normalizeNodeFollowUpThreads(node) {
  const raw = Array.isArray(node?.follow_up_threads) ? node.follow_up_threads : [];
  return raw
    .map((thread) => ({
      prompt: String(thread?.prompt || "").trim(),
      responses: Array.isArray(thread?.responses)
        ? thread.responses
            .map((response) => ({
              type: String(response?.type || "Confirmed fact").trim() || "Confirmed fact",
              text: String(response?.text || "").trim(),
            }))
            .filter((response) => response.text)
        : [],
    }))
    .filter((thread) => thread.prompt || thread.responses.length);
}

function getNextNodeFollowUpPrompt(node, threads) {
  const normalizedThreads = normalizeNodeFollowUpThreads({ follow_up_threads: threads });
  const currentPrompt = String(node?.suggested_context || "").trim();
  if (isNoAdditionalSuggestedItem(currentPrompt)) {
    return NO_ADDITIONAL_SUGGESTED_ITEM;
  }
  if (!normalizedThreads.length) {
    return currentPrompt || NO_ADDITIONAL_SUGGESTED_ITEM;
  }
  if (normalizedThreads.length === 1) {
    return "What supporting evidence, owner, or constraint should be attached to that answer so this node can move forward cleanly?";
  }
  return NO_ADDITIONAL_SUGGESTED_ITEM;
}

function persistPendingNodeModalResponse(node) {
  if (!node) {
    return;
  }
  const response = nodeModalFollowUpInput.value.trim();
  const prompt = nodeModalContext.value.trim();
  if (!response || !prompt || isNoAdditionalSuggestedItem(prompt)) {
    return;
  }
  const threads = normalizeNodeFollowUpThreads(node);
  const existingThread = threads.find((item) => item.prompt === prompt);
  const nextResponse = {
    type: nodeModalFollowUpType.value,
    text: response,
  };
  if (existingThread) {
    existingThread.responses.push(nextResponse);
  } else {
    threads.push({
      prompt,
      responses: [nextResponse],
    });
  }
  node.follow_up_threads = threads;
  node.follow_up_responses = [];
  nodeModalFollowUpInput.value = "";
  nodeModalFollowUpType.value = "Confirmed fact";
}

async function refreshRoadmapFollowUps(startIndex = 0) {
  if (!state.roadmap.length) {
    return;
  }
  const response = await fetch("/api/refresh-followups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problem: state.problem,
      problem_details: state.problemDetails,
      roadmap: serializeRoadmapForFollowUpRefresh(),
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Unable to refresh node follow-up prompts.");
  }
  const prompts = Array.isArray(payload.suggested_contexts) ? payload.suggested_contexts : [];
  prompts.forEach((prompt, index) => {
    if (index < startIndex || !state.roadmap[index]) {
      return;
    }
    state.roadmap[index].suggested_context = String(prompt || "").trim() || NO_ADDITIONAL_SUGGESTED_ITEM;
  });
  renderRoadmapEditor();
}

function serializeRoadmapForFollowUpRefresh() {
  return state.roadmap.map((node) => ({
    title: String(node.title || "").trim(),
    why: String(node.why || "").trim(),
    breakdown: String(node.breakdown || "").trim(),
    suggested_context: String(node.suggested_context || "").trim(),
    follow_up_threads: normalizeNodeFollowUpThreads(node),
  }));
}

function updateNodeModalFollowUpResponse(index, responseIndex, nextValue) {
  const node = state.roadmap.find((item) => item.id === state.activeNodeId);
  if (!node) {
    return;
  }
  const items = normalizeNodeFollowUpThreads(node);
  if (!items[index] || !items[index].responses?.[responseIndex]) {
    return;
  }
  items[index].responses[responseIndex] = {
    type: String(nextValue?.type || "Confirmed fact").trim(),
    text: String(nextValue?.text || "").trim(),
  };
  node.follow_up_threads = items;
}

function removeNodeModalFollowUpResponse(index) {
  const node = state.roadmap.find((item) => item.id === state.activeNodeId);
  if (!node) {
    return;
  }
  const items = normalizeNodeFollowUpThreads(node);
  items.splice(index, 1);
  node.follow_up_threads = items;
  renderNodeModalFollowUpResponses(items);
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
  newNodeAdvisory.hidden = true;
  newNodeAdvisory.textContent = "";
  newNodeAdvisory.classList.remove("is-caution");
  newNodeTitleInput.value = "";
  newNodeWhyInput.value = "";
  newNodeBreakdownInput.value = "";
  newNodeContextInput.value = "";
    confirmAddNodeButton.disabled = true;
      confirmAddNodeButton.textContent = "Confirm Add Node";
    autoResizeAll();
  }

  function renderNewNodeAdvisory(draft) {
  if (!newNodeAdvisory) {
    return;
  }
  const message = String(draft?.advisory || "").trim();
  if (!message) {
    newNodeAdvisory.hidden = true;
    newNodeAdvisory.textContent = "";
    newNodeAdvisory.classList.remove("is-caution");
    return;
  }
  newNodeAdvisory.textContent = message;
  newNodeAdvisory.hidden = false;
  newNodeAdvisory.classList.toggle("is-caution", String(draft?.recommendation || "") === "caution");
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

function openAddNodeModal() {
  addNodeModal.hidden = false;
  document.body.style.overflow = "hidden";
  newNodeDraft.focus();
}

function closeAddNodeModal() {
  addNodeModal.hidden = true;
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
  [problemDetailsPreview, roadmapProblemDetailsPreview].filter(Boolean).forEach((preview) => {
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

function renderFollowUpPrompt() {
  if (!detailFollowUpPrompt || !detailFollowUpSupport) {
    return;
  }
  const currentNode = state.roadmap[state.currentIndex];
  const prompt = String(currentNode?.suggested_context || "").trim() || "No additional suggested item.";
  detailFollowUpPrompt.textContent = prompt;
  const supportParts = [];
  if (detailExecutionSummary.value.trim()) {
    supportParts.push(`Agent frame: ${detailExecutionSummary.value.trim()}`);
  }
  const extracted = parseList(detailExtractedContext.value);
  if (extracted.length) {
    supportParts.push(`Already known: ${extracted.slice(0, 2).join(" | ")}`);
  }
  detailFollowUpSupport.textContent =
    supportParts.join(" ") || "Keep the answers concise. Capture only the facts, evidence, assumptions, or exclusions needed to move this node forward.";
  detailFollowUpSupport.classList.toggle("is-complete", isNoAdditionalSuggestedItem(prompt));
}

function renderFollowUpResponses(items) {
  if (!detailFollowUpResponses) {
    return;
  }
  const values = Array.isArray(items) ? items : [];
  if (!values.length) {
    detailFollowUpResponses.innerHTML = `
      <article class="followup-response-empty">
        No follow-up answers saved yet. Add only the key context needed for this node.
      </article>
    `;
    return;
  }
  detailFollowUpResponses.innerHTML = "";
  values.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "followup-response-card";
    card.innerHTML = `
      <div class="followup-response-top">
        <select class="followup-response-type assessment-type-select">
          ${buildFollowUpTypeOptions(String(item.type || "Confirmed fact"))}
        </select>
        <button class="ghost-button followup-response-remove" type="button">Remove</button>
      </div>
      <textarea class="followup-response-text" rows="3" placeholder="Add the response you want to keep tied to this node."></textarea>
    `;
    const typeInput = card.querySelector(".followup-response-type");
    const textInput = card.querySelector(".followup-response-text");
    const removeButton = card.querySelector(".followup-response-remove");
    textInput.value = String(item.text || "");
    typeInput.addEventListener("change", () => updateFollowUpResponse(index, { type: typeInput.value, text: textInput.value.trim() }));
    textInput.addEventListener("input", () => {
      autoResize(textInput);
      updateFollowUpResponse(index, { type: typeInput.value, text: textInput.value.trim() });
    });
    removeButton.addEventListener("click", () => removeFollowUpResponse(index));
    detailFollowUpResponses.appendChild(card);
    autoResize(textInput);
  });
}

function renderDetailCoverageReview() {
  if (!detailCoverageReview) {
    return;
  }
  const currentNode = state.roadmap[state.currentIndex];
  const threads = normalizeNodeFollowUpThreads(currentNode);
  if (!threads.length) {
    detailCoverageReview.innerHTML = `
      <article class="detail-coverage-empty">
        No earlier roadmap coverage has been saved for this node yet. Any follow-up captured during roadmap buildup will appear here.
      </article>
    `;
    return;
  }

  detailCoverageReview.innerHTML = "";
  threads.forEach((thread, index) => {
    const card = document.createElement("article");
    card.className = "detail-coverage-card";
    const coverageType = deriveCoverageType(thread);
    card.innerHTML = `
      <button class="detail-coverage-summary" type="button" aria-expanded="false">
        <span class="detail-coverage-type">${escapeHtml(coverageType)}</span>
        <span class="detail-coverage-question">${escapeHtml(thread.prompt || "Untitled coverage item")}</span>
        <span class="detail-coverage-toggle">Expand</span>
      </button>
      <div class="detail-coverage-body" hidden>
        ${(thread.responses || []).length ? thread.responses.map((response) => `
          <article class="detail-coverage-answer">
            <span class="detail-coverage-answer-type">${escapeHtml(response.type || "Coverage")}</span>
            <div class="detail-coverage-answer-text">${escapeHtml(response.text || "")}</div>
          </article>
        `).join("") : `
          <article class="detail-coverage-answer">
            <span class="detail-coverage-answer-type">${escapeHtml(coverageType)}</span>
            <div class="detail-coverage-answer-text">${escapeHtml("No saved answer yet.")}</div>
          </article>
        `}
      </div>
    `;
    const summaryButton = card.querySelector(".detail-coverage-summary");
    const body = card.querySelector(".detail-coverage-body");
    const toggle = card.querySelector(".detail-coverage-toggle");
    summaryButton?.addEventListener("click", () => {
      Array.from(detailCoverageReview.querySelectorAll(".detail-coverage-card")).forEach((otherCard, otherIndex) => {
        const otherBody = otherCard.querySelector(".detail-coverage-body");
        const otherButton = otherCard.querySelector(".detail-coverage-summary");
        const otherToggle = otherCard.querySelector(".detail-coverage-toggle");
        const isOpen = otherIndex === index ? otherBody?.hidden : false;
        if (otherBody) {
          otherBody.hidden = !isOpen;
        }
        otherButton?.setAttribute("aria-expanded", String(Boolean(isOpen)));
        if (otherToggle) {
          otherToggle.textContent = isOpen ? "Collapse" : "Expand";
        }
      });
      if (body && !body.hidden) {
        body.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
    detailCoverageReview.appendChild(card);
  });
}

function deriveCoverageType(thread) {
  const types = Array.isArray(thread?.responses)
    ? thread.responses
        .map((response) => String(response?.type || "").trim())
        .filter(Boolean)
    : [];
  if (!types.length) {
    return "Coverage";
  }
  return types.length === 1 ? types[0] : `${types[0]} +${types.length - 1}`;
}

function buildFollowUpTypeOptions(selectedValue) {
  return getFollowUpTypes()
    .map((item) => `<option value="${escapeHtml(item)}"${item === selectedValue ? " selected" : ""}>${escapeHtml(item)}</option>`)
    .join("");
}

function getFollowUpTypes() {
  return [
    "Confirmed fact",
    "Gathered evidence",
    "Hypothesis",
    "Assumption to proceed",
    "Please do not consider",
  ];
}

function collectFollowUpResponses() {
  const currentNode = state.roadmap[state.currentIndex];
  if (!currentNode) {
    return [];
  }
  return Array.isArray(state.nodeBuilds[currentNode.id]?.follow_up_responses)
    ? state.nodeBuilds[currentNode.id].follow_up_responses.filter((item) => String(item?.text || "").trim())
    : [];
}

function updateFollowUpResponse(index, nextValue) {
  const currentNode = state.roadmap[state.currentIndex];
  if (!currentNode) {
    return;
  }
  const build = state.nodeBuilds[currentNode.id] || {};
  const items = Array.isArray(build.follow_up_responses) ? [...build.follow_up_responses] : [];
  if (!items[index]) {
    return;
  }
  items[index] = {
    type: String(nextValue?.type || "Confirmed fact").trim(),
    text: String(nextValue?.text || "").trim(),
  };
  build.follow_up_responses = items;
  state.nodeBuilds[currentNode.id] = build;
}

function removeFollowUpResponse(index) {
  const currentNode = state.roadmap[state.currentIndex];
  if (!currentNode) {
    return;
  }
  const build = state.nodeBuilds[currentNode.id] || {};
  const items = Array.isArray(build.follow_up_responses) ? [...build.follow_up_responses] : [];
  items.splice(index, 1);
  build.follow_up_responses = items;
  state.nodeBuilds[currentNode.id] = build;
  renderFollowUpResponses(items);
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
  if (!sections.focus && !sections.work_to_complete && !sections.owners_and_sources && !sections.risks_and_handoff) {
    detailOutput.value = "";
    return "";
  }
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
  const currentNode = state.roadmap[state.currentIndex];
  if (!currentNode) {
    return;
  }
  openNodeModal(currentNode.id);
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
  const threads = normalizeNodeFollowUpThreads(node);
  const actions = Array.isArray(nodeBuild.execution_items) ? nodeBuild.execution_items : [];
  summaryNodeModalTitle.textContent = node.title;
  summaryNodeModalCopy.textContent = "Review how this node moved from roadmap framing into follow-up coverage and execution work.";
  summaryNodeModalBody.className = "modal-body summary-modal-body";
  summaryNodeModalBody.innerHTML = `
    <section class="summary-modal-section">
      <h4>Roadmap Framing</h4>
      <div class="summary-modal-list">
        <div class="summary-modal-item">
          <strong>Node Description</strong>
          <p>${escapeHtml(node.why || "No node description added yet.")}</p>
        </div>
        <div class="summary-modal-item">
          <strong>Node Breakdown</strong>
          <p>${escapeHtml(node.breakdown || "No node breakdown added yet.")}</p>
        </div>
      </div>
    </section>
    <section class="summary-modal-section">
      <h4>Roadmap Follow-Up Coverage</h4>
      <div class="summary-modal-list">
        ${
          threads.length
            ? threads
                .map(
                  (thread) => `
                    <div class="summary-modal-item">
                      <p><strong>Question</strong></p>
                      <p>${escapeHtml(thread.prompt || "No prompt recorded.")}</p>
                      <p><strong>Answers</strong></p>
                      ${
                        (thread.responses || []).length
                          ? thread.responses
                              .map(
                                (response) =>
                                  `<p>${escapeHtml(`${response.type || "Coverage"}: ${response.text || ""}`)}</p>`,
                              )
                              .join("")
                          : `<p>No answer saved yet.</p>`
                      }
                    </div>
                  `,
                )
                .join("")
            : `<div class="summary-modal-item">No follow-up coverage was captured for this node in roadmap buildup.</div>`
        }
      </div>
    </section>
    <section class="summary-modal-section">
      <h4>Execution Planning</h4>
      <div class="summary-modal-list">
        <div class="summary-modal-item">
          <strong>Execution Summary</strong>
          <p>${escapeHtml(nodeBuild.execution_summary || "No execution summary added yet.")}</p>
        </div>
        <div class="summary-modal-item">
          <strong>Problem Parse</strong>
          <p>${escapeHtml(nodeBuild.extracted_context || "No extracted context added yet.")}</p>
        </div>
      </div>
    </section>
    <section class="summary-modal-section">
      <h4>Action Items and Blockers</h4>
      <div class="summary-modal-list">
        ${
          actions.length
            ? actions
                .map(
                  (item) => `
                    <div class="summary-modal-item">
                      <p><strong>${escapeHtml(item.action || "No action title")}</strong></p>
                      <p>${escapeHtml(`Owner: ${item.owner || "Not set"} | Collaborator: ${item.collaborator || "Not set"}`)}</p>
                      <p>${escapeHtml(`Source: ${item.source || "Not set"} | Artifact: ${item.artifact || "Not set"}`)}</p>
                      <p>${escapeHtml(`Approval: ${item.approval || "Not set"} | Blocker: ${item.blockers || "Not set"}`)}</p>
                    </div>
                  `,
                )
                .join("")
            : `<div class="summary-modal-item">No action items added yet.</div>`
        }
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

function openRoadmapLogModal() {
  roadmapLogModalBody.innerHTML = buildRoadmapLogMarkup();
  roadmapLogModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeRoadmapLogModal() {
  roadmapLogModal.hidden = true;
  document.body.style.overflow = "";
}

function buildRoadmapLogMarkup() {
  const intro = `
    <section class="summary-modal-section roadmap-log-section">
      <h4>Main Question</h4>
      <div class="summary-modal-item">${escapeHtml(state.problem || "No main question captured yet.")}</div>
      <h4>Detailed Context</h4>
      <div class="summary-modal-item">${escapeHtml(state.problemDetails || "No additional detailed context captured yet.")}</div>
    </section>
  `;
  const nodeSections = state.roadmap.map((node, index) => {
    const threads = normalizeNodeFollowUpThreads(node);
    const threadsMarkup = threads.length
      ? threads.map((thread) => `
          <div class="roadmap-log-thread">
            <div class="roadmap-log-block">
              <span class="roadmap-log-block-label">Question</span>
              <div class="roadmap-log-block-copy">${escapeHtml(thread.prompt || "No prompt recorded.")}</div>
            </div>
            <div class="roadmap-log-block">
              <span class="roadmap-log-block-label">Answers</span>
              <div class="roadmap-log-thread-list">
                ${(thread.responses || []).map((response) => `
                  <div class="roadmap-log-response"><strong>${escapeHtml(response.type || "Response")}:</strong> ${escapeHtml(response.text || "")}</div>
                `).join("")}
              </div>
            </div>
          </div>
        `).join("")
      : `<div class="summary-modal-item">No follow-up responses saved for this node yet.</div>`;
    return `
      <section class="summary-modal-section roadmap-log-section">
        <div class="roadmap-log-node">
          <div class="roadmap-log-node-top">
            <h4>${escapeHtml(`${index + 1}. ${node.title || "Untitled Node"}`)}</h4>
            <span class="status-chip">${escapeHtml(node.suggested_context || NO_ADDITIONAL_SUGGESTED_ITEM)}</span>
          </div>
          <div class="roadmap-log-block">
            <span class="roadmap-log-block-label">Node Description</span>
            <div class="roadmap-log-block-copy">${escapeHtml(node.why || "No description yet.")}</div>
          </div>
          <div class="roadmap-log-block">
            <span class="roadmap-log-block-label">Node Breakdown</span>
            <div class="roadmap-log-block-copy">${escapeHtml(node.breakdown || "No breakdown yet.")}</div>
          </div>
          <div class="roadmap-log-block">
            <span class="roadmap-log-block-label">Current Follow-Up Prompt</span>
            <div class="roadmap-log-block-copy">${escapeHtml(node.suggested_context || NO_ADDITIONAL_SUGGESTED_ITEM)}</div>
          </div>
          <div class="roadmap-log-block">
            <span class="roadmap-log-block-label">Saved Follow-Up Coverage</span>
            ${threadsMarkup}
          </div>
        </div>
      </section>
    `;
  }).join("");
  return `${intro}${nodeSections || '<section class="summary-modal-section"><div class="summary-modal-item">No roadmap nodes yet.</div></section>'}`;
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
