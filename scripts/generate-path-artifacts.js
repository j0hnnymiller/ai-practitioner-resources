const path = require("path");

const {
  DEFAULT_OUTPUT_PATH: DEFAULT_CATALOG_OUTPUT_PATH,
  writeTransitionCatalog,
} = require("./generate-transition-catalog.js");
const {
  DEFAULT_OUTPUT_PATH: DEFAULT_SEED_OUTPUT_PATH,
  writePathTestSeed,
} = require("./generate-path-test-seed.js");

function generatePathArtifacts(options = {}) {
  const catalogOutputPath =
    options.catalogOutputPath || DEFAULT_CATALOG_OUTPUT_PATH;
  const seedOutputPath = options.seedOutputPath || DEFAULT_SEED_OUTPUT_PATH;

  const catalog = writeTransitionCatalog(catalogOutputPath);
  const seed = writePathTestSeed(seedOutputPath);

  return {
    generatedAt: new Date().toISOString(),
    catalogOutputPath: path.relative(process.cwd(), catalogOutputPath),
    seedOutputPath: path.relative(process.cwd(), seedOutputPath),
    transitionCount: catalog.transitions.length,
    pathCount: seed.totalPaths,
  };
}

function main() {
  const result = generatePathArtifacts();
  console.log(
    `Generated ${result.transitionCount} transitions and ${result.pathCount} paths from one diagram snapshot.`,
  );
  console.log(`Catalog: ${result.catalogOutputPath}`);
  console.log(`Seed: ${result.seedOutputPath}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  generatePathArtifacts,
};
