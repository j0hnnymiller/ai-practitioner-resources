// Issue intake on open: enforce initial lane and request approval.
// - Add lane label "on the bench" (and remove any other lane labels)
// - Add tracking label "needs-approval" unless already implementation-ready
// - Post a short comment with the review checklist and quick approval commands

const fs = require("fs");
const fetch = require("node-fetch");

const LANES = ["at bat", "on deck", "in the hole", "on the bench"];

async function ghFetch(url, opts = {}) {
  const token = process.env.GITHUB_TOKEN || process.env.TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not set");
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

async function getIssue(owner, repo, number) {
  const res = await ghFetch(`/repos/${owner}/${repo}/issues/${number}`);
  return res.json();
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

async function ensureLabel(owner, repo, name, color, description) {
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

function stripLaneLabels(nameSet) {
  const lowerLanes = new Set(LANES.map((l) => l.toLowerCase()));
  return new Set([...nameSet].filter((n) => !lowerLanes.has(n.toLowerCase())));
}

async function setIssueLabels(owner, repo, number, names) {
  await ghFetch(`/repos/${owner}/${repo}/issues/${number}`, {
    method: "PATCH",
    body: JSON.stringify({ labels: names }),
  });
}

async function addComment(owner, repo, number, body) {
  await ghFetch(`/repos/${owner}/${repo}/issues/${number}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

function loadEvent() {
  const p = process.env.GITHUB_EVENT_PATH;
  if (!p) throw new Error("GITHUB_EVENT_PATH not set");
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const repoFull = process.env.GITHUB_REPOSITORY;
  if (!repoFull) throw new Error("GITHUB_REPOSITORY not set");
  const [owner, repo] = repoFull.split("/");
  const event = loadEvent();
  const number = event?.issue?.number;
  if (!number) throw new Error("Issue number not found in event payload");

  // Ensure tracking label exists
  await ensureLabel(
    owner,
    repo,
    "needs-approval",
    "7d8590",
    "Pending human review; not approved for implementation"
  );

  // Fetch current issue
  const issue = await getIssue(owner, repo, number);
  const labelSet = toNameSet(issue.labels);

  const hasImplementationReady = [...labelSet].some(
    (n) => n.toLowerCase() === "implementation ready"
  );

  // Enforce lane exclusivity and set initial lane to bench
  let newSet = stripLaneLabels(labelSet);
  newSet.add("on the bench");

  // Apply needs-approval unless already approved
  if (!hasImplementationReady) newSet.add("needs-approval");

  await setIssueLabels(owner, repo, number, [...newSet]);

  const comment = `Thanks for opening this issue!\n\nPM intake checklist (baseline):\n- [ ] Scope is clear and testable (acceptance criteria provided)\n- [ ] Dependencies identified and minimal (or resolved)\n- [ ] Risk acceptable\n- [ ] Independent enough to run in parallel (label \'independent\' or \'independence:high\' when true)\n- [ ] Priority score provided (label \'priority:NN\' or \'score:NN\')\n- [ ] Size estimated (label \'size:small|medium\'). Items labeled size:large will not be approved; please split into smaller sub-issues.\n\nIf this issue includes a prompt, please include a short prompt packet: Objective, Inputs, Tools/permissions, Constraints, Steps/strategy, Acceptance criteria, Evaluation, Priority score, Size, Independence, Risks, Links.\n\nType-specific checklists are documented in .github/prompts/modes/project-manager.md under \"Approval criteria by type\".\n\nIf approved, mark it \'implementation ready\' and assign a contributor.\n\nQuick commands (replace placeholders):\n\n- Approve:\n  - gh issue comment ${number} --body \"Approved — implementation ready. Rationale: <one-line>\"\n  - gh issue edit ${number} --add-label \"implementation ready\" --remove-label \"needs-approval\"\n\nThis issue has been placed on the bench initially. Lanes are rebalanced only when issues are closed.`;

  await addComment(owner, repo, number, comment);
  console.log(
    `#${number} initialized with lane 'on the bench' and review checklist.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
