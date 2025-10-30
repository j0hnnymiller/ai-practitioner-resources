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

    const jsonResponse = completion.choices[0].message.content;
    console.log("✅ Received response from OpenAI");
    console.log(`   Response length: ${jsonResponse.length} characters`);

    // Parse and validate JSON
    try {
      // Clean up the response - sometimes AI adds markdown or extra text
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
      // Fix trailing commas
      jsonOnly = jsonOnly.replace(/,(\s*[}\]])/g, "$1");
      
      // Try multiple parsing strategies
      let resources;
      try {
        resources = JSON.parse(jsonOnly);
      } catch (firstError) {
        console.log("🔧 First parse failed, trying to fix common issues...");
        
        // Try to fix unescaped quotes by adding backslashes
        let fixedJson = jsonOnly.replace(/([^\\])"/g, (match, p1, offset, string) => {
          // Don't fix if it's a proper JSON delimiter
          const before = string[offset - 1];
          const after = string[offset + 2];
          if (before === ':' || before === ',' || before === '[' || before === '{' ||
              after === ',' || after === '}' || after === ']' || after === ':') {
            return match;
          }
          return p1 + '\\"';
        });
        
        try {
          resources = JSON.parse(fixedJson);
          console.log("✅ Fixed JSON parsing succeeded");
        } catch (secondError) {
          console.log("🔧 Second parse failed, trying manual property fixing...");
          
          // Last resort: try to fix property names that might be unquoted
          fixedJson = fixedJson.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
          
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
      console.error("Full response:", jsonResponse);
      console.error("Response preview:", jsonResponse.substring(0, 500));

      // Try to save the raw response for debugging
      try {
        const tmpDir = "/tmp";
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        fs.writeFileSync(path.join(tmpDir, "raw-response.txt"), jsonResponse);
        console.log(
          "🔍 Raw response saved to /tmp/raw-response.txt for debugging"
        );
      } catch (saveError) {
        console.error("Could not save raw response:", saveError.message);
      }

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
