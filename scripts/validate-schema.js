#!/usr/bin/env node

/**
 * Validate generated resources against JSON schema
 *
 * This script validates the merged resources JSON file against
 * the schema.json file to ensure data integrity before updating the gist.
 */

const Ajv = require("ajv");
const fs = require("fs");
const path = require("path");

// Try to load ajv-formats if available
let addFormats;
try {
  addFormats = require("ajv-formats");
} catch (e) {
  // ajv-formats not available, will skip format validation
  addFormats = null;
}

// File paths
const SCHEMA_PATH = path.join(__dirname, "..", "schema.json");

/**
 * Validate resources against schema
 */
function validateSchema(resourcesFilePath = null) {
  console.log("✅ Validating resources against schema...");

  // Read schema
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error("❌ Error: Schema file not found at:", SCHEMA_PATH);
    process.exit(1);
  }

  // Determine resources file path
  const RESOURCES_PATH =
    resourcesFilePath || path.join("/tmp", "merged-resources.json");

  // Read resources
  if (!fs.existsSync(RESOURCES_PATH)) {
    console.error("❌ Error: Resources file not found at:", RESOURCES_PATH);
    process.exit(1);
  }

  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const resources = JSON.parse(fs.readFileSync(RESOURCES_PATH, "utf8"));

  console.log("   Schema loaded from:", SCHEMA_PATH);
  console.log("   Resources loaded from:", RESOURCES_PATH);

  // Create AJV instance and add formats support
  const ajv = new Ajv({ allErrors: true });
  if (addFormats) {
    addFormats(ajv);
  }

  // Compile and validate
  const validate = ajv.compile(schema);
  const valid = validate(resources);

  if (!valid) {
    console.error("❌ Schema validation failed:");
    console.error(JSON.stringify(validate.errors, null, 2));
    process.exit(1);
  }

  console.log("✅ Schema validation passed");
  console.log(`   Validated ${resources.resources?.length || 0} resources`);

  // Additional checks
  let warnings = 0;

  // Check for duplicate resources
  const seen = new Set();
  resources.resources?.forEach((resource, index) => {
    const key = `${resource.title}||${resource.source}`;
    if (seen.has(key)) {
      console.warn(
        `⚠️  Warning: Duplicate resource at index ${index}: ${resource.title}`
      );
      warnings++;
    }
    seen.add(key);
  });

  // Check risk coverage structure
  resources.resources?.forEach((resource, index) => {
    if (!resource.risk_coverage) {
      console.warn(
        `⚠️  Warning: Missing risk_coverage at index ${index}: ${resource.title}`
      );
      warnings++;
    }
    if (resource.overall_score < 60 || resource.overall_score > 100) {
      console.warn(
        `⚠️  Warning: Invalid overall_score at index ${index}: ${resource.overall_score} (${resource.title})`
      );
      warnings++;
    }
    if (resource.highest_score < 60 || resource.highest_score > 100) {
      console.warn(
        `⚠️  Warning: Invalid highest_score at index ${index}: ${resource.highest_score} (${resource.title})`
      );
      warnings++;
    }
  });

  if (warnings > 0) {
    console.log(`\n⚠️  Found ${warnings} warning(s), but validation passed`);
  }

  return true;
}

// Main execution
function main() {
  console.log("🚀 Validate Schema Script\n");

  // Get file path from command line argument
  const filePath = process.argv[2];
  if (filePath) {
    const fullPath = path.resolve(filePath);
    console.log("📁 Validating file:", fullPath);
    validateSchema(fullPath);
  } else {
    validateSchema();
  }

  console.log("\n✨ Done!\n");
}

main();
