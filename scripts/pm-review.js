// Copilot Project Manager review: analyze a newly opened issue and post a structured review comment.
// - Uses Anthropic Claude via ANTHROPIC_API_KEY
// - Reads issue context from GITHUB_EVENT_PATH and repository envs
// - Posts a comment summarizing checklist findings and specific gaps

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

function env(name, required = true) {
  const v = process.env[name];
  if (required && !v) throw new Error(`${name} not set`);
  return v;
}

async function ghFetch(url, opts = {}) {
  // Use the same token precedence as intake: prefer PAT when provided
  const token = process.env.TOKEN || process.env.GITHUB_TOKEN;
  if (!token) throw new Error("TOKEN/GITHUB_TOKEN not set");
  const base = process.env.GITHUB_API_URL || "https://api.github.com";
  const res = await fetch(base + url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GitHub API ${res.status} ${res.statusText} for ${url}: ${text}`
    );
  }
  return res;
}

function loadEvent() {
  const p = env("GITHUB_EVENT_PATH");
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

async function getIssue(owner, repo, number) {
  const res = await ghFetch(`/repos/${owner}/${repo}/issues/${number}`);
  return res.json();
}

async function addComment(owner, repo, number, body) {
  await ghFetch(`/repos/${owner}/${repo}/issues/${number}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

async function createIssue(owner, repo, title, body, labels) {
  const res = await ghFetch(`/repos/${owner}/${repo}/issues`, {
    method: "POST",
    body: JSON.stringify({ title, body, labels }),
  });
  return res.json();
}

async function isContributor(owner, repo, username) {
  try {
    // Check if user is in the contributors list
    const res = await ghFetch(
      `/repos/${owner}/${repo}/contributors?per_page=100`
    );
    const contributors = await res.json();
    return contributors.some(
      (c) => c.login.toLowerCase() === username.toLowerCase()
    );
  } catch {
    // If check fails, assume not a contributor (conservative)
    return false;
  }
}

async function assignIssue(owner, repo, number, assignees) {
  if (!assignees || assignees.length === 0) return;
  await ghFetch(`/repos/${owner}/${repo}/issues/${number}`, {
    method: "PATCH",
    body: JSON.stringify({ assignees }),
  });
}

async function updateIssueBody(owner, repo, number, body) {
  await ghFetch(`/repos/${owner}/${repo}/issues/${number}`, {
    method: "PATCH",
    body: JSON.stringify({ body }),
  });
}

function readPMGuidance() {
  try {
    const file = path.resolve(
      process.cwd(),
      ".github/prompts/modes/project-manager.md"
    );
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callAnthropicWithRetry(url, payload, apiKey, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        const status = res.status;

        // Don't retry on client errors (4xx) except rate limits (429)
        if (status >= 400 && status < 500 && status !== 429) {
          throw new Error(`Anthropic API ${status} ${res.statusText}: ${text}`);
        }

        // Retry on server errors (5xx) and rate limits (429)
        lastError = new Error(
          `Anthropic API ${status} ${res.statusText}: ${text}`
        );

        if (attempt < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.warn(
            `Anthropic API error (attempt ${attempt}/${maxRetries}), retrying in ${backoffMs}ms...`
          );
          await sleep(backoffMs);
          continue;
        }
        throw lastError;
      }

      return await res.json();
    } catch (error) {
      lastError = error;

      // Don't retry on network errors that are likely permanent
      if (
        error.code === "ENOTFOUND" ||
        error.code === "ECONNREFUSED" ||
        error.message.includes("4")
      ) {
        throw error;
      }

      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.warn(
          `Network error (attempt ${attempt}/${maxRetries}), retrying in ${backoffMs}ms: ${error.message}`
        );
        await sleep(backoffMs);
        continue;
      }
      throw lastError;
    }
  }

  throw lastError;
}

