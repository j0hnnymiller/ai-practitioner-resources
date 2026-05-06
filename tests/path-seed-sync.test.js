import { describe, test, expect } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { getSyncReport } = require("../scripts/validate-path-artifacts.js");

describe("path seed sync", () => {
  test("diagram still yields the expected number of workflow paths", () => {
    const report = getSyncReport();
    expect(report.diagramPathCount).toBe(26);
  });

  test("seeded paths use edges that still exist in the current diagram", () => {
    const report = getSyncReport();
    expect(report.issues).toEqual([]);
  });

  test("checked-in generated artifacts stay aligned with the current diagram snapshot", () => {
    const report = getSyncReport();
    expect(report.catalogIssues).toEqual([]);
    expect(report.seedGenerationIssues).toEqual([]);
    expect(report.transitionCount).toBe(82);
  });

  test("seed remains intentionally partial until full migration completes", () => {
    const report = getSyncReport();
    expect(report.seededPathCount).toBe(report.diagramPathCount);
    expect(report.seededPathCount).toBe(26);
  });
});
