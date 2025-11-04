// Local runner for Copilot PM review prompt against a specific issue number.
// - Fetches issue via GitHub CLI (gh api)
// - Uses .github/prompts/pm-review.md prompt
// - Calls OpenAI and prints both JSON decision and human review to stdout

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const fetch = require("node-fetch");

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function readPrompt() {
  const p = path.resolve(process.cwd(), ".github/prompts/pm-review.md");
  if (!fs.existsSync(p)) die("Prompt file not found: .github/prompts/pm-review.md");
  return fs.readFileSync(p, "utf8");
}

function getIssue(owner, repo, number) {
  try {
    const out = execFileSync(
      process.platform === "win32" ? "gh.exe" : "gh",
      ["api", `repos/${owner}/${repo}/issues/${number}`],
      { encoding: "utf8" }
    );
    return JSON.parse(out);
  } catch (e) {
    die("Failed to fetch issue via gh api: " + (e.stderr || e.message));
  }
}

async function callAnthropic(model, system, user) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) die("ANTHROPIC_API_KEY is not set in your environment.");

  const payload = {
    model,
    system,
    max_tokens: 2000,
    temperature: 0.8,
    messages: [
      { role: "user", content: [{ type: "text", text: user }] },
    ],
  };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
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
    die(`Anthropic API ${res.status} ${res.statusText}: ${text}`);
  }
  const data = await res.json();
  const contentBlocks = data?.content || [];
  return contentBlocks.map((b) => b?.text || "").join("\n").trim();
}

async function main() {
  const [, , numArg, ownerArg, repoArg] = process.argv;
  if (!numArg) die("Usage: node scripts/pm-review-local.js <issueNumber> [owner] [repo]");
  const number = Number(numArg);
  if (!Number.isFinite(number)) die("Issue number must be a number");

  // Infer owner/repo from git remote if not passed
  let owner = ownerArg;
  let repo = repoArg;
  if (!owner || !repo) {
    try {
      const remote = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim();
      // Match https://github.com/owner/repo.git or git@github.com:owner/repo.git
      const m = remote.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?/i);
      if (m) {
        owner = owner || m[1];
        repo = repo || m[2];
      }
    } catch (_) {}
  }
  if (!owner || !repo) die("Owner/repo not provided and could not infer from git remote.");

  const issue = getIssue(owner, repo, number);
  const labelsText = (issue.labels || []).map((l) => (typeof l === "string" ? l : l.name)).filter(Boolean).join(", ");

  const prompt = readPrompt();
  const model = process.env.PM_MODEL || process.env.ANTHROPIC_MODEL || "claude-4.5-sonnet-latest";
  const system = prompt;
  const user = `Issue to review:\nTitle: ${issue.title}\nURL: ${issue.html_url}\nLabels: ${labelsText}\n\nBody:\n${issue.body || "(no body)"}`;

  // First: JSON output
  const jsonText = await callAnthropic(model, system, user);
  let parsed;
  try {
    const match = jsonText.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : JSON.parse(jsonText);
  } catch (e) {
    die("Failed to parse JSON from model output:\n" + jsonText + "\nError: " + e.message);
  }

  // Second: human-facing review referencing the JSON
  const system2 = system + "\n\n(You have already produced the JSON. Now produce the concise human-facing review only.)";
  const user2 = user + "\n\nJSON decision above. Provide the concise report now.";
  const reviewText = await callAnthropic(model, system2, user2);

  console.log("===== PM REVIEW JSON =====\n" + JSON.stringify(parsed, null, 2));
  console.log("\n===== PM REVIEW (HUMAN) =====\n" + reviewText.trim());
}

main().catch((e) => die(e.stack || e.message));
