#!/usr/bin/env node

/**
 * Remove a test issue from the production project
 * Usage: node scripts/remove-from-production.js <issue-number>
 */

const {
  getIssueNodeId,
  getProjectIssues,
  removeIssueFromProject,
} = require("./lib/graphql-helpers.js");

const PRODUCTION_PROJECT_ID = "PVT_kwHOAV5oK84BWqcj"; // Project #4: "AI Practitioner Resources"
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "j0hnnymiller";
const REPO = "ai-practitioner-resources";

async function removeFromProduction(issueNumber) {
  try {
    console.log(`\n🔍 Looking up issue #${issueNumber}...`);

    // Get the issue's node ID
    const issueNodeId = await getIssueNodeId(
      OWNER,
      REPO,
      issueNumber,
      GITHUB_TOKEN
    );
    console.log(`✅ Found issue node ID: ${issueNodeId}`);

    // Get all items in the production project
    console.log(`\n🔍 Searching production project for this issue...`);
    const projectIssues = await getProjectIssues(
      PRODUCTION_PROJECT_ID,
      GITHUB_TOKEN
    );

    // Find the project item ID for this issue
    const projectItem = projectIssues.find(
      (item) => item.number === issueNumber
    );

    if (!projectItem) {
      console.log(
        `⚠️  Issue #${issueNumber} is not in the production project.`
      );
      return;
    }

    console.log(`✅ Found project item ID: ${projectItem.projectItemId}`);

    // Remove the issue from the production project
    console.log(
      `\n🗑️  Removing issue #${issueNumber} from production project...`
    );
    await removeIssueFromProject(
      PRODUCTION_PROJECT_ID,
      projectItem.projectItemId,
      GITHUB_TOKEN
    );

    console.log(
      `\n✅ SUCCESS! Issue #${issueNumber} has been removed from the production project.`
    );
    console.log(
      `   The issue remains in the test project for isolated testing.`
    );
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Main execution
const issueNumber = process.argv[2];

if (!issueNumber) {
  console.error("❌ Error: Please provide an issue number");
  console.error("Usage: node scripts/remove-from-production.js <issue-number>");
  process.exit(1);
}

removeFromProduction(parseInt(issueNumber));
