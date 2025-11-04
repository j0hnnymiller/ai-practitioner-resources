#!/usr/bin/env node

/**
 * Test script to run the OpenAI prompt locally
 * This helps us see what the AI generates outside of the automation
 */

const fs = require("fs");
const path = require("path");
// Check if we have the API key
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY environment variable not set");
  console.log("");
  console.log("💡 To run this test locally:");
  console.log(
    "   1. Get your Anthropic API key from: https://console.anthropic.com/"
  );
  console.log(
    '   2. Set it in PowerShell: $env:ANTHROPIC_API_KEY="your-key-here"'
  );
  console.log("   3. Run this script: node test-prompt-local.js");
  console.log("");
  console.log("🔗 Alternative: Run a GitHub Actions test instead:");
  console.log('   gh workflow run "weekly-ai-resources-update.yml"');
  process.exit(1);
}

const PROMPT_PATH = path.join(
  __dirname,
  "..",
  ".github",
  "prompts",
  "ai-practitioner-resources-json.prompt.md"
);

async function testPromptLocally() {
  console.log("🚀 Testing OpenAI Prompt Locally");
  console.log("");

  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // Read the prompt file
    const promptContent = fs.readFileSync(PROMPT_PATH, "utf8");
    console.log("📄 Prompt loaded from:", PROMPT_PATH);
    console.log(`   Prompt length: ${promptContent.length} characters`);
    console.log("");

    console.log("⏳ Calling OpenAI API...");
    const startTime = Date.now();

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that generates JSON data according to schemas. Return ONLY valid JSON with no additional text, explanations, or markdown formatting. Ensure all property names and string values are properly quoted with double quotes.",
        },
        {
          role: "user",
          content: promptContent,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const duration = Date.now() - startTime;
    const jsonResponse = completion.choices[0].message.content;

    console.log("✅ Received response from OpenAI");
    console.log(`   Response length: ${jsonResponse.length} characters`);
    console.log(`   Duration: ${duration}ms`);
    console.log("");

    // Parse and validate JSON (using same logic as automation)
    try {
      // Clean up the response - same as automation script
      let cleanedResponse = jsonResponse.trim();

      // Remove markdown code blocks if present
      cleanedResponse = cleanedResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");

      // Find JSON object boundaries
      const jsonStart = cleanedResponse.indexOf("{");
      const jsonEnd = cleanedResponse.lastIndexOf("}") + 1;

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("No JSON object found in response");
      }

      let jsonOnly = cleanedResponse.substring(jsonStart, jsonEnd);
      console.log("🧹 Cleaned JSON for parsing");

      // Try to fix common JSON issues
      jsonOnly = jsonOnly.replace(/,(\s*[}\]])/g, "$1");

      // Try multiple parsing strategies
      let resources;
      try {
        resources = JSON.parse(jsonOnly);
      } catch (firstError) {
        console.log("🔧 First parse failed, trying to fix common issues...");

        // Try to fix unescaped quotes by adding backslashes
        let fixedJson = jsonOnly.replace(
          /([^\\])"/g,
          (match, p1, offset, string) => {
            // Don't fix if it's a proper JSON delimiter
            const before = string[offset - 1];
            const after = string[offset + 2];
            if (
              before === ":" ||
              before === "," ||
              before === "[" ||
              before === "{" ||
              after === "," ||
              after === "}" ||
              after === "]" ||
              after === ":"
            ) {
              return match;
            }
            return p1 + '\\"';
          }
        );

        try {
          resources = JSON.parse(fixedJson);
          console.log("✅ Fixed JSON parsing succeeded");
        } catch (secondError) {
          console.log(
            "🔧 Second parse failed, trying manual property fixing..."
          );

          // Last resort: try to fix property names that might be unquoted
          fixedJson = fixedJson.replace(
            /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g,
            '$1"$2":'
          );

          resources = JSON.parse(fixedJson);
          console.log("✅ Manual property fixing succeeded");
        }
      }

      // Basic validation
      if (!resources.resources || !Array.isArray(resources.resources)) {
        throw new Error(
          "Generated JSON does not contain a valid resources array"
        );
      }

      console.log("✅ JSON parsed successfully");
      console.log(`   Resources generated: ${resources.resources.length}`);
      console.log("");

      // Display the resources
      console.log("📋 Generated Resources:");
      console.log("");
      resources.resources.forEach((resource, index) => {
        console.log(`${index + 1}. ${resource.title}`);
        console.log(`   Type: ${resource.type} | Score: ${resource.score}`);
        console.log(`   Source: ${resource.source}`);
        console.log(`   Blurb: ${resource.blurb}`);
        console.log("");
      });

      // Save for comparison
      const outputPath = "local-test-results.json";
      fs.writeFileSync(outputPath, JSON.stringify(resources, null, 2));
      console.log(`💾 Results saved to: ${outputPath}`);
      console.log("");

      // Show introduction and analysis
      console.log("📝 Introduction:");
      console.log(resources.introduction);
      console.log("");

      if (resources.analysis) {
        console.log("📊 Analysis:");
        console.log(resources.analysis);
        console.log("");
      }

      console.log("✨ Local test completed successfully!");
    } catch (parseError) {
      console.error("❌ Failed to parse JSON response:", parseError.message);
      console.error("Raw response:", jsonResponse);

      // Save raw response for debugging
      fs.writeFileSync("local-test-raw-response.txt", jsonResponse);
      console.log("🔍 Raw response saved to: local-test-raw-response.txt");
    }
  } catch (error) {
    console.error("❌ Failed to call OpenAI API:", error.message);
    process.exit(1);
  }
}

testPromptLocally();
