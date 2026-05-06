import { describe, test, expect } from "vitest";
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);
const {
  generateTransitionCatalog,
} = require("../scripts/generate-transition-catalog.js");
const {
  extractMermaidBlock,
  parseMermaidTransitions,
} = require("../scripts/validate-path-artifacts.js");

describe("transition catalog generation", () => {
  test("catalog covers every non-pseudostate edge in the current diagram", () => {
    const markdown = fs.readFileSync(
      ".github/workflows/ISSUE_LIFECYCLE_STATE_DIAGRAM.md",
      "utf8",
    );
    const edges = parseMermaidTransitions(extractMermaidBlock(markdown)).filter(
      (edge) => edge.from !== "[*]" && edge.to !== "[*]",
    );
    const catalog = generateTransitionCatalog();

    expect(catalog.transitions).toHaveLength(edges.length);
  });

  test("representative transitions derive the expected rule families", () => {
    const catalog = generateTransitionCatalog();
    const byId = new Map(
      catalog.transitions.map((transition) => [
        transition.transitionId,
        transition,
      ]),
    );

    expect(byId.get("issue-created_to_auto-validation")).toMatchObject({
      transitionClass: "A",
      actingRole: "repository-automation",
      owningImplementation: {
        workflow: ".github/workflows/issue-intake.yml",
        script: "scripts/issue-intake.js",
      },
    });

    expect(byId.get("backlog_to_pm-triage")).toMatchObject({
      transitionClass: "B",
      actingRole: "maintainer",
      verificationMode: "manual contract",
    });

    expect(byId.get("rebalance-deck_to_at-bat")).toMatchObject({
      transitionClass: "A",
      owningImplementation: {
        workflow: ".github/workflows/rebalance-on-close.yml",
        script: "scripts/rebalance-lanes.js",
      },
      implementationPromptPolicy: "standard-at-bat-prompt",
    });

    expect(byId.get("at-bat_to_manual-close-check")).toMatchObject({
      transitionClass: "C",
      actingRole: "harness",
      verificationMode: "simulated",
      implementationPromptPolicy: "standard-at-bat-prompt",
    });

    expect(byId.get("pr-created_to_stage-1-pr-format")).toMatchObject({
      transitionClass: "A",
      owningImplementation: {
        workflow: ".github/workflows/ai-code-review.yml",
        script: null,
      },
    });

    expect(byId.get("review-decision_to_stage-6-merge")).toMatchObject({
      transitionClass: "B",
      actingRole: "maintainer",
    });
  });

  test("checked-in catalog remains the generated output", () => {
    const expected = `${JSON.stringify(generateTransitionCatalog(), null, 2)}\n`;
    const actual = fs.readFileSync("docs/transition-catalog.json", "utf8");

    expect(actual).toBe(expected);
  });
});
