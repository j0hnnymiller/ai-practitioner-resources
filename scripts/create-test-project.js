#!/usr/bin/env node

/**
 * Create a new "Workflow Testing" project
 */

const { makeGraphQLRequest } = require("./lib/graphql-helpers");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "j0hnnymiller";

async function createTestProject() {
  console.log('🔨 Creating "Workflow Testing" project...\n');

  // First, get the owner ID
  const ownerQuery = `
    query($login: String!) {
      user(login: $login) {
        id
      }
    }
  `;

  const ownerResult = await makeGraphQLRequest(
    ownerQuery,
    { login: OWNER },
    GITHUB_TOKEN
  );
  const ownerId = ownerResult.user.id;

  // Create the project
  const createQuery = `
    mutation($ownerId: ID!, $title: String!) {
      createProjectV2(input: {
        ownerId: $ownerId
        title: $title
      }) {
        projectV2 {
          id
          number
          title
          url
        }
      }
    }
  `;

  const result = await makeGraphQLRequest(
    createQuery,
    { ownerId, title: "Workflow Testing" },
    GITHUB_TOKEN
  );

  const project = result.createProjectV2.projectV2;

  console.log("✅ Created project:");
  console.log(`   Title: ${project.title}`);
  console.log(`   Number: #${project.number}`);
  console.log(`   ID: ${project.id}`);
  console.log(`   URL: ${project.url}`);
  console.log();
  console.log("🎯 To create test issues, use:");
  console.log(
    `   TEST_PROJECT_NUMBER=${project.number} ISSUE_FILE=feature-add-dark-mode.md node scripts/create-test-issues.js`
  );
  console.log();

  return project;
}

if (!GITHUB_TOKEN) {
  console.error("❌ GITHUB_TOKEN required");
  process.exit(1);
}

createTestProject().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
