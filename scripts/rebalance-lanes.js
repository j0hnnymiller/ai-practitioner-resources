// Rebalance issue lanes on close-only events.
// Rules implemented (see .github/prompts/modes/project-manager.md):
// - Lanes: "at bat", "on deck", "in the hole", "on the bench" (exactly one per issue)
// - Caps: 3 each for at bat/on deck/in the hole
// - Active pipeline only includes issues labeled "implementation ready"
// - Choose top items by Priority Score desc; tiebreakers: independence (true first), smaller size, older issue
// - Independence: label "independent" or "independence:high" → true; default false
// - Size labels: "size:small|medium|large" → small<medium<large; default medium
// - Bench everything else (including not implementation-ready)

const fetch = require("node-fetch");

const LANES = ["at bat", "on deck", "in the hole", "on the bench"];

function toLabelSet(labels) {
  return new Set(
    labels
      .map((l) => (typeof l === "string" ? l : l.name))
      .filter(Boolean)
      .map((n) => n.trim())
  );
}

function hasLabel(labelsSet, name) {
  const target = name.toLowerCase();
  for (const l of labelsSet) {
    if (l.toLowerCase() === target) return true;
  }
  return false;
}

function extractScore(labelsSet) {
  // Look for labels like "priority:85" or "score:92"
  let score = 0;
  for (const l of labelsSet) {
    const m = String(l)
      .toLowerCase()
      .match(/^(?:priority|score):\s*(\d{1,3})$/);
    if (m) {
      const n = Number(m[1]);
      if (!Number.isNaN(n))
        score = Math.max(score, Math.min(100, Math.max(0, n)));
    }
  }
  return score;
}

function extractIndependence(labelsSet) {
  if ([...labelsSet].some((l) => String(l).toLowerCase() === "independent"))
    return true;
  const indep = [...labelsSet].find((l) =>
    String(l).toLowerCase().startsWith("independence:")
  );
  if (indep) {
    const val = String(indep).split(":")[1]?.trim().toLowerCase();
    return val === "high" || val === "yes" || val === "true";
  }
  return false;
}

function extractSizeRank(labelsSet) {
  // small=0, medium=1, large=2 (default medium)
  const size = [...labelsSet].find((l) =>
    String(l).toLowerCase().startsWith("size:")
  );
  const v = String(size || "")
    .split(":")[1]
    ?.trim()
    .toLowerCase();
  if (v === "small") return 0;
  if (v === "large") return 2;
  return 1; // medium or unknown
}

function getLane(labelsSet) {
  for (const lane of LANES) {
    if (hasLabel(labelsSet, lane)) return lane;
  }
  return null;
}

function removeLaneLabels(labelsSet) {
  return new Set(
    [...labelsSet].filter(
      (l) =>
        !LANES.map((x) => x.toLowerCase()).includes(String(l).toLowerCase())
    )
  );
}

function cmpIssues(a, b) {
  // Desc score
  if (b.score !== a.score) return b.score - a.score;
  // Independence true first
  if (a.independent !== b.independent)
    return (b.independent ? 1 : 0) - (a.independent ? 1 : 0);
  // Smaller size rank first
  if (a.sizeRank !== b.sizeRank) return a.sizeRank - b.sizeRank;
  // Older (earlier created_at) first
  const at = new Date(a.created_at).getTime();
  const bt = new Date(b.created_at).getTime();
  return at - bt;
}

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

async function listOpenIssues(owner, repo) {
  const items = [];
  let page = 1;
  while (true) {
    const res = await ghFetch(
      `/repos/${owner}/${repo}/issues?state=open&per_page=100&page=${page}`
    );
    const data = await res.json();
    const onlyIssues = data.filter((i) => !i.pull_request); // exclude PRs
    items.push(...onlyIssues);
    if (data.length < 100) break;
    page += 1;
  }
  return items;
}

async function updateIssueLabels(owner, repo, number, labelsArray) {
  await ghFetch(`/repos/${owner}/${repo}/issues/${number}`, {
    method: "PATCH",
    body: JSON.stringify({ labels: labelsArray }),
  });
}

async function main() {
  const repoFull = process.env.GITHUB_REPOSITORY;
  if (!repoFull) throw new Error("GITHUB_REPOSITORY not set");
  const [owner, repo] = repoFull.split("/");

  const openIssues = await listOpenIssues(owner, repo);

  const prepared = openIssues.map((i) => {
    const labelsSet = toLabelSet(i.labels || []);
    return {
      number: i.number,
      title: i.title,
      created_at: i.created_at,
      labelsSet,
      lane: getLane(labelsSet),
      score: extractScore(labelsSet),
      independent: extractIndependence(labelsSet),
      sizeRank: extractSizeRank(labelsSet),
      approved: hasLabel(labelsSet, "implementation ready"),
    };
  });

  // Build candidate list for active lanes: approved only (independence is a tiebreaker in sorting)
  const approvedIssues = prepared.filter(
    (i) => i.approved
  );
  approvedIssues.sort(cmpIssues);

  const atBat = approvedIssues.slice(0, 3).map((i) => i.number);
  const onDeck = approvedIssues.slice(3, 6).map((i) => i.number);
  const inTheHole = approvedIssues.slice(6, 9).map((i) => i.number);

  const targets = new Map();
  for (const n of atBat) targets.set(n, "at bat");
  for (const n of onDeck) targets.set(n, "on deck");
  for (const n of inTheHole) targets.set(n, "in the hole");

  // Everything else to bench (including unapproved or not independent)
  for (const it of prepared) {
    if (!targets.has(it.number)) targets.set(it.number, "on the bench");
  }

  // Apply label changes (ensure exactly one lane label)
  for (const it of prepared) {
    const desiredLane = targets.get(it.number);
    const clean = removeLaneLabels(it.labelsSet);
    clean.add(desiredLane);
    const newLabels = [...clean];

    // Only patch when different to reduce API calls
    const currentLane = getLane(it.labelsSet);
    if (currentLane === null) {
      console.warn(`Issue #${it.number} has no lane label`);
    }
    const laneChanged =
      (currentLane || "").toLowerCase() !== desiredLane.toLowerCase();
    if (laneChanged) {
      await updateIssueLabels(owner, repo, it.number, newLabels);
      console.log(`#${it.number} → ${desiredLane}`);
    }
  }

  console.log(
    `Rebalanced: at bat=${atBat.length}, on deck=${
      onDeck.length
    }, in the hole=${inTheHole.length}, bench=${
      prepared.length - (atBat.length + onDeck.length + inTheHole.length)
    }`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
