// Test script to verify template context loading
const fs = require("fs");
const path = require("path");

function detectIssueType(title, body, existingLabels) {
  // Check existing labels first
  const labelTypes = {
    bug: ["bug"],
    feature: ["feature", "enhancement"],
    "ui-ux": ["ui/ux", "design"],
    idea: ["idea"],
    refactor: ["refactor"],
    documentation: ["documentation"],
  };

  for (const [type, labels] of Object.entries(labelTypes)) {
    if (labels.some((l) => existingLabels.includes(l))) {
      return type;
    }
  }

  // Infer from title patterns
  const titleLower = title.toLowerCase();
  if (titleLower.includes("bug:") || titleLower.includes("[bug]")) return "bug";
  if (titleLower.includes("feature:") || titleLower.includes("feat:"))
    return "feature";
  if (titleLower.includes("ui/ux:") || titleLower.includes("design:"))
    return "ui-ux";

  // Infer from body content
  const bodyLower = (body || "").toLowerCase();
  if (
    bodyLower.includes("bug description") ||
    bodyLower.includes("steps to reproduce") ||
    bodyLower.includes("expected behavior")
  )
    return "bug";
  if (
    bodyLower.includes("feature description") ||
    bodyLower.includes("implementation prompt")
  )
    return "feature";
  if (
    bodyLower.includes("current user experience") ||
    bodyLower.includes("proposed improvement")
  )
    return "ui-ux";

  // Default to feature for general enhancement requests
  return "feature";
}

function readIssueTemplate(issueType) {
  const templateMap = {
    bug: "bug-report.yml",
    feature: "feature-request.yml",
    "ui-ux": "ui-ux-improvement.yml",
  };

  const templateFile = templateMap[issueType];
  if (!templateFile) return null;

  const templatePath = path.resolve(
    process.cwd(),
    ".github/ISSUE_TEMPLATE",
    templateFile
  );

  if (!fs.existsSync(templatePath)) {
    console.error(`Template not found: ${templatePath}`);
    return null;
  }

  return fs.readFileSync(templatePath, "utf8");
}

function buildTemplateContext(issueType) {
  const template = readIssueTemplate(issueType);
  if (!template) return "";

  return `\n\n## Issue Template Reference\n\nThe following is the expected structure for a ${issueType} issue in this project. Use this as a reference when evaluating completeness and when providing reformattedBody:\n\n\`\`\`yaml\n${template}\n\`\`\`\n\nWhen reformatting, extract the field values from the YAML structure above and present them in clean Markdown format following the same logical organization.`;
}

// Test cases
const testCases = [
  {
    name: "Bug with bug label",
    title: "[TI]: Bug Application Crashes on Startup",
    body: "**TI**\n### Description\n\nThe application crashes immediately after launching.",
    labels: ["bug", "size:small"],
  },
  {
    name: "Feature request",
    title: "Feature Request: Dark Mode",
    body: "Add dark mode support",
    labels: ["enhancement"],
  },
  {
    name: "UI/UX improvement",
    title: "UI/UX: Improve navigation",
    body: "The current navigation is confusing",
    labels: ["ui/ux", "design"],
  },
  {
    name: "Bug without explicit label",
    title: "Bug: Error on login",
    body: "Steps to reproduce:\n1. Go to login page\n2. See error",
    labels: [],
  },
];

console.log("=== Testing Template Context Loading ===\n");

testCases.forEach((test) => {
  console.log(`Test: ${test.name}`);
  console.log(`Title: ${test.title}`);
  console.log(`Labels: ${test.labels.join(", ")}`);

  const issueType = detectIssueType(test.title, test.body, test.labels);
  console.log(`Detected Type: ${issueType}`);

  const templateContext = buildTemplateContext(issueType);
  if (templateContext) {
    console.log(`✓ Template loaded successfully`);
    console.log(`Template size: ${templateContext.length} characters`);
  } else {
    console.log(`✗ No template found for type: ${issueType}`);
  }

  console.log("---\n");
});

console.log("=== Test Complete ===");
