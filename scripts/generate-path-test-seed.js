const fs = require("fs");
const path = require("path");

const {
  extractMermaidBlock,
  parseMermaidTransitions,
  getExitStates,
  getTraversalStateKey,
} = require("./lib/state-diagram.js");
const {
  generateTransitionCatalog,
} = require("./generate-transition-catalog.js");

const DEFAULT_DIAGRAM_PATH = path.resolve(
  __dirname,
  "..",
  ".github",
  "workflows",
  "ISSUE_LIFECYCLE_STATE_DIAGRAM.md",
);
const DEFAULT_OUTPUT_PATH = path.resolve(
  __dirname,
  "..",
  "docs",
  "path-test-issues.seed.json",
);

const LABEL_BY_STATE = {
  Needs_Details: "needs-details",
  Auto_Abandoned: "auto-abandoned",
  On_Bench: "on the bench",
  In_Hole: "in the hole",
  On_Deck: "on deck",
  At_Bat: "at bat",
  Dev_Assigned: "implementation ready",
};

const WORKFLOW_NAME_BY_PATH = {
  ".github/workflows/issue-intake.yml": "Issue Intake",
  ".github/workflows/stale-issues.yml": "Stale Issues",
  ".github/workflows/rebalance-on-close.yml": "Rebalance On Close",
  ".github/workflows/ai-code-review.yml": "AI Code Review",
  ".github/workflows/auto-merge.yml": "Auto Merge",
};

const TITLE_STATE_NAMES = {
  Validation_Failed: "Validation Failed",
  Needs_Details: "Needs Details",
  Triage_Rejected: "Triage Rejected",
  On_Bench: "On Bench",
  In_Hole: "In Hole",
  On_Deck: "On Deck",
  At_Bat: "At Bat",
  Needs_Prep: "Needs Prep",
  Stage_1_Fail: "Stage 1 Fail",
  AI_Comments_R1: "AI Review R1",
  AI_Comments_R2: "AI Review R2",
  AI_Comments_R3: "AI Review R3",
  Stage_5_Escalated: "Escalated Review",
  Approval_Rejected: "Changes Requested",
  Approval_Rejected_Esc: "Escalated Reject",
  Manual_Close_Check: "Manual Close",
  Closed_Failed: "Closed Failed",
  Close_Issue: "Merged Close",
};

const CLOSE_REASON_BY_EXIT = {
  Auto_Abandoned: "not_planned",
  Closed_Rejected: "not_planned",
  Closed_Failed: "not_planned",
  Manual_Completed: "completed",
  Close_Issue: "completed",
};

const LANE_STATES = ["On_Bench", "In_Hole", "On_Deck", "At_Bat"];

const PATH_DESCRIPTOR_BY_FAMILY = {
  validation_failure: "Validation Failed / Needs Details",
  triage_rejected: "Triage Rejected",
  manual_close: "Manual Close",
  ai_round_1_pass: "AI Round 1 Pass",
  ai_round_2_pass: "AI Round 2 Pass",
  ai_round_3_pass: "AI Round 3 Pass",
  escalated_approve: "Escalated Approve",
  escalated_reject: "Escalated Reject",
};

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function buildGraph(edges) {
  const adjacency = new Map();
  for (const edge of edges) {
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, []);
    }
    adjacency.get(edge.from).push(edge);
  }
  return adjacency;
}

const ALLOWED_OUTGOING_EDGES_BY_TRAVERSAL_KEY = {
  AC_Check__at_bat: new Set(["Dev_Assigned"]),
  AC_Check__stage_3_acceptance: new Set(["AC_Failed", "Stage_4_CI_CD"]),
};

function getTraversableEdges(adjacency, node, traversalKey) {
  const edges = adjacency.get(node) || [];
  const allowedTargets = ALLOWED_OUTGOING_EDGES_BY_TRAVERSAL_KEY[traversalKey];

  if (!allowedTargets) {
    return edges;
  }

  return edges.filter((edge) => allowedTargets.has(edge.to));
}

