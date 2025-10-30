#!/usr/bin/env node

/**
 * Compare results from different automation runs
 * This analyzes the downloaded artifacts to see patterns
 */

const fs = require("fs");
const path = require("path");

function compareRuns() {
  console.log("🔍 Analyzing Automation Run Results");
  console.log("");

  // Check if we have the current results
  const artifactsPath = path.join(__dirname, "..", "automation-results");
  if (!fs.existsSync(artifactsPath)) {
    console.log("❌ No automation-results directory found");
    console.log("💡 Run: gh run download <run-id> to get artifacts");
    return;
  }

  // Load the current results
  const summaryPath = path.join(artifactsPath, "automation-summary.json");
  const currentPath = path.join(artifactsPath, "current-resources.json");
  const newPath = path.join(artifactsPath, "new-resources.json");
  const mergedPath = path.join(artifactsPath, "merged-resources.json");

  if (!fs.existsSync(summaryPath)) {
    console.log("❌ automation-summary.json not found in artifacts");
    return;
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  console.log("📊 Latest Run Summary:");
  console.log(`   Timestamp: ${summary.timestamp}`);
  console.log(`   Current resources: ${summary.current.total}`);
  console.log(`   Generated resources: ${summary.generated.total}`);
  console.log(`   New resources: ${summary.statistics.newResources}`);
  console.log(
    `   Continuing resources: ${summary.statistics.continuingResources}`
  );
  console.log(`   Average score: ${summary.statistics.averageScore}`);
  console.log("");

  // Analyze current vs new resources
  if (fs.existsSync(currentPath) && fs.existsSync(newPath)) {
    const current = JSON.parse(fs.readFileSync(currentPath, "utf8"));
    const newResources = JSON.parse(fs.readFileSync(newPath, "utf8"));

    console.log("📋 Resource Comparison:");
    console.log("");

    console.log("🔄 Current Resources (from gist):");
    current.resources.forEach((resource, index) => {
      console.log(
        `   ${index + 1}. "${resource.title}" (${resource.type}) - Week ${
          resource.weeks_on_list
        }`
      );
    });
    console.log("");

    console.log("🆕 Newly Generated Resources:");
    newResources.resources.forEach((resource, index) => {
      console.log(
        `   ${index + 1}. "${resource.title}" (${resource.type}) - Score ${
          resource.score
        }`
      );
    });
    console.log("");

    // Check for potential matches (case-insensitive title comparison)
    console.log("🔍 Analyzing Potential Matches:");
    let foundMatches = 0;

    current.resources.forEach((currentRes) => {
      newResources.resources.forEach((newRes) => {
        const currentTitle = currentRes.title.toLowerCase().trim();
        const newTitle = newRes.title.toLowerCase().trim();

        if (currentTitle === newTitle) {
          console.log(`   ✅ Exact match: "${currentRes.title}"`);
          foundMatches++;
        } else if (
          currentTitle.includes(newTitle) ||
          newTitle.includes(currentTitle)
        ) {
          console.log(
            `   🔄 Partial match: "${currentRes.title}" ~ "${newRes.title}"`
          );
        }
      });
    });

    if (foundMatches === 0) {
      console.log("   ❌ No exact title matches found");
      console.log("   💡 This is why all resources show weeks_on_list: 1");
    }
    console.log("");
  }

  // Show merged results
  if (fs.existsSync(mergedPath)) {
    const merged = JSON.parse(fs.readFileSync(mergedPath, "utf8"));
    console.log("🎯 Final Merged Results:");
    merged.resources.forEach((resource, index) => {
      const weekStatus =
        resource.weeks_on_list === 1
          ? "🆕 NEW"
          : `📈 WEEK ${resource.weeks_on_list}`;
      console.log(`   ${index + 1}. "${resource.title}" - ${weekStatus}`);
    });
    console.log("");
  }

  // Show type distribution
  console.log("📈 Resource Type Distribution:");
  Object.entries(summary.statistics.typeDistribution).forEach(
    ([type, count]) => {
      console.log(`   ${type}: ${count}`);
    }
  );
  console.log("");

  console.log("✨ Analysis complete!");
  console.log("");
  console.log("💡 To see weeks increment in action:");
  console.log(
    "   - The AI would need to generate resources with identical titles"
  );
  console.log("   - In real weekly usage, popular resources naturally recur");
  console.log(
    "   - Current behavior shows excellent diversity in content generation"
  );
}

compareRuns();