function readPMPrompt() {
  // Priority order: AI assistant mode > dedicated PM review > project manager mode
  const aiAssistant = path.resolve(
    process.cwd(),
    ".github/prompts/modes/ai-assistant-pm.md"
  );
  if (fs.existsSync(aiAssistant)) return fs.readFileSync(aiAssistant, "utf8");

  const dedicated = path.resolve(process.cwd(), ".github/prompts/pm-review.md");
  if (fs.existsSync(dedicated)) return fs.readFileSync(dedicated, "utf8");

  return readPMGuidance();
}

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

  if (!fs.existsSync(templatePath)) return null;

  return fs.readFileSync(templatePath, "utf8");
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

function buildTemplateContext(issueType) {
  const template = readIssueTemplate(issueType);
  if (!template) return "";

  return `\n\n## Issue Template Reference\n\nThe following is the expected structure for a ${issueType} issue in this project. Use this as a reference when evaluating completeness and when providing reformattedBody:\n\n\`\`\`yaml\n${template}\n\`\`\`\n\nWhen reformatting, extract the field values from the YAML structure above and present them in clean Markdown format following the same logical organization.`;
}

function buildProjectGuidanceContext(guides) {
  let context = "";

  if (guides.independence) {
    // Include first 100 lines of independence guide (covers key concepts and criteria)
    const lines = guides.independence.split("\n").slice(0, 100);
    context += `\n\n## Independence Assessment Guidelines\n\n${lines.join("\n")}\n\n[...remaining content omitted for brevity]`;
  }

  if (guides.labels) {
    // Include first 80 lines of label validation guide (covers required labels and validation rules)
    const lines = guides.labels.split("\n").slice(0, 80);
    context += `\n\n## Label Validation Guidelines\n\n${lines.join("\n")}\n\n[...remaining content omitted for brevity]`;
  }

  return context;
}