function enumerateSimplePaths(edges) {
  const adjacency = buildGraph(edges);
  const entries = edges.filter((edge) => edge.from === "[*]");
  const exits = new Set(getExitStates(edges));
  const paths = [];

  function dfs(node, traversalKey, visited, pathEdges) {
    if (exits.has(node)) {
      paths.push([...pathEdges]);
      return;
    }

    for (const edge of getTraversableEdges(adjacency, node, traversalKey)) {
      const nextKey = getTraversalStateKey(edge);
      if (edge.to === "[*]" || visited.has(nextKey)) {
        continue;
      }

      visited.add(nextKey);
      pathEdges.push(edge);
      dfs(edge.to, nextKey, visited, pathEdges);
      pathEdges.pop();
      visited.delete(nextKey);
    }
  }

  for (const entryEdge of entries) {
    const visited = new Set([entryEdge.to]);
    dfs(entryEdge.to, entryEdge.to, visited, [entryEdge]);
  }

  return paths;
}

function getTransitionIndex(catalog) {
  const byEdge = new Map();
  for (const transition of catalog.transitions) {
    byEdge.set(`${transition.fromState}-->${transition.toState}`, transition);
  }
  return byEdge;
}

function getWorkflowName(workflowPath) {
  return (
    WORKFLOW_NAME_BY_PATH[workflowPath] ||
    path.basename(workflowPath || "workflow")
  );
}

function isIncompleteEntry(pathEdges) {
  return pathEdges.some((edge) =>
    ["Validation_Failed", "Needs_Details", "Auto_Abandoned"].includes(edge.to),
  );
}

function deriveTitleDescriptor(pathEdges, exitState) {
  const parts = [];
  for (const edge of pathEdges) {
    const name = TITLE_STATE_NAMES[edge.to];
    if (!name || edge.to === exitState || parts.includes(name)) {
      continue;
    }
    parts.push(name);
  }
  return parts.length > 0 ? parts.join(" / ") : "Direct";
}

function getLaneState(pathEdges) {
  return pathEdges.find((edge) => LANE_STATES.includes(edge.to))?.to || null;
}

function getReviewOutcomeFamily(pathEdges, exitState) {
  if (exitState === "Manual_Completed") {
    return "manual_close";
  }

  if (exitState === "Closed_Failed") {
    return "escalated_reject";
  }

  if (pathEdges.some((edge) => edge.to === "Stage_5_Escalated")) {
    return "escalated_approve";
  }

  if (pathEdges.some((edge) => edge.to === "AI_Approved_R3")) {
    return "ai_round_3_pass";
  }

  if (pathEdges.some((edge) => edge.to === "AI_Approved_R2")) {
    return "ai_round_2_pass";
  }

  if (pathEdges.some((edge) => edge.to === "AI_Approved_R1")) {
    return "ai_round_1_pass";
  }

  return null;
}

function deriveWorkflowPathFamily(pathEdges) {
  const exitState = pathEdges[pathEdges.length - 1]?.to;
  const laneState = getLaneState(pathEdges);

  if (exitState === "Auto_Abandoned") {
    return {
      key: `${exitState}|validation_failure`,
      descriptor: PATH_DESCRIPTOR_BY_FAMILY.validation_failure,
    };
  }

  if (exitState === "Closed_Rejected") {
    return {
      key: `${exitState}|triage_rejected`,
      descriptor: PATH_DESCRIPTOR_BY_FAMILY.triage_rejected,
    };
  }

  const reviewOutcome = getReviewOutcomeFamily(pathEdges, exitState);
  if (!laneState || !reviewOutcome) {
    return {
      key: `${exitState}|${deriveTitleDescriptor(pathEdges, exitState)}`,
      descriptor: deriveTitleDescriptor(pathEdges, exitState),
    };
  }

  return {
    key: `${exitState}|${laneState}|${reviewOutcome}`,
    descriptor: `${TITLE_STATE_NAMES[laneState]}, ${PATH_DESCRIPTOR_BY_FAMILY[reviewOutcome]}`,
  };
}

function collapseToWorkflowPaths(pathEdgesList) {
  const families = new Map();

  for (const pathEdges of pathEdgesList) {
    const family = deriveWorkflowPathFamily(pathEdges);
    const current = families.get(family.key);

    if (!current || pathEdges.length < current.pathEdges.length) {
      families.set(family.key, { family, pathEdges });
    }
  }

  return Array.from(families.values())
    .sort((left, right) => {
      if (left.pathEdges.length !== right.pathEdges.length) {
        return left.pathEdges.length - right.pathEdges.length;
      }

      return left.family.key.localeCompare(right.family.key);
    })
    .map(({ family, pathEdges }) => ({ family, pathEdges }));
}

function countWorkflowPaths(edges) {
  return collapseToWorkflowPaths(enumerateSimplePaths(edges)).length;
}

