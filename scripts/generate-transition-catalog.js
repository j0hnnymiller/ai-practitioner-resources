const fs = require("fs");
const path = require("path");

const {
  extractMermaidBlock,
  parseMermaidTransitions,
} = require("./lib/state-diagram.js");

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
  "transition-catalog.json",
);

const STATE_GROUPS = {
  intake: new Set([
    "Issue_Created",
    "Auto_Validation",
    "Validation_Failed",
    "Needs_Details",
    "Backlog",
    "Auto_Abandoned",
  ]),
  laneRouting: new Set([
    "Backlog",
    "PM_Triage",
    "Triage_Rejected",
    "Closed_Rejected",
    "Assigned_Lane",
    "On_Bench",
    "In_Hole",
    "On_Deck",
    "At_Bat",
  ]),
  laneMonitoring: new Set([
    "Bench_Check",
    "Hole_Check",
    "Deck_Check",
    "Rebalance_Bench",
    "Rebalance_Hole",
    "Rebalance_Deck",
  ]),
  issueWork: new Set([
    "At_Bat",
    "AC_Check",
    "Needs_Prep",
    "Dev_Assigned",
    "Dev_In_Progress",
    "Manual_Close_Check",
    "Manual_Completed",
  ]),
  prAutomation: new Set([
    "PR_Created",
    "Stage_1_PR_Format",
    "Stage_1_Fail",
    "Needs_PR_Update",
    "Stage_2_AI_Review",
    "Review_R1",
    "Check_R1",
    "AI_Comments_R1",
    "Auto_Fix_Attempt",
    "Re_Review_R1",
    "Check_R2",
    "AI_Comments_R2",
    "Auto_Fix_Attempt_2",
    "Re_Review_R2",
    "Check_R3",
    "AI_Comments_R3",
    "AI_Approved_R1",
    "AI_Approved_R2",
    "AI_Approved_R3",
    "Escalation_Decision",
    "Auto_Assign_Maintainer",
    "Stage_3_Acceptance",
    "AC_Failed",
    "AC_Needs_Update",
    "Stage_4_CI_CD",
    "CI_Check",
    "CI_Failed",
    "CI_Needs_Fix",
    "Stage_5_Human",
    "Stage_5_Escalated",
    "Maintainer_Review",
    "Review_Decision",
    "Approval_Rejected",
    "Dev_Updates",
    "Maintainer_Review_Esc",
    "Review_Decision_Esc",
    "Approval_Rejected_Esc",
    "PR_Closed_Rejected",
    "Closed_Failed",
    "Stage_6_Merge",
    "Auto_Merge",
    "Merged_Success",
    "Issue_Complete",
    "Close_Issue",
  ]),
};

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function slugify(value) {
  return String(value)
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function hasState(groupName, state) {
  return STATE_GROUPS[groupName].has(state);
}

function makeCatalogEntry(edge, derived) {
  return {
    transitionId: `${slugify(edge.from)}_to_${slugify(edge.to)}`,
    fromState: edge.from,
    toState: edge.to,
    trigger: edge.trigger,
    triggerType: derived.triggerType,
    transitionClass: derived.transitionClass,
    actingRole: derived.actingRole,
    verificationMode: derived.verificationMode,
    owningImplementation: derived.owningImplementation,
    testStrategy: derived.testStrategy,
    requiredFixtureType: derived.requiredFixtureType,
    expectedObservableEffects: derived.expectedObservableEffects,
    implementationPromptPolicy: derived.implementationPromptPolicy,
  };
}

function deriveIssueIntake(edge) {
  if (edge.from === "Needs_Details" && edge.to === "Auto_Abandoned") {
    return {
      triggerType: "schedule|workflow_dispatch",
      transitionClass: "A",
      actingRole: "repository-automation",
      verificationMode: "real workflow",
      owningImplementation: {
        workflow: ".github/workflows/stale-issues.yml",
        script: null,
      },
      testStrategy:
        "trigger_stale_workflow_on_eligible_issue_and_observe_abandonment",
      requiredFixtureType: "aged-test-issue",
      expectedObservableEffects: [
        "auto-abandoned label applied",
        "issue closed after inactivity policy is met",
      ],
      implementationPromptPolicy: null,
    };
  }

  return {
    triggerType:
      edge.from === "Needs_Details" ? "issues.edited" : "issues.opened",
    transitionClass: "A",
    actingRole:
      edge.from === "Needs_Details" ? "submitter" : "repository-automation",
    verificationMode: "real workflow",
    owningImplementation: {
      workflow: ".github/workflows/issue-intake.yml",
      script: "scripts/issue-intake.js",
    },
    testStrategy: `observe_issue_intake_for_${slugify(edge.from)}_to_${slugify(edge.to)}`,
    requiredFixtureType: "test-issue",
    expectedObservableEffects: [
      "issue-intake workflow run exists",
      edge.to === "Needs_Details"
        ? "needs-details artifact is posted"
        : `state advances toward ${edge.to}`,
    ],
    implementationPromptPolicy: null,
  };
}

function deriveLaneTransition(edge) {
  if (edge.from === "Backlog" && edge.to === "PM_Triage") {
    return {
      triggerType: "maintainer-triage",
      transitionClass: "B",
      actingRole: "maintainer",
      verificationMode: "manual contract",
      owningImplementation: {
        workflow: null,
        script: "scripts/pm-review.js",
      },
      testStrategy: "simulate_pm_triage_entry_and_assert_pm_review_artifact",
      requiredFixtureType: "test-issue",
      expectedObservableEffects: ["PM review artifact exists"],
      implementationPromptPolicy: null,
    };
  }

  if (edge.from === "PM_Triage" || edge.from === "Assigned_Lane") {
    return {
      triggerType: "maintainer-triage-decision",
      transitionClass: "B",
      actingRole: "maintainer",
      verificationMode: "manual contract",
      owningImplementation: {
        workflow: null,
        script: "scripts/pm-review.js",
      },
      testStrategy: `simulate_pm_triage_decision_for_${slugify(edge.to)}`,
      requiredFixtureType: "test-issue",
      expectedObservableEffects: [
        edge.to === "Triage_Rejected"
          ? "rejection artifact is recorded"
          : `lane assignment artifact reflects ${edge.to}`,
      ],
      implementationPromptPolicy:
        edge.to === "At_Bat" ? "standard-at-bat-prompt" : null,
    };
  }

  if (
    edge.from === "Rebalance_Bench" ||
    edge.from === "Rebalance_Hole" ||
    edge.from === "Rebalance_Deck"
  ) {
    return {
      triggerType: "issues.closed|workflow_dispatch",
      transitionClass: "A",
      actingRole: "repository-automation",
      verificationMode: "real workflow",
      owningImplementation: {
        workflow: ".github/workflows/rebalance-on-close.yml",
        script: "scripts/rebalance-lanes.js",
      },
      testStrategy: `observe_rebalance_transition_for_${slugify(edge.from)}_to_${slugify(edge.to)}`,
      requiredFixtureType: "test-issue",
      expectedObservableEffects: [
        "rebalance workflow run exists",
        `lane artifact reflects ${edge.to}`,
      ],
      implementationPromptPolicy:
        edge.to === "At_Bat" ? "standard-at-bat-prompt" : null,
    };
  }

  return {
    triggerType: "modeled-monitor-state",
    transitionClass: "C",
    actingRole: "harness",
    verificationMode: "simulated",
    owningImplementation: {
      workflow: null,
      script: null,
    },
    testStrategy: `simulate_lane_monitor_transition_for_${slugify(edge.from)}_to_${slugify(edge.to)}`,
    requiredFixtureType: "test-issue",
    expectedObservableEffects: [
      "simulation note recorded for lane-monitor transition",
    ],
    implementationPromptPolicy: null,
  };
}

function deriveIssueWork(edge) {
  if (edge.from === "Dev_Assigned" || edge.from === "Dev_In_Progress") {
    return {
      triggerType:
        edge.to === "PR_Created" ? "pull_request.opened" : "developer-action",
      transitionClass: "B",
      actingRole: "developer",
      verificationMode: "manual contract",
      owningImplementation: {
        workflow: null,
        script: null,
      },
      testStrategy: `simulate_developer_action_for_${slugify(edge.from)}_to_${slugify(edge.to)}`,
      requiredFixtureType: edge.to === "PR_Created" ? "test-pr" : "test-issue",
      expectedObservableEffects: [
        edge.to === "PR_Created"
          ? "test PR exists for the path"
          : `developer artifact reflects ${edge.to}`,
      ],
      implementationPromptPolicy: null,
    };
  }

  if (edge.from === "At_Bat" && edge.to === "Manual_Close_Check") {
    return {
      triggerType: "modeled-manual-close-decision",
      transitionClass: "C",
      actingRole: "harness",
      verificationMode: "simulated",
      owningImplementation: {
        workflow: null,
        script: null,
      },
      testStrategy: "simulate_manual_close_check_after_at_bat",
      requiredFixtureType: "test-issue",
      expectedObservableEffects: [
        "simulation note recorded before manual closure",
      ],
      implementationPromptPolicy: "standard-at-bat-prompt",
    };
  }

  if (edge.from === "Manual_Close_Check" && edge.to === "Manual_Completed") {
    return {
      triggerType: "simulated-close-issue",
      transitionClass: "C",
      actingRole: "harness",
      verificationMode: "simulated",
      owningImplementation: {
        workflow: null,
        script: null,
      },
      testStrategy: "simulate_manual_issue_close_and_record_artifact",
      requiredFixtureType: "test-issue",
      expectedObservableEffects: ["issue closes with completed reason"],
      implementationPromptPolicy: null,
    };
  }

  return {
    triggerType: "modeled-at-bat-progress",
    transitionClass: "C",
    actingRole: edge.to === "Needs_Prep" ? "maintainer" : "harness",
    verificationMode: "simulated",
    owningImplementation: {
      workflow: null,
      script: null,
    },
    testStrategy: `simulate_issue_side_progress_for_${slugify(edge.from)}_to_${slugify(edge.to)}`,
    requiredFixtureType: "test-issue",
    expectedObservableEffects: [
      edge.to === "Dev_Assigned"
        ? "implementation prompt executes when issue reaches At_Bat"
        : `simulation artifact reflects ${edge.to}`,
    ],
    implementationPromptPolicy:
      edge.from === "At_Bat" ? "standard-at-bat-prompt" : null,
  };
}

function derivePrAutomation(edge) {
  if (
    edge.from === "PR_Created" ||
    edge.from === "Stage_1_PR_Format" ||
    edge.from === "Stage_1_Fail"
  ) {
    return {
      triggerType:
        "pull_request.opened|pull_request.synchronize|pull_request.reopened",
      transitionClass: "A",
      actingRole: "repository-automation",
      verificationMode: "real workflow",
      owningImplementation: {
        workflow: ".github/workflows/ai-code-review.yml",
        script: null,
      },
      testStrategy: `observe_ai_review_workflow_for_${slugify(edge.from)}_to_${slugify(edge.to)}`,
      requiredFixtureType: "test-pr",
      expectedObservableEffects: [
        "ai-code-review workflow run exists",
        `review artifact reflects ${edge.to}`,
      ],
      implementationPromptPolicy: null,
    };
  }

  if (
    edge.from === "Needs_PR_Update" ||
    edge.from === "AC_Needs_Update" ||
    edge.from === "CI_Needs_Fix" ||
    edge.from === "Dev_Updates"
  ) {
    return {
      triggerType: "developer-follow-up",
      transitionClass: "B",
      actingRole: "developer",
      verificationMode: "manual contract",
      owningImplementation: {
        workflow: null,
        script: null,
      },
      testStrategy: `simulate_developer_follow_up_for_${slugify(edge.from)}_to_${slugify(edge.to)}`,
      requiredFixtureType: "test-pr",
      expectedObservableEffects: ["follow-up commit or update artifact exists"],
      implementationPromptPolicy: null,
    };
  }

  if (
    edge.from === "Stage_6_Merge" ||
    edge.from === "Auto_Merge" ||
    edge.from === "Merged_Success"
  ) {
    return {
      triggerType:
        edge.from === "Stage_6_Merge"
          ? "pull_request_review.submitted"
          : "github-native-merge",
      transitionClass: edge.from === "Merged_Success" ? "B" : "A",
      actingRole:
        edge.from === "Merged_Success"
          ? "github-native"
          : "repository-automation",
      verificationMode:
        edge.from === "Merged_Success" ? "manual contract" : "real workflow",
      owningImplementation: {
        workflow: ".github/workflows/auto-merge.yml",
        script: null,
      },
      testStrategy: `observe_merge_sequence_for_${slugify(edge.from)}_to_${slugify(edge.to)}`,
      requiredFixtureType: "test-pr",
      expectedObservableEffects: [
        edge.from === "Merged_Success"
          ? "linked issue closure artifact exists"
          : "merge workflow artifact exists",
      ],
      implementationPromptPolicy: null,
    };
  }

  if (
    edge.from === "Stage_5_Human" ||
    edge.from === "Stage_5_Escalated" ||
    edge.from === "Maintainer_Review" ||
    edge.from === "Review_Decision" ||
    edge.from === "Maintainer_Review_Esc" ||
    edge.from === "Review_Decision_Esc" ||
    edge.from === "Approval_Rejected" ||
    edge.from === "Approval_Rejected_Esc"
  ) {
    return {
      triggerType: "pull_request_review.submitted|maintainer-decision",
      transitionClass: "B",
      actingRole: "maintainer",
      verificationMode: "manual contract",
      owningImplementation: {
        workflow:
          edge.to === "Stage_6_Merge"
            ? ".github/workflows/auto-merge.yml"
            : null,
        script: null,
      },
      testStrategy: `simulate_maintainer_review_for_${slugify(edge.from)}_to_${slugify(edge.to)}`,
      requiredFixtureType: "test-pr",
      expectedObservableEffects: [
        "review artifact reflects maintainer decision",
      ],
      implementationPromptPolicy: null,
    };
  }

  if (
    edge.from === "Stage_3_Acceptance" ||
    edge.from === "AC_Failed" ||
    edge.from === "Stage_4_CI_CD" ||
    edge.from === "CI_Check" ||
    edge.from === "CI_Failed"
  ) {
    return {
      triggerType: "workflow-internal-check",
      transitionClass: "A",
      actingRole: "repository-automation",
      verificationMode: "real workflow",
      owningImplementation: {
        workflow: ".github/workflows/ai-code-review.yml",
        script: null,
      },
      testStrategy: `observe_review_gate_for_${slugify(edge.from)}_to_${slugify(edge.to)}`,
      requiredFixtureType: "test-pr",
      expectedObservableEffects: ["workflow artifacts show gate progression"],
      implementationPromptPolicy: null,
    };
  }

  return {
    triggerType: "modeled-review-loop",
    transitionClass: "C",
    actingRole: "harness",
    verificationMode: "simulated",
    owningImplementation: {
      workflow: null,
      script: null,
    },
    testStrategy: `simulate_review_loop_for_${slugify(edge.from)}_to_${slugify(edge.to)}`,
    requiredFixtureType: "test-pr",
    expectedObservableEffects: [
      "simulation artifact records review-loop progression",
    ],
    implementationPromptPolicy: null,
  };
}

function deriveTransition(edge) {
  if (edge.from === "[*]" || edge.to === "[*]") {
    return null;
  }

  if (
    (edge.from === "Backlog" && edge.to === "PM_Triage") ||
    edge.from === "PM_Triage" ||
    edge.from === "Assigned_Lane"
  ) {
    return makeCatalogEntry(edge, deriveLaneTransition(edge));
  }

  if (
    hasState("laneMonitoring", edge.from) ||
    hasState("laneMonitoring", edge.to)
  ) {
    return makeCatalogEntry(edge, deriveLaneTransition(edge));
  }

  if (
    hasState("prAutomation", edge.from) ||
    hasState("prAutomation", edge.to)
  ) {
    return makeCatalogEntry(edge, derivePrAutomation(edge));
  }

  if (hasState("issueWork", edge.from) || hasState("issueWork", edge.to)) {
    return makeCatalogEntry(edge, deriveIssueWork(edge));
  }

  if (hasState("intake", edge.from) || hasState("intake", edge.to)) {
    return makeCatalogEntry(edge, deriveIssueIntake(edge));
  }

  if (hasState("laneRouting", edge.from) || hasState("laneRouting", edge.to)) {
    return makeCatalogEntry(edge, deriveLaneTransition(edge));
  }

  return makeCatalogEntry(edge, {
    triggerType: "unclassified-modeled-transition",
    transitionClass: "C",
    actingRole: "harness",
    verificationMode: "simulated",
    owningImplementation: {
      workflow: null,
      script: null,
    },
    testStrategy: `simulate_${slugify(edge.from)}_to_${slugify(edge.to)}`,
    requiredFixtureType: "test-issue",
    expectedObservableEffects: ["simulation artifact exists"],
    implementationPromptPolicy: null,
  });
}

function generateTransitionCatalog(options = {}) {
  const diagramPath = options.diagramPath || DEFAULT_DIAGRAM_PATH;
  const markdown = readFile(diagramPath);
  const mermaid = extractMermaidBlock(markdown);
  const edges = parseMermaidTransitions(mermaid);
  const transitions = edges.map(deriveTransition).filter(Boolean);

  return {
    schemaVersion: 1,
    generated: new Date().toISOString().slice(0, 10),
    generatedBy: "scripts/generate-transition-catalog.js",
    derivationRulesVersion: 1,
    sourceDiagram: ".github/workflows/ISSUE_LIFECYCLE_STATE_DIAGRAM.md",
    description:
      "Generated transition catalog derived from the lifecycle state diagram using repository-specific action rules.",
    transitionClasses: {
      A: "Real repository automation",
      B: "Manual or GitHub-native transition",
      C: "Diagram-only or simulated transition",
    },
    transitions,
  };
}

function writeTransitionCatalog(outputPath = DEFAULT_OUTPUT_PATH) {
  const catalog = generateTransitionCatalog();
  fs.writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  return catalog;
}

function main() {
  const catalog = writeTransitionCatalog();
  console.log(
    `Generated ${catalog.transitions.length} transitions in docs/transition-catalog.json`,
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_DIAGRAM_PATH,
  DEFAULT_OUTPUT_PATH,
  deriveTransition,
  generateTransitionCatalog,
  writeTransitionCatalog,
};