async function generatePMReview({ title, body, labelsText, url }) {
  const apiKey = env("ANTHROPIC_API_KEY", false);
  if (!apiKey) {
    return {
      skipped: true,
      content:
        "Copilot PM review skipped: ANTHROPIC_API_KEY is not configured. Configure the secret and re-run to enable AI review.",
    };
  }

  const guidance = readPMPrompt();
  const model =
    process.env.PM_MODEL ||
    process.env.ANTHROPIC_MODEL ||
    "claude-4.5-sonnet-latest";

  // Detect issue type and load appropriate template
  const existingLabels = labelsText
    ? labelsText.split(",").map((l) => l.trim())
    : [];
  const issueType = detectIssueType(title, body, existingLabels);
  const templateContext = buildTemplateContext(issueType);

  // Load project guidance documents
  const guides = readProjectGuides();
  const guidanceContext = buildProjectGuidanceContext(guides);

  console.log(`Detected issue type: ${issueType}`);
  if (templateContext) {
    console.log(`Loaded template: ${issueType}`);
  }
  if (guides.independence) {
    console.log(`Loaded INDEPENDENCE_GUIDE.md`);
  }
  if (guides.labels) {
    console.log(`Loaded LABEL_VALIDATION_GUIDE.md`);
  }

  // Use the prompt file verbatim as the system message to avoid drift
  const system =
    guidance ||
    "(pm-review.md not found; include baseline: strict JSON then concise human review)";

  const user = `Issue to review:\nTitle: ${title}\nURL: ${url}\nLabels: ${labelsText}\n\nBody:\n${
    body || "(no body)"
  }${templateContext}${guidanceContext}`;

  // First call: request JSON only (Anthropic Messages API)
  const payload1 = {
    model,
    system,
    max_tokens: 1500,
    temperature: 0.1,
    messages: [{ role: "user", content: [{ type: "text", text: user }] }],
  };

  const data1 = await callAnthropicWithRetry(
    "https://api.anthropic.com/v1/messages",
    payload1,
    apiKey
  );
  const contentBlocks1 = data1?.content || [];
  const jsonText = contentBlocks1
    .map((b) => b?.text || "")
    .join("\n")
    .trim();
  let parsed = null;
  try {
    // Extract JSON if wrapped in fences
    const match = jsonText.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : JSON.parse(jsonText);

    // Normalize: ensure required fields exist
    // If size is large but needsSplit is missing, auto-set it
    if (parsed.size === "large" && parsed.needsSplit === undefined) {
      console.log(
        "⚠️  size:large detected but needsSplit is undefined. Auto-setting to true."
      );
      parsed.needsSplit = true;
    }

    // Ensure needsSplit field exists (default to false if missing and size is not large)
    if (parsed.needsSplit === undefined) {
      parsed.needsSplit = false;
    }

    // Ensure subIssues field exists (default to empty array if missing)
    if (!Array.isArray(parsed.subIssues)) {
      parsed.subIssues = [];
    }

    // If needsSplit is true but no subIssues provided, this is an error - log warning and disable splitting
    if (parsed.needsSplit === true && parsed.subIssues.length === 0) {
      console.log(
        "⚠️  WARNING: needsSplit is true but subIssues array is empty!"
      );
      console.log(
        "    AI did not provide sub-issue breakdown. Disabling automatic splitting."
      );
      console.log(
        "    The human-readable comment should contain splitting recommendations."
      );
      parsed.needsSplit = false;
    }

    // Ensure reformattedBody field exists (default to null if missing)
    if (parsed.reformattedBody === undefined) {
      parsed.reformattedBody = null;
    }

    // Debug logging: output the parsed JSON structure
    console.log("=== PM REVIEW JSON DEBUG ===");
    console.log("Full parsed JSON:", JSON.stringify(parsed, null, 2));
    console.log("needsSplit:", parsed.needsSplit);
    console.log(
      "subIssues array length:",
      Array.isArray(parsed.subIssues) ? parsed.subIssues.length : "not an array"
    );
    console.log(
      "reformattedBody:",
      parsed.reformattedBody ? "present" : "null"
    );
    console.log("=== END DEBUG ===");
  } catch (e) {
    throw new Error(
      "Failed to parse PM review JSON: " + e.message + "\nText: " + jsonText
    );
  }

  // Second call: human-friendly review text
  const payload2 = {
    model,
    system,
    max_tokens: 2000,
    temperature: 0.8,
    messages: [
      { role: "user", content: [{ type: "text", text: user }] },
      {
        role: "assistant",
        content: [{ type: "text", text: JSON.stringify(parsed) }],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Now provide the concise report for the author (no JSON).",
          },
        ],
      },
    ],
  };
  const data2 = await callAnthropicWithRetry(
    "https://api.anthropic.com/v1/messages",
    payload2,
    apiKey
  );
  const contentBlocks2 = data2?.content || [];
  const content = contentBlocks2
    .map((b) => b?.text || "")
    .join("\n")
    .trim();

  return { skipped: false, content: content || "(No content)", result: parsed };
}

