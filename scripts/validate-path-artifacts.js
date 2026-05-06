const fs = require("fs");
const path = require("path");
const { countWorkflowPaths } = require("./generate-path-test-seed.js");
const {
  extractMermaidBlock,
  parseMermaidTransitions,
  buildGraph,
  getEntryStates,
  getExitStates,
  getTraversalStateKey,
} = require("./lib/state-diagram.js");

const DEFAULT_DIAGRAM_PATH = path.resolve(
  __dirname,
  "..",
  ".github",
  "workflows",
  "ISSUE_LIFECYCLE_STATE_DIAGRAM.md",
);
const DEFAULT_SEED_PATH = path.resolve(
  __dirname,
  "..",
  "docs",
  "path-test-issues.seed.json",
);
const DEFAULT_CATALOG_PATH = path.resolve(
  __dirname,
  "..",
  "docs",
  "transition-catalog.json",
);

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function loadSeed(seedPath = DEFAULT_SEED_PATH) {
  return JSON.parse(readFile(seedPath));
}

function loadCatalog(catalogPath = DEFAULT_CATALOG_PATH) {
  return JSON.parse(readFile(catalogPath));
}

function buildTransitionIndex(catalog) {
  const byEdge = new Map();
  for (const transition of catalog.transitions || []) {
    byEdge.set(`${transition.fromState}-->${transition.toState}`, transition);
  }
  return byEdge;
}

function validateSeedPathsAgainstEdges(seed, edges, catalog) {
  const { edgeSet } = buildGraph(edges);
  const exits = new Set(getExitStates(edges));
  const diagramPathCount = countWorkflowPaths(edges);
  const issues = [];
  const transitionIndex = catalog ? buildTransitionIndex(catalog) : new Map();

  for (const pathDef of seed.paths || []) {
    const steps = pathDef.steps || [];

    if (steps.length === 0) {
      issues.push(`Path ${pathDef.pathId} has no steps`);
      continue;
    }

    const visited = new Set();
    let previousTo = null;

    for (const step of steps) {
      const edgeKey = `${step.fromState}-->${step.toState}`;
      const traversalStateKey = getTraversalStateKey({
        from: step.fromState,
        to: step.toState,
      });
      if (!edgeSet.has(edgeKey)) {
        issues.push(
          `Path ${pathDef.pathId} step ${step.stepNumber} uses edge not present in diagram: ${edgeKey}`,
        );
      }

      if (
        catalog &&
        step.fromState !== "[*]" &&
        !transitionIndex.has(edgeKey)
      ) {
        issues.push(
          `Path ${pathDef.pathId} step ${step.stepNumber} is missing transition catalog metadata for edge ${edgeKey}`,
        );
      }

      if (previousTo && previousTo !== step.fromState) {
        issues.push(
          `Path ${pathDef.pathId} step ${step.stepNumber} is disconnected: expected fromState ${previousTo} but found ${step.fromState}`,
        );
      }

      if (visited.has(traversalStateKey) && step.toState !== "[*]") {
        issues.push(
          `Path ${pathDef.pathId} repeats state ${step.toState}; seed paths should stay simple`,
        );
      }

      visited.add(step.fromState);
      if (step.toState !== "[*]") {
        visited.add(traversalStateKey);
      }
      previousTo = step.toState;
    }

    if (
      steps[0].fromState === "[*]" &&
      pathDef.entryState !== steps[0].toState
    ) {
      issues.push(
        `Path ${pathDef.pathId} entryState ${pathDef.entryState} does not align with first step`,
      );
    }

    if (pathDef.exitState !== steps[steps.length - 1].toState) {
      issues.push(
        `Path ${pathDef.pathId} exitState ${pathDef.exitState} does not match final step target ${steps[steps.length - 1].toState}`,
      );
    }

    if (!exits.has(pathDef.exitState)) {
      issues.push(
        `Path ${pathDef.pathId} exitState ${pathDef.exitState} is not a terminal state in the diagram`,
      );
    }
  }

  return {
    diagramPathCount,
    seededPathCount: (seed.paths || []).length,
    issues,
  };
}

function validateGeneratedArtifacts(
  catalogPath = DEFAULT_CATALOG_PATH,
  seedPath = DEFAULT_SEED_PATH,
) {
  const {
    generateTransitionCatalog,
  } = require("./generate-transition-catalog.js");
  const { generatePathTestSeed } = require("./generate-path-test-seed.js");

  const catalogIssues = [];
  const seedIssues = [];
  const actualCatalogText = readFile(catalogPath);
  const actualSeedText = readFile(seedPath);
  const expectedCatalogText = `${JSON.stringify(generateTransitionCatalog(), null, 2)}\n`;
  const expectedSeedText = `${JSON.stringify(generatePathTestSeed(), null, 2)}\n`;

  if (actualCatalogText !== expectedCatalogText) {
    catalogIssues.push(
      "Checked-in transition catalog does not match the current generated output; run node scripts/generate-path-artifacts.js",
    );
  }

  if (actualSeedText !== expectedSeedText) {
    seedIssues.push(
      "Checked-in path seed does not match the current generated output; run node scripts/generate-path-artifacts.js",
    );
  }

  return {
    catalogIssues,
    seedIssues,
  };
}

function getSyncReport(options = {}) {
  const diagramPath = options.diagramPath || DEFAULT_DIAGRAM_PATH;
  const seedPath = options.seedPath || DEFAULT_SEED_PATH;
  const catalogPath = options.catalogPath || DEFAULT_CATALOG_PATH;
  const markdown = readFile(diagramPath);
  const mermaid = extractMermaidBlock(markdown);
  const edges = parseMermaidTransitions(mermaid);
  const seed = loadSeed(seedPath);
  const catalog = loadCatalog(catalogPath);
  const validation = validateSeedPathsAgainstEdges(seed, edges, catalog);
  const generatedArtifactValidation = validateGeneratedArtifacts(
    catalogPath,
    seedPath,
  );
  const issues = [
    ...validation.issues,
    ...generatedArtifactValidation.catalogIssues,
    ...generatedArtifactValidation.seedIssues,
  ];

  return {
    diagramPath,
    seedPath,
    catalogPath,
    entryStates: getEntryStates(edges),
    exitStates: getExitStates(edges),
    edgeCount: edges.length,
    diagramPathCount: validation.diagramPathCount,
    seededPathCount: validation.seededPathCount,
    transitionCount: (catalog.transitions || []).length,
    catalogIssues: generatedArtifactValidation.catalogIssues,
    seedGenerationIssues: generatedArtifactValidation.seedIssues,
    issues,
  };
}

function main() {
  const report = getSyncReport();

  console.log(`Diagram edges: ${report.edgeCount}`);
  console.log(`Catalog transitions: ${report.transitionCount}`);
  console.log(`Diagram workflow paths: ${report.diagramPathCount}`);
  console.log(`Seeded paths: ${report.seededPathCount}`);
  console.log(`Entry states: ${report.entryStates.join(", ")}`);
  console.log(`Exit states: ${report.exitStates.join(", ")}`);

  if (report.issues.length > 0) {
    console.error("\nPath artifact drift issues:");
    for (const issue of report.issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log("\nPath artifacts align with the current diagram snapshot.");
}

if (require.main === module) {
  main();
}

module.exports = {
  extractMermaidBlock,
  parseMermaidTransitions,
  getEntryStates,
  getExitStates,
  loadCatalog,
  validateSeedPathsAgainstEdges,
  validateGeneratedArtifacts,
  getSyncReport,
  main,
};
