#!/usr/bin/env node

/**
 * Script to clean up test issues
 *
 * This script closes and optionally deletes all issues labeled with 'workflow-test'
 * to clean up after workflow testing without affecting production issues.
 *
 * Usage:
 *   # Close test issues (default)
 *   GITHUB_TOKEN=your_token node scripts/cleanup-test-issues.js
 *
 *   # Delete test issues (WARNING: permanent)
 *   GITHUB_TOKEN=your_token DELETE=true node scripts/cleanup-test-issues.js
 *
 * Required environment variables:
 *   - GITHUB_TOKEN: Personal access token with 'repo' scope
 */

const https = require("https");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY =
  process.env.GITHUB_REPOSITORY || "j0hnnymiller/ai-practitioner-resources";
const DELETE_ISSUES = process.env.DELETE === "true";
const [REPO_OWNER, REPO_NAME] = GITHUB_REPOSITORY.split("/");

if (!GITHUB_TOKEN) {
  console.error("❌ Error: GITHUB_TOKEN environment variable is required");
  process.exit(1);
}

/**
 * Make GitHub API request
 */
function makeGitHubRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path: path,
      method: method,
      headers: {
        "User-Agent": "cleanup-test-issues",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(
            new Error(`GitHub API error: ${res.statusCode} - ${responseData}`)
          );
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Find all test issues
 */
async function findTestIssues() {
  console.log("🔍 Searching for workflow-test issues...\n");

  const searchPath = `/search/issues?q=label:workflow-test+repo:${REPO_OWNER}/${REPO_NAME}+type:issue+state:open`;
  const result = await makeGitHubRequest(searchPath, "GET");

  return result.items || [];
}

/**
 * Close an issue
 */
async function closeIssue(issueNumber) {
  await makeGitHubRequest(
    `/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`,
    "PATCH",
    { state: "closed" }
  );
}

/**
 * Main execution
 */
async function main() {
  console.log("🧹 Test Issue Cleanup\n");
  console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}`);
  console.log(`Mode: ${DELETE_ISSUES ? "DELETE (permanent)" : "CLOSE"}`);
  console.log("=".repeat(60));

  const testIssues = await findTestIssues();

  if (testIssues.length === 0) {
    console.log("\n✅ No workflow-test issues found. Nothing to clean up.");
    return;
  }

  console.log(`\nFound ${testIssues.length} workflow-test issue(s):\n`);
  testIssues.forEach((issue) => {
    console.log(`  - #${issue.number}: ${issue.title}`);
  });

  if (DELETE_ISSUES) {
    console.log("\n⚠️  WARNING: DELETE mode is not supported via API.");
    console.log("Issues will be closed instead. Manual deletion required.");
  }

  console.log("\n" + "=".repeat(60));
  console.log("Closing issues...\n");

  for (const issue of testIssues) {
    try {
      await closeIssue(issue.number);
      console.log(`✅ Closed #${issue.number}: ${issue.title}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to close #${issue.number}: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✨ Cleanup complete! Closed ${testIssues.length} issue(s)\n`);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
