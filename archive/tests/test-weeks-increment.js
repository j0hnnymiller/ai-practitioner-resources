#!/usr/bin/env node

/**
 * Test script to demonstrate the weeks increment functionality
 */

const fs = require("fs");
const path = require("path");

function testWeeksIncrement() {
  console.log("🧪 Testing Weeks Increment Logic\n");

  // Read test files
  const currentResources = JSON.parse(
    fs.readFileSync("test-current-resources.json", "utf8")
  );
  const newResources = JSON.parse(
    fs.readFileSync("test-new-resources.json", "utf8")
  );

  console.log("📊 Current Resources (before merge):");
  currentResources.resources.forEach((resource) => {
    console.log(
      `   "${resource.title}" - weeks_on_list: ${resource.weeks_on_list}`
    );
  });

  console.log("\n📊 New Resources (before processing):");
  newResources.resources.forEach((resource) => {
    console.log(
      `   "${resource.title}" - weeks_on_list: ${resource.weeks_on_list}`
    );
  });

  // Create a map of current resources by title and source for matching
  const currentResourcesMap = new Map();
  currentResources.resources.forEach((resource) => {
    const key = `${resource.title}||${resource.source}`;
    currentResourcesMap.set(key, resource);
  });

  // Update weeks_on_list for matching resources
  let matched = 0;
  let newCount = 0;

  newResources.resources.forEach((newResource) => {
    const key = `${newResource.title}||${newResource.source}`;
    const existingResource = currentResourcesMap.get(key);

    if (existingResource) {
      // Resource exists, increment weeks_on_list
      const oldWeeks = existingResource.weeks_on_list || 1;
      newResource.weeks_on_list = oldWeeks + 1;
      console.log(`\n🔄 MATCHED: "${newResource.title}"`);
      console.log(
        `   Previous weeks: ${oldWeeks} → New weeks: ${newResource.weeks_on_list}`
      );
      matched++;
    } else {
      // New resource, set to 1
      newResource.weeks_on_list = 1;
      console.log(`\n✨ NEW: "${newResource.title}"`);
      console.log(`   Set weeks_on_list: ${newResource.weeks_on_list}`);
      newCount++;
    }
  });

  console.log("\n📈 Final Results (after merge):");
  newResources.resources.forEach((resource) => {
    console.log(
      `   "${resource.title}" - weeks_on_list: ${resource.weeks_on_list}`
    );
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Matched resources (incremented): ${matched}`);
  console.log(`   New resources (set to 1): ${newCount}`);
  console.log(`   Total resources: ${newResources.resources.length}`);
}

testWeeksIncrement();
