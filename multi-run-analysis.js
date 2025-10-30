#!/usr/bin/env node

/**
 * Multi-run analysis to verify matching logic and AI consistency
 */

const fs = require("fs");
const path = require("path");

function analyzeMultipleRuns() {
  console.log("🔍 MULTI-RUN ANALYSIS - Independent Verification\n");
  console.log("=".repeat(70));

  const runs = ["run1", "run2", "run3", "run4", "run5"];
  const runData = [];

  // Load data from all runs
  console.log("\n📊 LOADING RUN DATA:");
  runs.forEach((runDir, index) => {
    const runPath = path.join(runDir, "automation-results");

    if (!fs.existsSync(runPath)) {
      console.log(`   ❌ ${runDir}: No data found`);
      return;
    }

    try {
      const current = JSON.parse(
        fs.readFileSync(path.join(runPath, "current-resources.json"), "utf8")
      );
      const newRes = JSON.parse(
        fs.readFileSync(path.join(runPath, "new-resources.json"), "utf8")
      );
      const merged = JSON.parse(
        fs.readFileSync(path.join(runPath, "merged-resources.json"), "utf8")
      );

      runData.push({
        run: runDir,
        current: current.resources,
        generated: newRes.resources,
        merged: merged.resources,
      });

      console.log(
        `   ✅ ${runDir}: Current=${current.resources.length}, Generated=${newRes.resources.length}, Merged=${merged.resources.length}`
      );
    } catch (error) {
      console.log(`   ❌ ${runDir}: Error loading data - ${error.message}`);
    }
  });

  if (runData.length === 0) {
    console.log(
      "\n❌ No run data found. Make sure artifacts were downloaded correctly."
    );
    return;
  }

  console.log(`\n✅ Successfully loaded ${runData.length} runs\n`);

  // Analyze each run individually
  console.log("🎯 INDIVIDUAL RUN ANALYSIS:");
  console.log("-".repeat(70));

  runData.forEach((data, index) => {
    console.log(`\n📋 ${data.run.toUpperCase()}:`);

    // Create matching map
    const currentMap = new Map();
    data.current.forEach((r) => {
      const key = `${r.title}||${r.source}`;
      currentMap.set(key, r);
    });

    let exactMatches = 0;
    let weekIncrements = 0;
    const matches = [];

    // Find exact matches
    data.generated.forEach((newResource) => {
      const key = `${newResource.title}||${newResource.source}`;
      const existing = currentMap.get(key);

      if (existing) {
        exactMatches++;
        const mergedResource = data.merged.find(
          (r) =>
            r.title === newResource.title && r.source === newResource.source
        );

        const oldWeeks = existing.weeks_on_list;
        const newWeeks = mergedResource?.weeks_on_list || 1;

        if (newWeeks > oldWeeks) {
          weekIncrements++;
        }

        matches.push({
          title: newResource.title,
          oldWeeks,
          newWeeks,
          incremented: newWeeks > oldWeeks,
        });
      }
    });

    console.log(`   📊 Stats:`);
    console.log(`      Current resources: ${data.current.length}`);
    console.log(`      Generated resources: ${data.generated.length}`);
    console.log(`      Exact matches: ${exactMatches}`);
    console.log(`      Weeks incremented: ${weekIncrements}`);
    console.log(
      `      Match rate: ${(
        (exactMatches / data.generated.length) *
        100
      ).toFixed(1)}%`
    );

    if (matches.length > 0) {
      console.log(`   🎯 Matched resources:`);
      matches.forEach((match) => {
        const status = match.incremented
          ? "✅ INCREMENTED"
          : "⚠️  NO INCREMENT";
        console.log(
          `      ${status}: "${match.title}" (${match.oldWeeks} → ${match.newWeeks})`
        );
      });
    } else {
      console.log(`   ❌ No exact matches found!`);
    }
  });

  // Cross-run consistency analysis
  console.log("\n\n🔄 CROSS-RUN CONSISTENCY ANALYSIS:");
  console.log("-".repeat(70));

  // Find resources that appear in multiple runs
  const allGeneratedTitles = new Map(); // title -> [run1, run2, ...]

  runData.forEach((data) => {
    data.generated.forEach((resource) => {
      const key = `${resource.title}||${resource.source}`;
      if (!allGeneratedTitles.has(key)) {
        allGeneratedTitles.set(key, []);
      }
      allGeneratedTitles.get(key).push(data.run);
    });
  });

  // Find consistently generated resources
  const consistentResources = [];
  allGeneratedTitles.forEach((runs, titleKey) => {
    if (runs.length >= 2) {
      // Appears in 2+ runs
      consistentResources.push({
        resource: titleKey.split("||")[0], // Just the title
        runs: runs,
        frequency: runs.length,
      });
    }
  });

  console.log(`\n📈 Resources appearing in multiple runs:`);
  if (consistentResources.length > 0) {
    consistentResources
      .sort((a, b) => b.frequency - a.frequency)
      .forEach((item) => {
        console.log(
          `   🔄 "${item.resource}" - appears in ${
            item.frequency
          } runs: [${item.runs.join(", ")}]`
        );
      });
  } else {
    console.log(
      `   ❌ No resources appear in multiple runs - AI is generating completely different lists each time!`
    );
  }

  // Summary analysis
  console.log("\n\n📊 OVERALL SUMMARY:");
  console.log("=".repeat(70));

  const totalMatches = runData.reduce((sum, data) => {
    const currentMap = new Map();
    data.current.forEach((r) => currentMap.set(`${r.title}||${r.source}`, r));
    const matches = data.generated.filter((r) =>
      currentMap.has(`${r.title}||${r.source}`)
    ).length;
    return sum + matches;
  }, 0);

  const totalGenerated = runData.reduce(
    (sum, data) => sum + data.generated.length,
    0
  );
  const avgMatchRate = ((totalMatches / totalGenerated) * 100).toFixed(1);

  console.log(`📋 Runs analyzed: ${runData.length}`);
  console.log(`📋 Total resources generated: ${totalGenerated}`);
  console.log(`🎯 Total exact matches: ${totalMatches}`);
  console.log(`📊 Overall match rate: ${avgMatchRate}%`);
  console.log(
    `🔄 Resources appearing in 2+ runs: ${consistentResources.length}`
  );

  console.log(`\n💡 CONCLUSIONS:`);
  if (avgMatchRate < 10) {
    console.log(
      `   ❌ Very low match rate (${avgMatchRate}%) - AI generates mostly different resources each time`
    );
    console.log(
      `   ❌ This explains why weeks_on_list stays at 1 - few resources persist between runs`
    );
    console.log(
      `   💡 SOLUTION: Improve prompt consistency or implement fuzzy matching`
    );
  } else if (avgMatchRate < 30) {
    console.log(
      `   ⚠️  Low match rate (${avgMatchRate}%) - some consistency but room for improvement`
    );
    console.log(
      `   ⚠️  Matching logic works, but AI consistency needs improvement`
    );
    console.log(
      `   💡 SOLUTION: Enhance prompt with specific resource examples`
    );
  } else {
    console.log(
      `   ✅ Good match rate (${avgMatchRate}%) - AI shows reasonable consistency`
    );
    console.log(`   ✅ Matching logic is working correctly`);
    console.log(`   ✅ Weeks increment system should be working as designed`);
  }
}

analyzeMultipleRuns();
