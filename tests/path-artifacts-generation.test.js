import { describe, test, expect } from "vitest";
import { createRequire } from "module";
import fs from "fs";

const require = createRequire(import.meta.url);
const {
  generatePathArtifacts,
} = require("../scripts/generate-path-artifacts.js");
const {
  generateTransitionCatalog,
} = require("../scripts/generate-transition-catalog.js");
const {
  generatePathTestSeed,
} = require("../scripts/generate-path-test-seed.js");

describe("combined path artifact generation", () => {
  test("combined generator reports both artifact counts", () => {
    const result = generatePathArtifacts();

    expect(result.transitionCount).toBe(82);
    expect(result.pathCount).toBe(26);
  });

  test("checked-in catalog and seed match one combined generation pass", () => {
    const expectedCatalog = `${JSON.stringify(generateTransitionCatalog(), null, 2)}\n`;
    const expectedSeed = `${JSON.stringify(generatePathTestSeed(), null, 2)}\n`;

    expect(fs.readFileSync("docs/transition-catalog.json", "utf8")).toBe(
      expectedCatalog,
    );
    expect(fs.readFileSync("docs/path-test-issues.seed.json", "utf8")).toBe(
      expectedSeed,
    );
  });
});
