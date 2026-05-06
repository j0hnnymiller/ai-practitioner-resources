import { describe, test, expect } from "vitest";
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);
const {
  generatePathTestSeed,
} = require("../scripts/generate-path-test-seed.js");

describe("path seed generation", () => {
  test("generated seed count matches the current workflow path count", () => {
    const seed = generatePathTestSeed();
    expect(seed.totalPaths).toBe(26);
    expect(seed.paths).toHaveLength(26);
  });

  test("generated paths include implementation prompts for At_Bat paths", () => {
    const seed = generatePathTestSeed();
    const atBatPaths = seed.paths.filter((path) =>
      path.steps.some((step) => step.toState === "At_Bat"),
    );

    expect(atBatPaths.length).toBeGreaterThan(0);
    expect(atBatPaths.every((path) => path.implementationPrompt)).toBe(true);
  });

  test("checked-in seed file remains the generated output", () => {
    const generatedSeed = generatePathTestSeed();
    const actual = fs.readFileSync("docs/path-test-issues.seed.json", "utf8");

    expect(actual).toBe(`${JSON.stringify(generatedSeed, null, 2)}\n`);
  });
});
