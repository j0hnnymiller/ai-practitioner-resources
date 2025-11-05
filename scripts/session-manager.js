// Session Manager: Capture and restore Copilot implementation session state
// Saves session context when PR is created so it can be restored for review changes
// Session includes: original issue, implementation context, decisions made, and verification steps

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

function env(name, required = true) {
  const v = process.env[name];
  if (required && !v) throw new Error(`${name} not set`);
  return v;
}

async function ghFetch(url, opts = {}) {
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
    throw new Error(`GitHub API ${res.status} ${res.statusText}: ${text}`);
  }
  return res;
}

async function getIssue(owner, repo, number) {
  const res = await ghFetch(`/repos/${owner}/${repo}/issues/${number}`);
  return res.json();
}

async function getPR(owner, repo, number) {
  const res = await ghFetch(`/repos/${owner}/${repo}/pulls/${number}`);
  return res.json();
}

async function getPRCommits(owner, repo, prNumber) {
  const res = await ghFetch(
    `/repos/${owner}/${repo}/pulls/${prNumber}/commits`
  );
  return res.json();
}

async function getPRFiles(owner, repo, prNumber) {
  const res = await ghFetch(`/repos/${owner}/${repo}/pulls/${prNumber}/files`);
  return res.json();
}

async function createSessionDocument(owner, repo, issueNumber, prNumber) {
  // Fetch issue context
  const issue = await getIssue(owner, repo, issueNumber);

  // Fetch PR context
  const pr = await getPR(owner, repo, prNumber);
  const commits = await getPRCommits(owner, repo, prNumber);
  const files = await getPRFiles(owner, repo, prNumber);

  // Build session document
  const session = {
    // Metadata
    sessionId: `copilot-issue-${issueNumber}-pr-${prNumber}`,
    createdAt: new Date().toISOString(),
    issue: issueNumber,
    pr: prNumber,

    // Original issue context
    issueContext: {
      number: issue.number,
      title: issue.title,
      author: issue.user.login,
      body: issue.body,
      labels: issue.labels.map((l) => l.name),
      url: issue.html_url,
    },

    // PR context
    prContext: {
      number: pr.number,
      title: pr.title,
      description: pr.body,
      branch: pr.head.ref,
      author: pr.user.login,
      url: pr.html_url,
      createdAt: pr.created_at,
    },

    // Implementation details
    implementation: {
      commitCount: commits.length,
      commits: commits.map((c) => ({
        sha: c.sha.substring(0, 7),
        message: c.commit.message,
        author: c.commit.author.name,
        date: c.commit.author.date,
      })),
      filesChanged: files.length,
      files: files.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes,
        patch: f.patch ? f.patch.substring(0, 500) : null, // First 500 chars of diff
      })),
    },

    // State for restoration
    restorationContext: {
      branch: pr.head.ref,
      baseBranch: pr.base.ref,
      headSha: pr.head.sha,
      baseSha: pr.base.sha,
    },

    // Review state (empty initially, filled when review comments arrive)
    reviewState: {
      reviewComments: [],
      changesRequested: false,
      approvalStatus: "pending",
    },
  };

  return session;
}

async function saveSession(session, owner, repo) {
  // Save to multiple locations for redundancy

  // 1. Save to .github/sessions/ directory (committed)
  const sessionDir = path.resolve(process.cwd(), ".github/sessions");
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const sessionFile = path.join(sessionDir, `${session.sessionId}.json`);
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

  // 2. Post as GitHub discussion (pinned) for visibility
  // Note: Would require DISCUSSIONS write permission
  console.log(`Session saved to: ${sessionFile}`);
  console.log(`Session ID: ${session.sessionId}`);

  return sessionFile;
}

async function updateSession(issueNumber, prNumber) {
  // Update existing session with new PR changes (commits, file changes)
  // Called when PR is updated with new commits
  const [owner, repo] = (process.env.GITHUB_REPOSITORY || "").split("/");
  if (!owner || !repo) {
    throw new Error("GITHUB_REPOSITORY not set in environment");
  }

  const sessionId = `copilot-issue-${issueNumber}-pr-${prNumber}`;

  // Check if session exists
  const sessionDir = path.resolve(process.cwd(), ".github/sessions");
  const sessionFile = path.join(sessionDir, `${sessionId}.json`);

  if (!fs.existsSync(sessionFile)) {
    console.log(
      `Session not found (${sessionId}). Creating new session instead.`
    );
    return saveImplementationSession(issueNumber, prNumber);
  }

  // Load existing session
  const session = JSON.parse(fs.readFileSync(sessionFile, "utf8"));

  // Fetch updated PR data
  const pr = await getPR(owner, repo, prNumber);
  const commits = await getPRCommits(owner, repo, prNumber);
  const files = await getPRFiles(owner, repo, prNumber);

  // Update implementation details
  session.implementation.commitCount = commits.length;
  session.implementation.commits = commits.map((c) => ({
    sha: c.sha.substring(0, 7),
    message: c.commit.message,
  }));

  session.implementation.filesChanged = files
    .map((f) => f.filename)
    .slice(0, 10); // Limit to first 10 for readability

  session.implementation.files = files.map((f) => ({
    filename: f.filename,
    additions: f.additions,
    deletions: f.deletions,
    changes: f.changes,
    status: f.status,
  }));

  // Update metadata
  session.updatedAt = new Date().toISOString();

  // Save updated session
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

  console.log(`Session updated: ${sessionId}`);
  console.log(
    `Updated commits: ${commits.length}, files changed: ${files.length}`
  );

  return {
    sessionId,
    sessionFile,
    session,
  };
}

