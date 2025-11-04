// Copilot Project Manager review: analyze a newly opened issue and post a structured review comment.
// - Uses OpenAI via OPENAI_API_KEY
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

function readPMPrompt() {
  // Prefer dedicated PM review prompt, fallback to mode guidance
  const preferred = path.resolve(process.cwd(), ".github/prompts/pm-review.md");
  if (fs.existsSync(preferred)) return fs.readFileSync(preferred, "utf8");
  return readPMGuidance();
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
  const model = process.env.PM_MODEL || process.env.ANTHROPIC_MODEL || "claude-3.5-sonnet-latest";
  // Use the prompt file verbatim as the system message to avoid drift
  const system = guidance || "(pm-review.md not found; include baseline: strict JSON then concise human review)";

  const user = `Issue to review:\nTitle: ${title}\nURL: ${url}\nLabels: ${labelsText}\n\nBody:\n${
    body || "(no body)"
  }`;

  // First call: request JSON only (Anthropic Messages API)
  const payload1 = {
    model,
    system,
    max_tokens: 1500,
    temperature: 0.1,
    messages: [
      { role: "user", content: [{ type: "text", text: user }] },
    ],
  };

  const res1 = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload1),
  });
  if (!res1.ok) {
    const text = await res1.text();
    throw new Error(`Anthropic API ${res1.status} ${res1.statusText}: ${text}`);
  }
  const data1 = await res1.json();
  const contentBlocks1 = data1?.content || [];
  const jsonText = contentBlocks1.map((b) => b?.text || "").join("\n").trim();
  let parsed = null;
  try {
    // Extract JSON if wrapped in fences
    const match = jsonText.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : JSON.parse(jsonText);
  } catch (e) {
    throw new Error("Failed to parse PM review JSON: " + e.message + "\nText: " + jsonText);
  }

  // Second call: human-friendly review text
  const payload2 = {
    model,
    system,
    max_tokens: 2000,
    temperature: 0.2,
    messages: [
      { role: "user", content: [ { type: "text", text: user } ] },
      { role: "assistant", content: [ { type: "text", text: JSON.stringify(parsed) } ] },
      { role: "user", content: [ { type: "text", text: "Now provide the concise report for the author (no JSON)." } ] },
    ],
  };
  const res2 = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload2),
  });
  if (!res2.ok) {
    const text = await res2.text();
    throw new Error(`Anthropic API ${res2.status} ${res2.statusText}: ${text}`);
  }
  const data2 = await res2.json();
  const contentBlocks2 = data2?.content || [];
  const content = contentBlocks2.map((b) => b?.text || "").join("\n").trim();

  return { skipped: false, content: content || "(No content)", result: parsed };
}

async function main() {
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
    ? "\n\n_(Set OPENAI_API_KEY to enable AI review.)_"
    : "\n\n_(Authored by Copilot — Project Manager mode)_";
  const body = `### ${header}\n\n${content}${footer}`;
  await addComment(owner, repo, number, body);

  // Apply labels per AI decision
  if (!skipped && result && typeof result === "object") {
    await applyLabelsFromResult(owner, repo, number, result, issue.labels);
  }
  console.log(`#${number} PM review ${skipped ? "skipped (missing key)" : "posted and labels applied"}.`);
}

async function listLabels(owner, repo) {
  const labels = [];
  let page = 1;
  while (true) {
    const res = await ghFetch(`/repos/${owner}/${repo}/labels?per_page=100&page=${page}`);
    const data = await res.json();
    labels.push(...data);
    if (data.length < 100) break;
    page += 1;
  }
  return labels;
}

async function ensureLabel(owner, repo, name, color = "ededed", description = "") {
  const existing = await listLabels(owner, repo);
  const found = existing.find((l) => l.name.toLowerCase() === name.toLowerCase());
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

async function applyLabelsFromResult(owner, repo, number, result, existingLabels) {
  const current = toNameSet(existingLabels);

  const adds = new Set(Array.isArray(result?.labels?.add) ? result.labels.add : []);
  const removes = new Set(Array.isArray(result?.labels?.remove) ? result.labels.remove : []);

  // Derived labels from fields
  if (result?.size && ["small", "medium", "large"].includes(result.size)) {
    adds.add(`size:${result.size}`);
  }
  if (Number.isFinite(result?.priorityScore)) {
    const score = Math.max(0, Math.min(100, Math.round(result.priorityScore)));
    adds.add(`priority:${score}`);
  }
  if (result?.independence && ["high", "low"].includes(result.independence)) {
    adds.add(`independence:${result.independence}`);
    if (result.independence === "high") adds.add("independent");
  }
  if (result?.riskLevel && ["low", "medium", "high"].includes(result.riskLevel)) {
    adds.add(`risk:${result.riskLevel}`);
  }

  // Enforce rule: issues that need work must NOT have needs-approval
  if (result?.ready === false) {
    removes.add("needs-approval");
    adds.add("needs-clarification");
  }

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