function buildImplementationPrompt(pathId, pathNumber) {
  return {
    id: `impl-${pathId}`,
    summary: `Create a deterministic file when path ${pathNumber} reaches At_Bat.`,
    executor: "harness",
    applyWhenState: "At_Bat",
    promptText: `Create the file tmp/${pathId}.txt with the exact contents '${pathId} reached At_Bat'.`,
    steps: [
      {
        type: "create_file",
        path: `tmp/${pathId}.txt`,
        content: `${pathId} reached At_Bat`,
      },
      {
        type: "git_commit",
        message: `test: execute implementation prompt for ${pathId}`,
      },
      {
        type: "open_pr",
        title: `test: execute implementation prompt for ${pathId}`,
        body: "Closes #<issue-number>",
      },
    ],
  };
}

function deriveActor(transition) {
  if (transition.transitionClass === "A") {
    return "harness";
  }
  return transition.actingRole || "harness";
}

function deriveExpected(step, pathId, transition, currentVisibleLabel) {
  const expected = {};

  if (step.stepNumber === 1) {
    expected.issueState = "open";
    return { expected, nextVisibleLabel: currentVisibleLabel };
  }

  if (transition.owningImplementation.workflow) {
    expected.workflow = {
      name: getWorkflowName(transition.owningImplementation.workflow),
      conclusion: "success",
    };
  }

  const nextLabel = LABEL_BY_STATE[step.toState];
  if (nextLabel) {
    expected.labelsPresent = [nextLabel];
    if (currentVisibleLabel && currentVisibleLabel !== nextLabel) {
      expected.labelsAbsent = [currentVisibleLabel];
    }
    currentVisibleLabel = nextLabel;
  }

  if (
    [
      "Auto_Abandoned",
      "Closed_Rejected",
      "Closed_Failed",
      "Manual_Completed",
      "Close_Issue",
    ].includes(step.toState)
  ) {
    expected.issueState = "closed";
  }

  if (step.toState === "PR_Created" || step.toState === "Dev_In_Progress") {
    expected.repositoryArtifacts = [`tmp/${pathId}.txt`];
  }

  if (
    transition.testStrategy ===
    "simulate_pm_triage_entry_and_assert_pm_review_artifact"
  ) {
    expected.commentContains = "PM review";
  }

  if (
    transition.expectedObservableEffects.some((effect) =>
      effect.includes("rejection artifact"),
    )
  ) {
    expected.commentContains = "rejected";
  }

  return { expected, nextVisibleLabel: currentVisibleLabel };
}

function deriveActorInstruction(step, transition) {
  if (step.stepNumber === 1 || transition.transitionClass === "A") {
    return null;
  }

  const actor = deriveActor(transition);
  return {
    actor,
    whenStep: step.stepNumber,
    action: `advance_to_${step.toState.toLowerCase()}`,
    summary: `Advance the path from ${step.fromState} to ${step.toState} via '${step.trigger}'.`,
    payload: {
      transitionId: transition.transitionId,
    },
  };
}

function buildPathSteps(pathEdges, transitionIndex, pathId) {
  const steps = [];
  const actorInstructions = [];
  let currentVisibleLabel = "on the bench";

  for (const [index, edge] of pathEdges.entries()) {
    const stepNumber = index + 1;

    if (edge.from === "[*]") {
      steps.push({
        stepNumber,
        fromState: edge.from,
        trigger: isIncompleteEntry(pathEdges)
          ? "user creates incomplete issue"
          : "user creates valid issue",
        toState: edge.to,
        transitionClass: "A",
        verificationMode: "real workflow",
        actor: "submitter",
        expected: {
          issueState: "open",
        },
        actions: [],
        notes: isIncompleteEntry(pathEdges)
          ? "Fixture issue body should be intentionally incomplete to exercise the validation branch."
          : "Fixture issue should be valid enough to enter the intended path.",
      });
      continue;
    }

    const transition = transitionIndex.get(`${edge.from}-->${edge.to}`);
    if (!transition) {
      throw new Error(
        `Missing transition metadata for edge ${edge.from}-->${edge.to}`,
      );
    }

    const step = {
      stepNumber,
      fromState: edge.from,
      trigger: edge.trigger,
      toState: edge.to,
      transitionClass: transition.transitionClass,
      verificationMode: transition.verificationMode,
      actor: deriveActor(transition),
      expected: {},
      actions: [],
      notes: transition.expectedObservableEffects.join("; "),
    };

    const expectedResult = deriveExpected(
      step,
      pathId,
      transition,
      currentVisibleLabel,
    );
    step.expected = expectedResult.expected;
    currentVisibleLabel = expectedResult.nextVisibleLabel;

    if (transition.transitionClass === "C") {
      step.actions.push({
        type: "create_comment",
        body: `Harness simulation: ${edge.from} -> ${edge.to} via '${edge.trigger}'.`,
      });
    }

    const actorInstruction = deriveActorInstruction(step, transition);
    if (actorInstruction) {
      actorInstructions.push(actorInstruction);
    }

    steps.push(step);
  }

  return { steps, actorInstructions };
}

