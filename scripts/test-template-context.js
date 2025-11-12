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

function readProjectGuides() {
  const guides = {};

  // Read independence guide
  const independencePath = path.resolve(
    process.cwd(),
    ".github/prompts/INDEPENDENCE_GUIDE.md"
  );
  if (fs.existsSync(independencePath)) {
    guides.independence = fs.readFileSync(independencePath, "utf8");
  }

  // Read label validation guide
  const labelPath = path.resolve(
    process.cwd(),
    ".github/prompts/LABEL_VALIDATION_GUIDE.md"
  );
  if (fs.existsSync(labelPath)) {
    guides.labels = fs.readFileSync(labelPath, "utf8");
  }

  return guides;
}

function buildProjectGuidanceContext(guides) {
  let context = "";

  if (guides.independence) {
    // Include first 100 lines of independence guide (covers key concepts and criteria)
    const lines = guides.independence.split("\n").slice(0, 100);
    context += `\n\n## Independence Assessment Guidelines\n\n${lines.join(
      "\n"
    )}\n\n[...remaining content omitted for brevity]`;
  }

  if (guides.labels) {
    // Include first 80 lines of label validation guide (covers required labels and validation rules)
    const lines = guides.labels.split("\n").slice(0, 80);
    context += `\n\n## Label Validation Guidelines\n\n${lines.join(
      "\n"
    )}\n\n[...remaining content omitted for brevity]`;
  }

  return context;
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

// Test guides loading
const guides = readProjectGuides();
console.log("Project Guides:");
if (guides.independence) {
  console.log(
    `✓ INDEPENDENCE_GUIDE.md loaded (${guides.independence.length} chars)`
  );
} else {
  console.log(`✗ INDEPENDENCE_GUIDE.md not found`);
}
if (guides.labels) {
  console.log(
    `✓ LABEL_VALIDATION_GUIDE.md loaded (${guides.labels.length} chars)`
  );
} else {
  console.log(`✗ LABEL_VALIDATION_GUIDE.md not found`);
}

const guidanceContext = buildProjectGuidanceContext(guides);
console.log(
  `Combined guidance context: ${guidanceContext.length} characters\n`
);
console.log("---\n");

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

console.log("=== Total Context Size ===");
const totalContext = guidanceContext + buildTemplateContext("bug");
console.log(`Guidance + Bug Template: ${totalContext.length} characters`);
console.log(`Estimated tokens: ~${Math.ceil(totalContext.length / 4)}`);

console.log("\n=== Test Complete ===");
