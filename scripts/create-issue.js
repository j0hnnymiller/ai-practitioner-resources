#!/usr/bin/env node

/**
 * Script to create a single GitHub issue from a markdown file
 *
 * This script creates a GitHub issue by reading a markdown file. The filename
 * prefix indicates the issue type (feature-, bug-, refactor-, idea-), which is
 * automatically converted to a label.
 *
 * Created issues can optionally be added to a GitHub Project.
 *
 * Usage:
 *   # Create issue without adding to project
 *   GITHUB_TOKEN=your_token ISSUE_FILE=feature-add-dark-mode.md node scripts/create-issue.js
 *
 *   # Create issue and add to project
 *   GITHUB_TOKEN=your_token ISSUE_FILE=feature-add-dark-mode.md PROJECT_NUMBER=3 node scripts/create-issue.js
 *
 * Required environment variables:
 *   - GITHUB_TOKEN: Personal access token with 'repo' scope (add 'project' scope if using PROJECT_NUMBER)
 *   - ISSUE_FILE: Name of the markdown file containing the issue description
 *
 * Optional environment variables:
 *   - PROJECT_NUMBER: The number of the GitHub Project to add the issue to (e.g., 3 for Project #3)
 *   - GITHUB_REPOSITORY: Repository in format 'owner/repo' (optional, auto-detected in CI)
 *   - ISSUES_DIR: Directory containing issue files (optional, defaults to automation-results/test-issues)
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const {
  getIssueNodeId,
  addIssueToProject,
  getProjectId,
} = require("./lib/graphql-helpers");

// Configuration
const ISSUES_DIR =
  process.env.ISSUES_DIR ||
  path.join(__dirname, "..", "automation-results", "test-issues");
const ISSUE_FILE = process.env.ISSUE_FILE; // Required: specific file to create
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PROJECT_NUMBER = process.env.PROJECT_NUMBER
  ? parseInt(process.env.PROJECT_NUMBER)
  : 3; // Default to test project #3
const GITHUB_REPOSITORY =
  process.env.GITHUB_REPOSITORY || "j0hnnymiller/ai-practitioner-resources";
const [REPO_OWNER, REPO_NAME] = GITHUB_REPOSITORY.split("/");

// Validate configuration
if (!GITHUB_TOKEN) {
  console.error("❌ Error: GITHUB_TOKEN environment variable is required");
  console.error(
    'Please provide a GitHub personal access token with "repo" scope'
  );
  console.error(
    "Usage: GITHUB_TOKEN=your_token ISSUE_FILE=feature-name.md node scripts/create-issue.js"
  );
  process.exit(1);
}

if (!ISSUE_FILE) {
  console.error("❌ Error: ISSUE_FILE environment variable is required");
  console.error(
    "Please provide the name of the markdown file to create an issue from"
  );
  console.error(
    "Usage: GITHUB_TOKEN=your_token ISSUE_FILE=feature-name.md node scripts/create-issue.js"
  );
  process.exit(1);
}

if (!REPO_OWNER || !REPO_NAME) {
  console.error("❌ Error: Invalid GITHUB_REPOSITORY format");
  console.error("Expected format: owner/repo");
  process.exit(1);
}

/**
 * Extract issue type from filename
 * E.g., "feature-add-dark-mode.md" -> "feature"
 */
function getIssueTypeFromFilename(filename) {
  const match = filename.match(
    /^(feature|bug|refactor|idea|enhancement|documentation)-/
  );
  return match ? match[1] : "unknown";
}

/**
 * Generate title from filename
 * E.g., "feature-add-dark-mode.md" -> "Feature: Add dark mode"
 */
function generateTitle(filename) {
  // Remove .md extension and split by hyphens
  const withoutExt = filename.replace(/\.md$/, "");
  const parts = withoutExt.split("-");

  // First part is the type (feature, bug, etc.)
  const type = parts[0];
  const titleParts = parts.slice(1);

  // Capitalize type and join the rest
  const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
  const description = titleParts
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return `${capitalizedType}: ${description}`;
}

/**
 * Read the issue file
 */