async function restoreSession(sessionId) {
  // Restore session from .github/sessions/ directory
  const sessionDir = path.resolve(process.cwd(), ".github/sessions");
  const sessionFile = path.join(sessionDir, `${sessionId}.json`);

  if (!fs.existsSync(sessionFile)) {
    throw new Error(`Session not found: ${sessionFile}`);
  }

  const session = JSON.parse(fs.readFileSync(sessionFile, "utf8"));
  return session;
}

async function updateSessionWithReviewComments(sessionId, reviewComments) {
  // Update session with review feedback
  const session = await restoreSession(sessionId);

  session.reviewState.reviewComments = reviewComments;
  session.reviewState.changesRequested = true;
  session.reviewState.updatedAt = new Date().toISOString();

  // Save updated session
  const sessionDir = path.resolve(process.cwd(), ".github/sessions");
  const sessionFile = path.join(sessionDir, `${sessionId}.json`);
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2));

  return session;
}

async function generateSessionSummary(session) {
  // Generate markdown summary for PR description or restoration prompt
  return `
## 🤖 Copilot Session Context

### Issue Context
- **Issue**: #${session.issue.issueContext.number}
- **Title**: ${session.issue.issueContext.title}
- **Author**: @${session.issue.issueContext.author}

### Implementation Summary
- **Files Changed**: ${session.implementation.filesChanged}
- **Commits**: ${session.implementation.commitCount}
- **Total Changes**: +${session.implementation.files.reduce(
    (sum, f) => sum + f.additions,
    0
  )} / -${session.implementation.files.reduce((sum, f) => sum + f.deletions, 0)}

### Session ID for Restoration
\`\`\`
${session.sessionId}
\`\`\`

### Files Modified
${session.implementation.files
  .map(
    (f) => `- **${f.filename}** (${f.status}): +${f.additions}/-${f.deletions}`
  )
  .join("\n")}

### Commits
${session.implementation.commits
  .map((c) => `- \`${c.sha}\` ${c.message.split("\n")[0]}`)
  .join("\n")}

---
*Use session ID above if changes are requested during review to restore context.*
`;
}

// Main functions
async function saveImplementationSession(issueNumber, prNumber) {
  const repoFull = env("GITHUB_REPOSITORY");
  const [owner, repo] = repoFull.split("/");

  console.log(`Capturing session for issue #${issueNumber} PR #${prNumber}...`);

  const session = await createSessionDocument(
    owner,
    repo,
    issueNumber,
    prNumber
  );
  const sessionFile = await saveSession(session, owner, repo);
  const summary = await generateSessionSummary(session);

  return {
    session,
    sessionFile,
    summary,
  };
}

async function restoreImplementationSession(sessionId) {
  console.log(`Restoring session: ${sessionId}...`);

  const session = await restoreSession(sessionId);
  const summary = await generateSessionSummary(session);

  return {
    session,
    summary,
  };
}

module.exports = {
  saveImplementationSession,
  restoreImplementationSession,
  updateSession,
  updateSessionWithReviewComments,
  createSessionDocument,
  saveSession,
  restoreSession,
  generateSessionSummary,
};

// CLI interface
if (require.main === module) {
  const command = process.argv[2];

  if (command === "save") {
    const issueNumber = parseInt(process.argv[3]);
    const prNumber = parseInt(process.argv[4]);

    saveImplementationSession(issueNumber, prNumber)
      .then((result) => {
        console.log("\n=== Session Saved ===");
        console.log(result.summary);
        console.log(`\nSession file: ${result.sessionFile}`);
      })
      .catch((err) => {
        console.error(err);
        process.exitCode = 1;
      });
  } else if (command === "update") {
    const issueNumber = parseInt(process.argv[3]);
    const prNumber = parseInt(process.argv[4]);

    updateSession(issueNumber, prNumber)
      .then((result) => {
        console.log("\n=== Session Updated ===");
        console.log(`Session ID: ${result.sessionId}`);
        console.log(`Session file: ${result.sessionFile}`);
        console.log(
          `\nImplementation: ${result.session.implementation.commitCount} commits, ${result.session.implementation.files.length} files`
        );
      })
      .catch((err) => {
        console.error(err);
        process.exitCode = 1;
      });
  } else if (command === "restore") {
    const sessionId = process.argv[3];

    restoreImplementationSession(sessionId)
      .then((result) => {
        console.log("\n=== Session Restored ===");
        console.log(result.summary);
      })
      .catch((err) => {
        console.error(err);
        process.exitCode = 1;
      });
  } else {
    console.log(`
Usage:
  node scripts/session-manager.js save <issue> <pr>
  node scripts/session-manager.js update <issue> <pr>
  node scripts/session-manager.js restore <sessionId>
    `);
  }
}
