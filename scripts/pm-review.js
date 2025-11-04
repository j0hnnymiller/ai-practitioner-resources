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
    throw new Error(`GitHub API ${res.status} ${res.statusText} for ${url}: ${text}`);
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
    const file = path.resolve(process.cwd(), ".github/prompts/modes/project-manager.md");
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

async function generatePMReview({ title, body, labelsText, url }) {
  const apiKey = env("OPENAI_API_KEY", false);
  if (!apiKey) {
    return {
      skipped: true,
      content:
        "Copilot PM review skipped: OPENAI_API_KEY is not configured. Configure the secret and re-run to enable AI review.",
    };
  }

  const guidance = readPMGuidance();
  const model = process.env.PM_MODEL || "gpt-4o-mini";
  const system = `You are GitHub Copilot acting as a pragmatic Project Manager. Review a GitHub issue for readiness using the baseline checklist and review protocol below. Be concise, specific, and actionable. Avoid generic advice.

Return a compact report:
- Findings by checklist item (Pass / Needs work / Unclear) with 1–2 bullets of evidence or gaps each.
- Concrete follow-ups/questions for the author.
- Optional label suggestions (e.g., size:small|medium|large, priority:NN, independence:high|low) only if confidently supported by the text.
- Final verdict: "Ready" or "Not ready" with a one‑line rationale.

If information is missing, explicitly call it out. Do not invent details.

Guidance:\n\n${guidance ? guidance : "(project-manager.md not found; use baseline: scope clear/testable, independence, size, priority, risks, parallel-safety)"}`;

  const user = `Issue to review:\nTitle: ${title}\nURL: ${url}\nLabels: ${labelsText}\n\nBody:\n${body || "(no body)"}`;

  const payload = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.2,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API ${res.status} ${res.statusText}: ${text}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  return { skipped: false, content: content || "(No content)" };
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

  const { skipped, content } = await generatePMReview({
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
  console.log(`#${number} PM review ${skipped ? "skipped (missing key)" : "posted"}.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