function readIssueFile() {
  console.log("📂 Reading issue from:", ISSUES_DIR);
  console.log(`📄 Issue file: ${ISSUE_FILE}`);

  const filePath = path.join(ISSUES_DIR, ISSUE_FILE);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf8").trim();
  const title = generateTitle(ISSUE_FILE);

  return {
    filename: ISSUE_FILE,
    title: title,
    labels: [], // Let PM Agent apply all labels based on content analysis
    assignees: [],
    body: content,
  };
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
        "User-Agent": "create-issues-script",
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
 * Check if an issue with the same title already exists
 */
async function checkExistingIssue(title) {
  try {
    const encodedTitle = encodeURIComponent(title);
    const searchPath = `/search/issues?q=${encodedTitle}+in:title+repo:${REPO_OWNER}/${REPO_NAME}+type:issue+state:open`;
    const result = await makeGitHubRequest(searchPath, "GET");

    // Check if any of the results match the exact title
    const exactMatch = result.items?.find((issue) => issue.title === title);
    return exactMatch || null;
  } catch (error) {
    console.warn(
      `⚠️  Warning: Could not check for existing issue: ${error.message}`
    );
    return null;
  }
}

/**
 * Create a GitHub issue from data and optionally add it to a project
 */
async function createIssue(issueData, projectId, targetProjectNumber) {
  console.log(`\n📝 Processing: ${issueData.title}`);

  // Check if issue already exists
  const existingIssue = await checkExistingIssue(issueData.title);
  if (existingIssue) {
    console.log(`⏭️  Skipped: Issue already exists (#${existingIssue.number})`);
    console.log(`   URL: ${existingIssue.html_url}`);
    return { skipped: true, issue: existingIssue };
  }

  const requestData = {
    title: issueData.title,
    body: issueData.body,
    labels: issueData.labels,
  };

  // Only add assignees if they are valid
  if (issueData.assignees && issueData.assignees.length > 0) {
    requestData.assignees = issueData.assignees;
  }

  try {
    // Create the issue
    const issue = await makeGitHubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      "POST",
      requestData
    );

    console.log(`✅ Created: Issue #${issue.number}`);
    console.log(`   URL: ${issue.html_url}`);

    // Add issue to project if projectId is provided
    if (projectId) {
      try {
        const issueNodeId = await getIssueNodeId(
          REPO_OWNER,
          REPO_NAME,
          issue.number,
          GITHUB_TOKEN
        );
        await addIssueToProject(projectId, issueNodeId, GITHUB_TOKEN);
        console.log(`📊 Added to project #${targetProjectNumber}`);
      } catch (projectError) {
        console.warn(
          `⚠️  Warning: Could not add to project: ${projectError.message}`
        );
      }
    }

    return { created: true, issue };
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return { failed: true, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 GitHub Issue Creator\n");
  console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}`);
  if (PROJECT_NUMBER) {
    console.log(`Project: #${PROJECT_NUMBER}`);
  }
  console.log("=".repeat(60));

  // Get project ID if PROJECT_NUMBER is provided
  let projectId = null;
  if (PROJECT_NUMBER) {
    try {
      console.log(`\n🔍 Finding project #${PROJECT_NUMBER}...`);
      const project = await getProjectId(
        REPO_OWNER,
        PROJECT_NUMBER,
        GITHUB_TOKEN
      );
      projectId = project.id;
      console.log(`✅ Found project: "${project.title}"`);
    } catch (error) {
      console.error(`\n❌ Error: Could not find project: ${error.message}`);
      console.error(`\nPlease ensure:`);
      console.error(`  1. Project #${PROJECT_NUMBER} exists`);
      console.error(`  2. Your token has 'project' scope`);
      console.error(`  3. You have access to the project`);
      process.exit(1);
    }
  }

  // Read issue file
  const issueData = readIssueFile();

  console.log("\n" + "=".repeat(60));
  console.log("Creating issue...\n");

  // Create issue
  const result = await createIssue(issueData, projectId, PROJECT_NUMBER);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 Summary\n");

  if (result.created) {
    console.log(`✅ Successfully created issue #${result.issue.number}`);
    console.log(`   Title: ${result.issue.title}`);
    console.log(`   URL: ${result.issue.html_url}`);
  } else if (result.skipped) {
    console.log(`⏭️  Issue already exists: #${result.issue.number}`);
    console.log(`   URL: ${result.issue.html_url}`);
  } else if (result.failed) {
    console.log(`❌ Failed to create issue`);
    console.log(`   Error: ${result.error}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ Done!\n");

  // Exit with error code if failed
  process.exit(result.failed ? 1 : 0);
}

// Run the script
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