function countTransitionClasses(steps) {
  return steps.reduce(
    (summary, step) => {
      if (step.transitionClass === "A") {
        summary.real += 1;
      }
      if (step.transitionClass === "B") {
        summary.manual += 1;
      }
      if (step.transitionClass === "C") {
        summary.simulated += 1;
      }
      return summary;
    },
    { real: 0, manual: 0, simulated: 0 },
  );
}

function buildActorsSummary(steps) {
  const actors = new Set(steps.map((step) => step.actor));
  return {
    submitter: actors.has("submitter") ? "simulated" : "none",
    maintainer: actors.has("maintainer") ? "simulated" : "none",
    harness: "simulated",
  };
}

function generatePathTestSeed(options = {}) {
  const diagramPath = options.diagramPath || DEFAULT_DIAGRAM_PATH;
  const markdown = readFile(diagramPath);
  const mermaid = extractMermaidBlock(markdown);
  const edges = parseMermaidTransitions(mermaid);
  const workflowPaths = collapseToWorkflowPaths(enumerateSimplePaths(edges));
  const catalog = generateTransitionCatalog({ diagramPath });
  const transitionIndex = getTransitionIndex(catalog);

  const paths = workflowPaths.map(({ family, pathEdges }, index) => {
    const pathNumber = index + 1;
    const pathId = `path-${String(pathNumber).padStart(3, "0")}`;
    const exitState = pathEdges[pathEdges.length - 1].to;
    const { steps, actorInstructions } = buildPathSteps(
      pathEdges,
      transitionIndex,
      pathId,
    );
    const reachesAtBat = steps.some((step) => step.toState === "At_Bat");
    const implementationPrompt = reachesAtBat
      ? buildImplementationPrompt(pathId, pathNumber)
      : null;

    if (implementationPrompt) {
      const atBatStep = steps.find((step) => step.toState === "At_Bat");
      actorInstructions.push({
        actor: "harness",
        whenStep: atBatStep.stepNumber,
        action: "execute_implementation_prompt",
        summary: `Run the standard At_Bat implementation prompt for ${pathId}.`,
        payload: {
          implementationPromptId: implementationPrompt.id,
        },
      });
    }

    return {
      pathId,
      pathNumber,
      title: `[Workflow Path Test] ${exitState} via ${family.descriptor}`,
      labels: ["workflow-path-test", "on the bench"],
      entryState: "Issue_Created",
      exitState,
      closeReason: CLOSE_REASON_BY_EXIT[exitState] || "not_planned",
      transitionClassSummary: countTransitionClasses(steps),
      actors: buildActorsSummary(steps),
      implementationPrompt,
      actorInstructions,
      steps,
    };
  });

  return {
    schemaVersion: 1,
    generated: new Date().toISOString().slice(0, 10),
    generatedBy: "scripts/generate-path-test-seed.js",
    sourceDiagram: ".github/workflows/ISSUE_LIFECYCLE_STATE_DIAGRAM.md",
    sourceTransitionCatalog: "docs/transition-catalog.json",
    description:
      "Generated workflow path seed definitions derived from the lifecycle state diagram.",
    totalPaths: paths.length,
    paths,
  };
}

function writePathTestSeed(outputPath = DEFAULT_OUTPUT_PATH) {
  const seed = generatePathTestSeed();
  fs.writeFileSync(outputPath, `${JSON.stringify(seed, null, 2)}\n`, "utf8");
  return seed;
}

function main() {
  const seed = writePathTestSeed();
  console.log(
    `Generated ${seed.totalPaths} path definitions in docs/path-test-issues.seed.json`,
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_DIAGRAM_PATH,
  DEFAULT_OUTPUT_PATH,
  enumerateSimplePaths,
  collapseToWorkflowPaths,
  countWorkflowPaths,
  generatePathTestSeed,
  writePathTestSeed,
};
