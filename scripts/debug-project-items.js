#!/usr/bin/env node

/**
 * Debug script to see what's in the production project
 */

const { getProjectIssues } = require("./lib/graphql-helpers.js");

const PRODUCTION_PROJECT_ID = "PVT_kwHOCkVgYc4BHOek";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function debugProjectItems() {
  try {
    console.log("\n🔍 Fetching all items from production project...");
    const items = await getProjectIssues(PRODUCTION_PROJECT_ID, GITHUB_TOKEN);

    console.log(`\n📊 Found ${items.length} items in production project:\n`);

    items.forEach((item, index) => {
      console.log(`${index + 1}. Project Item ID: ${item.id}`);
      if (item.content) {
        console.log(`   Content Type: ${item.content.__typename}`);
        console.log(`   Content ID: ${item.content.id}`);
        if (item.content.number) {
          console.log(
            `   Issue #${item.content.number}: ${item.content.title}`
          );
        }
      }
      console.log("");
    });
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

debugProjectItems();
