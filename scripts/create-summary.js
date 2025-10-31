#!/usr/bin/env node

/**
 * Create summary of the automation run
 *
 * This script generates a summary of the automation run for GitHub Actions output,
 * including statistics about resources generated, matched, and updated.
 */

const fs = require("fs");
const path = require("path");

// File paths
const CURRENT_RESOURCES_PATH = path.join("/tmp", "current-resources.json");
const NEW_RESOURCES_PATH = path.join("/tmp", "new-resources.json");
const MERGED_RESOURCES_PATH = path.join("/tmp", "merged-resources.json");

/**
 * Create summary
 */
function createSummary() {
  console.log("📊 Creating automation summary...\n");

  let summary = {
    timestamp: new Date().toISOString(),
    current: null,
    generated: null,
    merged: null,
    statistics: {},
  };

  // Read current resources
  if (fs.existsSync(CURRENT_RESOURCES_PATH)) {
    const currentResources = JSON.parse(
      fs.readFileSync(CURRENT_RESOURCES_PATH, "utf8")
    );
    summary.current = {
      total: currentResources.resources?.length || 0,
    };
  }

  // Read new resources
  if (fs.existsSync(NEW_RESOURCES_PATH)) {
    const newResources = JSON.parse(
      fs.readFileSync(NEW_RESOURCES_PATH, "utf8")
    );
    summary.generated = {
      total: newResources.resources?.length || 0,
    };
  }

  // Read merged resources
  if (fs.existsSync(MERGED_RESOURCES_PATH)) {
    const mergedResources = JSON.parse(
      fs.readFileSync(MERGED_RESOURCES_PATH, "utf8")
    );
    summary.merged = {
      total: mergedResources.resources?.length || 0,
    };

    // Calculate statistics
    const resources = mergedResources.resources || [];

    // Count by type
    const typeCount = {};
    resources.forEach((resource) => {
      typeCount[resource.type] = (typeCount[resource.type] || 0) + 1;
    });

    // Count new vs continuing
    const newResources = resources.filter((r) => r.weeks_on_list === 1).length;
    const continuingResources = resources.filter(
      (r) => r.weeks_on_list > 1
    ).length;

    // Calculate average scores
    const overallScores = resources
      .filter((r) => r.overall_score != null)
      .map((r) => r.overall_score);
    const highestScores = resources
      .filter((r) => r.highest_score != null)
      .map((r) => r.highest_score);

    const avgOverallScore =
      overallScores.length > 0
        ? Math.round(
            overallScores.reduce((sum, score) => sum + score, 0) /
              overallScores.length
          )
        : 0;
    const avgHighestScore =
      highestScores.length > 0
        ? Math.round(
            highestScores.reduce((sum, score) => sum + score, 0) /
              highestScores.length
          )
        : 0;

    summary.statistics = {
      typeDistribution: typeCount,
      newResources,
      continuingResources,
      averageOverallScore: avgOverallScore,
      averageHighestScore: avgHighestScore,
      overallScoreRange:
        overallScores.length > 0
          ? {
              min: Math.min(...overallScores),
              max: Math.max(...overallScores),
            }
          : null,
      highestScoreRange:
        highestScores.length > 0
          ? {
              min: Math.min(...highestScores),
              max: Math.max(...highestScores),
            }
          : null,
    };
  }

  // Display summary
  console.log("═══════════════════════════════════════════════════════════");
  console.log("                    AUTOMATION SUMMARY");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log(`⏰ Timestamp: ${summary.timestamp}\n`);

  if (summary.current) {
    console.log(`📋 Current Resources: ${summary.current.total}`);
  }

  if (summary.generated) {
    console.log(`🤖 Generated Resources: ${summary.generated.total}`);
  }

  if (summary.merged) {
    console.log(`📦 Final Resources: ${summary.merged.total}\n`);
  }

  if (summary.statistics.typeDistribution) {
    console.log("📊 Resource Types:");
    Object.entries(summary.statistics.typeDistribution).forEach(
      ([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      }
    );
    console.log();
  }

  console.log(`🆕 New Resources: ${summary.statistics.newResources || 0}`);
  console.log(
    `🔄 Continuing Resources: ${summary.statistics.continuingResources || 0}\n`
  );

  if (summary.statistics.averageOverallScore) {
    console.log(
      `⭐ Average Overall Score: ${summary.statistics.averageOverallScore}`
    );
  }

  if (summary.statistics.averageHighestScore) {
    console.log(
      `🎯 Average Highest Score: ${summary.statistics.averageHighestScore}`
    );
  }

  if (summary.statistics.overallScoreRange) {
    console.log(
      `📈 Overall Score Range: ${summary.statistics.overallScoreRange.min} - ${summary.statistics.overallScoreRange.max}`
    );
  }

  if (summary.statistics.highestScoreRange) {
    console.log(
      `🔥 Highest Score Range: ${summary.statistics.highestScoreRange.min} - ${summary.statistics.highestScoreRange.max}\n`
    );
  }

  console.log("═══════════════════════════════════════════════════════════\n");

  // Write summary to file for GitHub Actions
  const summaryPath = path.join("/tmp", "automation-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✅ Summary saved to: ${summaryPath}`);

  // Write to GitHub Actions step summary if available
  if (process.env.GITHUB_STEP_SUMMARY) {
    const markdownSummary = `
## 🤖 Weekly AI Resources Update Summary

**Timestamp:** ${summary.timestamp}

### 📊 Statistics

| Metric | Value |
|--------|-------|
| Current Resources | ${summary.current?.total || 0} |
| Generated Resources | ${summary.generated?.total || 0} |
| Final Resources | ${summary.merged?.total || 0} |
| New Resources | ${summary.statistics.newResources || 0} |
| Continuing Resources | ${summary.statistics.continuingResources || 0} |
| Average Overall Score | ${summary.statistics.averageOverallScore || 0} |
| Average Highest Score | ${summary.statistics.averageHighestScore || 0} |

### 📚 Resource Types

${Object.entries(summary.statistics.typeDistribution || {})
  .map(([type, count]) => `- **${type}**: ${count}`)
  .join("\n")}

### 🎯 Score Ranges

#### Overall Scores
- **Minimum:** ${summary.statistics.overallScoreRange?.min || 0}
- **Maximum:** ${summary.statistics.overallScoreRange?.max || 0}

#### Highest Risk Area Scores
- **Minimum:** ${summary.statistics.highestScoreRange?.min || 0}
- **Maximum:** ${summary.statistics.highestScoreRange?.max || 0}
`;

    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdownSummary);
    console.log("✅ Summary added to GitHub Actions step summary");
  }

  return summary;
}

// Main execution
function main() {
  console.log("🚀 Create Summary Script\n");
  createSummary();
  console.log("\n✨ Done!\n");
}

main();