async function main() {
  try {
    const repoFull = env("GITHUB_REPOSITORY");
    const [owner, repo] = repoFull.split("/");
    const event = loadEvent();
    const number = event?.issue?.number;
    if (!number) throw new Error("Issue number not found in event payload");

    const issue = await getIssue(owner, repo, number);
    const labelsText = (issue.labels || [])
      .map((l) => (typeof l === "string" ? l : l.name))
      .filter(Boolean)
      .join(", ");

    const { skipped, content, result } = await generatePMReview({
      title: issue.title,
      body: issue.body,
      labelsText,
      url: issue.html_url,
    });

    const header = `Copilot PM review — automated checklist assessment`;
    const footer = skipped
      ? "\n\n_(Set ANTHROPIC_API_KEY to enable AI review.)_"
      : "\n\n_(Authored by Copilot — Project Manager mode)_";
    const body = `### ${header}\n\n${content}${footer}`;
    await addComment(owner, repo, number, body);

    // Apply labels per AI decision
    if (!skipped && result && typeof result === "object") {
      await applyLabelsFromResult(owner, repo, number, result, issue.labels);

      // Handle large issues that need to be split
      if (
        result.needsSplit === true &&
        Array.isArray(result.subIssues) &&
        result.subIssues.length > 0
      ) {
        console.log(
          `Issue #${number} is too large and will be split into ${result.subIssues.length} sub-issues.`
        );

        const createdSubIssues = [];
        for (const subIssue of result.subIssues) {
          const subBody = `${subIssue.body}\n\n---\n\n**Parent Issue:** #${number}`;
          const created = await createIssue(
            owner,
            repo,
            subIssue.title,
            subBody,
            subIssue.labels || []
          );
          createdSubIssues.push(created);
          console.log(`Created sub-issue #${created.number}: ${created.title}`);
        }

        // Add comment to parent issue with links to sub-issues
        const subIssueLinks = createdSubIssues
          .map((si) => `- #${si.number}: ${si.title}`)
          .join("\n");
        const splitComment =
          `This issue has been split into the following sub-issues:\n\n${subIssueLinks}\n\n` +
          `Please implement each sub-issue separately. This parent issue will remain open for tracking purposes and is labeled \`needs-review\`.`;
        await addComment(owner, repo, number, splitComment);

        // Ensure parent issue has needs-review label
        const parentLabels = toNameSet(issue.labels);
        parentLabels.add("needs-review");
        await setIssueLabels(owner, repo, number, Array.from(parentLabels));
      }

      // Handle issue body reformatting if needed
      if (
        result.reformattedBody &&
        typeof result.reformattedBody === "string" &&
        result.reformattedBody.trim().length > 0
      ) {
        console.log(
          `Issue #${number} body will be reformatted to conform to template.`
        );
        await updateIssueBody(owner, repo, number, result.reformattedBody);
        const reformatComment = `The issue description has been automatically reformatted to conform to the appropriate template structure for better clarity and consistency.`;
        await addComment(owner, repo, number, reformatComment);
      }

      // Apply assignment if ready and author is a contributor
      if (result.ready === true && issue.user && issue.user.login) {
        const isAuthorContributor = await isContributor(
          owner,
          repo,
          issue.user.login
        );
        if (isAuthorContributor) {
          await assignIssue(owner, repo, number, [issue.user.login]);
        }
      }
    }
    console.log(
      `#${number} PM review ${
        skipped ? "skipped (missing key)" : "posted and labels applied"
      }.`
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}

async function listLabels(owner, repo) {
  const labels = [];
  let page = 1;
  while (true) {
    const res = await ghFetch(
      `/repos/${owner}/${repo}/labels?per_page=100&page=${page}`
    );
    const data = await res.json();
    labels.push(...data);
    if (data.length < 100) break;
    page += 1;
  }
  return labels;
}

async function ensureLabel(
  owner,
  repo,
  name,
  color = "ededed",
  description = ""
) {
  const existing = await listLabels(owner, repo);
  const found = existing.find(
    (l) => l.name.toLowerCase() === name.toLowerCase()
  );
  if (found) return found;
  const res = await ghFetch(`/repos/${owner}/${repo}/labels`, {
    method: "POST",
    body: JSON.stringify({ name, color, description }),
  });
  return res.json();
}

function toNameSet(labels) {
  return new Set(
    (labels || [])
      .map((l) => (typeof l === "string" ? l : l.name))
      .filter(Boolean)
  );
}

async function setIssueLabels(owner, repo, number, names) {
  await ghFetch(`/repos/${owner}/${repo}/issues/${number}`, {
    method: "PATCH",
    body: JSON.stringify({ labels: names }),
  });
}

async function applyLabelsFromResult(
  owner,
  repo,
  number,
  result,
  existingLabels
) {
  const current = toNameSet(existingLabels);

  // Apply exactly what the AI returned - no business logic here
  const adds = new Set(
    Array.isArray(result?.labels?.add) ? result.labels.add : []
  );
  const removes = new Set(
    Array.isArray(result?.labels?.remove) ? result.labels.remove : []
  );

  // Ensure labels exist before setting
  const finalAdds = Array.from(adds).filter((n) => !current.has(n));
  for (const name of finalAdds) {
    await ensureLabel(owner, repo, name, "d4c5f9");
    current.add(name);
  }

  for (const name of removes) {
    current.delete(name);
  }

  await setIssueLabels(owner, repo, number, Array.from(current));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
