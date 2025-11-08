#!/usr/bin/env node

/**
 * Quick test script to verify GitHub Projects setup
 *
 * This script:
 * 1. Checks if your token has the right scopes
 * 2. Lists existing projects
 * 3. Helps you find project IDs
 *
 * Usage:
 *   GITHUB_TOKEN=your_token node scripts/test-project-setup.js
 */

const { makeGraphQLRequest } = require("./lib/graphql-helpers");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY =
  process.env.GITHUB_REPOSITORY || "j0hnnymiller/ai-practitioner-resources";
const [REPO_OWNER, REPO_NAME] = GITHUB_REPOSITORY.split("/");

if (!GITHUB_TOKEN) {
  console.error("❌ Error: GITHUB_TOKEN required");
  process.exit(1);
}

async function checkTokenScopes() {
  console.log("\n🔐 Checking token scopes...\n");

  const https = require("https");

  return new Promise((resolve) => {
    const options = {
      hostname: "api.github.com",
      path: "/user",
      method: "GET",
      headers: {
        "User-Agent": "test-script",
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
    };

    const req = https.request(options, (res) => {
      const scopes = res.headers["x-oauth-scopes"] || "";
      console.log(`Token scopes: ${scopes}`);

      const hasRepo = scopes.includes("repo");
      const hasProject =
        scopes.includes("project") || scopes.includes("read:project");

      console.log(`  ✅ repo scope: ${hasRepo ? "YES" : "NO"}`);
      console.log(
        `  ${hasProject ? "✅" : "❌"} project scope: ${
          hasProject ? "YES" : "NO"
        }`
      );

      if (!hasProject) {
        console.log("\n⚠️  WARNING: Missing project scope!");
        console.log(
          '   Your token needs the "project" scope to work with GitHub Projects.'
        );
        console.log("   Visit: https://github.com/settings/tokens\n");
      }

      resolve(hasProject);
    });

    req.on("error", (err) => {
      console.error("Error checking scopes:", err.message);
      resolve(false);
    });

    req.end();
  });
}

async function listUserProjects() {
  console.log("\n📊 Listing your projects...\n");

  const query = `
    query($owner: String!) {
      user(login: $owner) {
        projectsV2(first: 10) {
          nodes {
            id
            title
            number
            url
          }
        }
      }
    }
  `;

  try {
    const result = await makeGraphQLRequest(
      query,
      { owner: REPO_OWNER },
      GITHUB_TOKEN
    );

    if (result.user && result.user.projectsV2.nodes.length > 0) {
      console.log("Found projects:\n");
      result.user.projectsV2.nodes.forEach((project) => {
        console.log(`  Project #${project.number}: ${project.title}`);
        console.log(`    ID: ${project.id}`);
        console.log(`    URL: ${project.url}`);
        console.log();
      });

      return result.user.projectsV2.nodes;
    } else {
      console.log("❌ No projects found.");
      console.log("\nTo create a project:");
      console.log(
        "  1. Go to: https://github.com/users/" + REPO_OWNER + "/projects"
      );
      console.log('  2. Click "New project"');
      console.log('  3. Choose "Board" template');
      console.log('  4. Name it "Workflow Testing"');
      console.log();
      return [];
    }
  } catch (error) {
    console.error("❌ Error listing projects:", error.message);

    if (error.message.includes("INSUFFICIENT_SCOPES")) {
      console.log(
        '\n⚠️  Your token does not have the required "project" scope.'
      );
      console.log("   Please regenerate your token with:");
      console.log("     ✅ repo");
      console.log("     ✅ project");
      console.log();
    }

    return [];
  }
}

async function suggestNextSteps(projects) {
  console.log("═".repeat(60));
  console.log("\n📋 NEXT STEPS:\n");

  if (projects.length === 0) {
    console.log("1. Create a GitHub Project:");
    console.log(
      "   → Go to: https://github.com/users/" + REPO_OWNER + "/projects/new"
    );
    console.log('   → Name: "Workflow Testing"');
    console.log('   → Template: "Board"');
    console.log();
    console.log("2. Re-run this script to verify");
    console.log();
  } else {
    const testProject = projects.find(
      (p) =>
        p.title.toLowerCase().includes("test") ||
        p.title.toLowerCase().includes("workflow")
    );

    if (testProject) {
      console.log(
        `✅ Test project found: "${testProject.title}" (Project #${testProject.number})`
      );
      console.log();
      console.log("You can now create a test issue:");
      console.log();
      console.log(`  GITHUB_TOKEN=${GITHUB_TOKEN.substring(0, 10)}... \\`);
      console.log(`  TEST_PROJECT_NUMBER=${testProject.number} \\`);
      console.log(`  ISSUE_FILE=feature-add-dark-mode.md \\`);
      console.log(`  node scripts/create-test-issues.js`);
      console.log();
    } else {
      console.log(
        '⚠️  No test project found. Consider creating one named "Workflow Testing"'
      );
      console.log();
      console.log("Or use an existing project:");
      projects.forEach((p) => {
        console.log(`  TEST_PROJECT_NUMBER=${p.number}  # ${p.title}`);
      });
      console.log();
    }
  }
}

async function main() {
  console.log("🚀 GitHub Projects Setup Test");
  console.log("═".repeat(60));
  console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}`);

  const hasProjectScope = await checkTokenScopes();

  if (!hasProjectScope) {
    console.log("\n❌ Cannot proceed without project scope.");
    console.log("Please update your token and try again.\n");
    process.exit(1);
  }

  const projects = await listUserProjects();

  await suggestNextSteps(projects);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
