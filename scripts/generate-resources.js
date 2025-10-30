#!/usr/bin/env node

/**
 * Generate new resources using OpenAI API
 *
 * This script reads the AI prompt from the instructions directory,
 * sends it to OpenAI API, and saves the generated JSON to /tmp/new-resources.json
 *
 * Required environment variables:
 *   - OPENAI_API_KEY: API key for OpenAI GPT-4 access
 */

const { OpenAI } = require("openai");
const fs = require("fs");
const path = require("path");

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PROMPT_PATH = path.join(
  __dirname,
  "..",
  ".github",
  "instructions",
  "ai-practitioner-resources-json.prompt.md"
);

// Validate configuration
if (!OPENAI_API_KEY) {
  console.error("❌ Error: OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

if (!fs.existsSync(PROMPT_PATH)) {
  console.error("❌ Error: Prompt file not found at:", PROMPT_PATH);
  process.exit(1);
}

/**
 * Generate resources using OpenAI API
 */
async function generateResources() {
  console.log("🤖 Generating new resources using OpenAI API...");

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });

  // Read the prompt file
  const promptContent = fs.readFileSync(PROMPT_PATH, "utf8");
  console.log("📄 Prompt loaded from:", PROMPT_PATH);
  console.log(`   Prompt length: ${promptContent.length} characters`);

  try {
    console.log("⏳ Calling OpenAI API (this may take a minute)...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that generates JSON data according to schemas. Return only valid JSON with no additional text.",
        },
        {
          role: "user",
          content: promptContent,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const jsonResponse = completion.choices[0].message.content;
    console.log("✅ Received response from OpenAI");
    console.log(`   Response length: ${jsonResponse.length} characters`);

    // Parse and validate JSON
    try {
      const resources = JSON.parse(jsonResponse);

      // Basic validation
      if (!resources.resources || !Array.isArray(resources.resources)) {
        throw new Error(
          "Generated JSON does not contain a valid resources array"
        );
      }

      console.log("✅ JSON parsed successfully");
      console.log(`   Resources generated: ${resources.resources.length}`);

      // Create /tmp directory if it doesn't exist
      const tmpDir = "/tmp";
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      // Write to temporary file
      fs.writeFileSync(
        path.join(tmpDir, "new-resources.json"),
        JSON.stringify(resources, null, 2)
      );

      console.log("✅ New resources saved to /tmp/new-resources.json");

      return resources;
    } catch (parseError) {
      console.error("❌ Failed to parse JSON response:", parseError.message);
      console.error("Response preview:", jsonResponse.substring(0, 500));
      throw new Error(`Invalid JSON generated: ${parseError.message}`);
    }
  } catch (error) {
    console.error("❌ Failed to generate resources:", error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log("🚀 Generate Resources Script\n");
  await generateResources();
  console.log("\n✨ Done!\n");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
