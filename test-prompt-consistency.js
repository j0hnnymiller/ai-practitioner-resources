#!/usr/bin/env node

/**
 * Test script to simulate the exact same Claude API calls that the workflow makes
 * This will help us determine if the issue is with the prompt or AI consistency
 */

const fs = require("fs");
const path = require("path");

// Configuration - same as workflow
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PROMPT_PATH = path.join(
  __dirname,
  ".github",
  "instructions",
  "ai-practitioner-resources-json.prompt.md"
);

if (!ANTHROPIC_API_KEY) {
  console.error("❌ Error: ANTHROPIC_API_KEY environment variable is required");
  console.error(
    '💡 Set it with: $env:ANTHROPIC_API_KEY="your-key-here" (PowerShell)'
  );
  process.exit(1);
}

if (!fs.existsSync(PROMPT_PATH)) {
  console.error("❌ Error: Prompt file not found at:", PROMPT_PATH);
  process.exit(1);
}

async function testPromptConsistency(runNumber, totalRuns) {
  console.log(`\n🧪 TEST RUN ${runNumber}/${totalRuns}`);
  console.log("-".repeat(50));

  const promptContent = fs.readFileSync(PROMPT_PATH, "utf8");

  try {
    console.log("⏳ Calling Claude API...");

    // Exact same API call as the workflow
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10000,
        messages: [
          {
            role: "user",
            content: `You are an expert AI researcher who curates high-quality resources for developers. Generate ONLY valid JSON with no additional text. Requirements: 1) Use REAL, ACTUAL resources with genuine URLs (never use example.com or placeholder links), 2) Include 15-25 diverse resources from reputable sources like official documentation, established publishers (O'Reilly, Manning, Pragmatic Programmers), respected blogs (Martin Fowler, Stack Overflow), and popular podcasts, 3) Ensure all property names and string values are properly quoted with double quotes.\n\n${promptContent}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const jsonResponse = result.content[0].text;

    console.log(`✅ Received response (${jsonResponse.length} chars)`);

    // Parse JSON (same logic as workflow)
    let cleanedResponse = jsonResponse.trim();
    cleanedResponse = cleanedResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "");

    const jsonStart = cleanedResponse.indexOf("{");
    const jsonEnd = cleanedResponse.lastIndexOf("}") + 1;

    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No JSON object found in response");
    }

    const jsonOnly = cleanedResponse.substring(jsonStart, jsonEnd);
    const parsedData = JSON.parse(jsonOnly);

    console.log(`📊 Generated ${parsedData.resources?.length || 0} resources`);

    // Extract just the titles and sources for comparison
    const resourceList =
      parsedData.resources?.map((r) => ({
        title: r.title,
        source: r.source,
        type: r.type,
      })) || [];

    // Save result for analysis
    const testResult = {
      run: runNumber,
      timestamp: new Date().toISOString(),
      resourceCount: resourceList.length,
      resources: resourceList,
    };

    fs.writeFileSync(
      `test-run-${runNumber}.json`,
      JSON.stringify(testResult, null, 2)
    );
    console.log(`💾 Saved results to test-run-${runNumber}.json`);

    // Show first few resources
    console.log("📝 First 3 resources:");
    resourceList.slice(0, 3).forEach((r, i) => {
      console.log(`   ${i + 1}. [${r.type}] "${r.title}"`);
    });

    return testResult;
  } catch (error) {
    console.error(`❌ Error in run ${runNumber}:`, error.message);
    return null;
  }
}

async function runConsistencyTest() {
  console.log("🔬 CLAUDE API CONSISTENCY TEST");
  console.log("=".repeat(60));
  console.log(
    "Testing if Claude generates consistent resources with the same prompt"
  );
  console.log("This mimics the exact workflow API calls\n");

  const numRuns = 3; // Start with 3 runs to avoid hitting rate limits
  const results = [];

  for (let i = 1; i <= numRuns; i++) {
    const result = await testPromptConsistency(i, numRuns);
    if (result) {
      results.push(result);
    }

    // Wait between calls to avoid rate limiting
    if (i < numRuns) {
      console.log("⏱️  Waiting 2 seconds before next test...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  if (results.length < 2) {
    console.log("\n❌ Not enough successful runs to compare");
    return;
  }

  // Analyze consistency
  console.log("\n\n📊 CONSISTENCY ANALYSIS");
  console.log("=".repeat(60));

  // Find common resources
  const allTitles = new Map(); // title+source -> [run1, run2, ...]

  results.forEach((result) => {
    result.resources.forEach((resource) => {
      const key = `${resource.title}||${resource.source}`;
      if (!allTitles.has(key)) {
        allTitles.set(key, []);
      }
      allTitles.get(key).push(result.run);
    });
  });

  const commonResources = [];
  allTitles.forEach((runs, titleKey) => {
    if (runs.length > 1) {
      commonResources.push({
        resource: titleKey.split("||")[0], // just title
        runs: runs,
        frequency: runs.length,
      });
    }
  });

  console.log(`\n🎯 RESULTS:`);
  console.log(`   Total runs: ${results.length}`);
  results.forEach((r) => {
    console.log(`   Run ${r.run}: ${r.resourceCount} resources`);
  });

  console.log(
    `\n🔄 Resources appearing in multiple runs: ${commonResources.length}`
  );
  if (commonResources.length > 0) {
    commonResources
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10) // Show top 10
      .forEach((item) => {
        console.log(
          `   📋 "${item.resource}" - in runs: [${item.runs.join(", ")}]`
        );
      });
  } else {
    console.log("   ❌ No resources appear in multiple runs!");
  }

  // Calculate overlap percentage
  const totalResources = results.reduce((sum, r) => sum + r.resourceCount, 0);
  const totalOverlaps = commonResources.reduce(
    (sum, r) => sum + (r.frequency - 1),
    0
  );
  const overlapRate = ((totalOverlaps / totalResources) * 100).toFixed(1);

  console.log(`\n📊 Overall overlap rate: ${overlapRate}%`);

  if (overlapRate < 10) {
    console.log(
      `\n💡 CONCLUSION: Very low overlap - Claude generates different resources each time`
    );
    console.log(
      `   This confirms the workflow issue is AI inconsistency, not matching logic`
    );
  } else if (overlapRate < 30) {
    console.log(`\n💡 CONCLUSION: Some consistency but room for improvement`);
  } else {
    console.log(`\n💡 CONCLUSION: Good consistency - issue might be elsewhere`);
  }

  console.log(
    `\n🗂️  Test files saved: ${results
      .map((r) => `test-run-${r.run}.json`)
      .join(", ")}`
  );
}

// Run the test
runConsistencyTest().catch(console.error);
