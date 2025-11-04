// Review existing open issues as if newly opened:
// - Ensure each issue is added to Project 1
// - Set Project Status to bench (or mapped)
// - Remove legacy lane labels
// - Add needs-approval label unless already implementation ready
// - Post intake checklist comment (skip if already posted)

const fetch = require("node-fetch");

const LANES = ["at bat", "on deck", "in the hole", "on the bench"];

function boolEnv(name, dflt = false) {
  const v = process.env[name];
  if (v == null) return dflt;
  return /^(1|true|yes)$/i.test(String(v));
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

async function ghGraphQL(query, variables) {
  const token = process.env.GITHUB_TOKEN || process.env.TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not set");
  const url = process.env.GITHUB_GRAPHQL_URL || "https://api.github.com/graphql";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (!res.ok || data.errors) {
    throw new Error("GraphQL error: " + JSON.stringify(data.errors || data));
  }
  return data.data;
}

async function getProject(owner, number) {
  const fieldFragments = `fields(first:100){ nodes{ __typename ... on ProjectV2FieldCommon { id name } ... on ProjectV2SingleSelectField { id name options{ id name } } } }`;
  const qOrg = `query($login:String!,$number:Int!){ organization(login:$login){ projectV2(number:$number){ id number ${fieldFragments} } } }`;
  const qUser = `query($login:String!,$number:Int!){ user(login:$login){ projectV2(number:$number){ id number ${fieldFragments} } } }`;
  try {
    const dOrg = await ghGraphQL(qOrg, { login: owner, number });
    const projOrg = dOrg?.organization?.projectV2;
    if (projOrg) return projOrg;
  } catch(_) {}
  const dUser = await ghGraphQL(qUser, { login: owner, number });
  const projUser = dUser?.user?.projectV2;
  if (!projUser) throw new Error(`Project ${number} not found for owner ${owner}`);
  return projUser;
}

function findStatusField(project, statusFieldName) {
  const nodes = project.fields?.nodes || [];
  const match = nodes.find((f) => String(f.name).toLowerCase() === String(statusFieldName).toLowerCase());
  if (!match) throw new Error(`Field '${statusFieldName}' not found in Project ${project.number}`);
  if (!match.options) throw new Error(`Field '${statusFieldName}' is not a single-select field`);
  return match;
}

function resolveOptionIdByName(field, name) {
  const opt = (field.options || []).find(o => String(o.name).toLowerCase() === String(name).toLowerCase());
  return opt?.id || null;
}

async function getIssueProjectItemId(issueNodeId, projectId) {
  const q = `query($id:ID!){ node(id:$id){ ... on Issue { projectItems(first:20){ nodes{ id project{ id number } } } } } }`;
  const data = await ghGraphQL(q, { id: issueNodeId });
  const items = data?.node?.projectItems?.nodes || [];
  const found = items.find((n) => n.project?.id === projectId);
  return found?.id || null;
}

async function addIssueToProject(projectId, contentId) {
  const m = `mutation($projectId:ID!,$contentId:ID!){ addProjectV2ItemById(input:{projectId:$projectId, contentId:$contentId}){ item{ id } } }`;
  const data = await ghGraphQL(m, { projectId, contentId });
  return data?.addProjectV2ItemById?.item?.id || null;
}

async function setProjectItemStatus(projectId, itemId, fieldId, optionId) {
  const m = `mutation($projectId:ID!,$itemId:ID!,$fieldId:ID!,$optionId:String!){ updateProjectV2ItemFieldValue(input:{ projectId:$projectId, itemId:$itemId, fieldId:$fieldId, value:{ singleSelectOptionId:$optionId }}){ projectV2Item{ id } } }`;
  await ghGraphQL(m, { projectId, itemId, fieldId, optionId });
}

async function listOpenIssues(owner, repo) {
  const items = [];
  let page = 1;
  while (true) {
    const res = await ghFetch(`/repos/${owner}/${repo}/issues?state=open&per_page=100&page=${page}`);
    const data = await res.json();
    const onlyIssues = data.filter((i) => !i.pull_request);
    items.push(...onlyIssues);
    if (data.length < 100) break;
    page += 1;
  }
  return items;
}

async function ensureLabel(owner, repo, name, color, description) {
  // Try get
  const res = await ghFetch(`/repos/${owner}/${repo}/labels/${encodeURIComponent(name)}`, { method: "GET" }).catch(() => null);
  if (res && res.ok) return res.json();
  // Create
  const create = await ghFetch(`/repos/${owner}/${repo}/labels`, {
    method: "POST",
    body: JSON.stringify({ name, color, description }),
  });
  return create.json();
}

function toNameSet(labels) {
  return new Set((labels || []).map((l) => (typeof l === "string" ? l : l.name)).filter(Boolean));
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

async function listIssueComments(owner, repo, number) {
  const comments = [];
  let page = 1;
  while (true) {
    const res = await ghFetch(`/repos/${owner}/${repo}/issues/${number}/comments?per_page=100&page=${page}`);
    const data = await res.json();
    comments.push(...data);
    if (data.length < 100) break;
    page += 1;
  }
  return comments;
}

async function addComment(owner, repo, number, body) {
  await ghFetch(`/repos/${owner}/${repo}/issues/${number}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

function intakeChecklistComment(number) {
  return `Thanks for opening this issue!\n\nPM intake checklist (baseline):\n- [ ] Scope is clear and testable (acceptance criteria provided)\n- [ ] Dependencies identified and minimal (or resolved)\n- [ ] Risk acceptable\n- [ ] Independent enough to run in parallel (label 'independent' or 'independence:high' when true)\n- [ ] Priority score provided (label 'priority:NN' or 'score:NN')\n- [ ] Size estimated (label 'size:small|medium'). Items labeled size:large will not be approved; please split into smaller sub-issues.\n\nIf this issue includes a prompt, please include a short prompt packet: Objective, Inputs, Tools/permissions, Constraints, Steps/strategy, Acceptance criteria, Evaluation, Priority score, Size, Independence, Risks, Links.\n\nType-specific checklists are documented in .github/prompts/modes/project-manager.md under "Approval criteria by type".\n\nIf approved, mark it 'implementation ready' and assign a contributor.\n\nQuick commands (replace placeholders):\n\n- Approve:\n  - gh issue comment ${number} --body "Approved — implementation ready. Rationale: <one-line>"\n  - gh issue edit ${number} --add-label "implementation ready" --remove-label "needs-approval"\n\nThis issue has been placed on the bench initially. Lanes are rebalanced only when issues are closed.`;
}

async function main() {
  const repoFull = process.env.GITHUB_REPOSITORY;
  if (!repoFull) throw new Error("GITHUB_REPOSITORY not set");
  const [owner, repo] = repoFull.split("/");
  const dryRun = boolEnv("DRY_RUN", false);

  // Ensure tracking label exists
  if (!dryRun) {
    await ensureLabel(owner, repo, "needs-approval", "7d8590", "Pending human review; not approved for implementation");
  }

  const projectOwner = process.env.PROJECT_OWNER || owner;
  const projectNumber = Number(process.env.PROJECT_NUMBER || 1);
  const statusFieldName = process.env.PROJECT_STATUS_FIELD_NAME || "Status";
  const laneMapRaw = process.env.LANE_STATUS_MAP || "";
  const laneMap = laneMapRaw ? JSON.parse(laneMapRaw) : null;
  const benchName = laneMap?.["on the bench"] || "on the bench";

  const project = await getProject(projectOwner, projectNumber);
  const statusField = findStatusField(project, statusFieldName);
  const benchOptionId = resolveOptionIdByName(statusField, benchName);
  if (!benchOptionId) throw new Error(`Status option '${benchName}' not found in Project ${project.number}`);

  // List open issues
  const issues = await listOpenIssues(owner, repo);

  for (const issue of issues) {
    const number = issue.number;
    const labelSet = toNameSet(issue.labels);
    const hasImplementationReady = [...labelSet].some((n) => n.toLowerCase() === "implementation ready");

    // Ensure in project + set bench status
    if (!dryRun) {
      let itemId = await getIssueProjectItemId(issue.node_id, project.id);
      if (!itemId) itemId = await addIssueToProject(project.id, issue.node_id);
      if (!itemId) {
        console.warn(`#${number}: Could not create project item — skip`);
        continue;
      }
      await setProjectItemStatus(project.id, itemId, statusField.id, benchOptionId);
    } else {
      console.log(`DRY RUN: #${number} would be added to Project ${project.number} and Status set to '${benchName}'`);
    }

    // Strip legacy lane labels
    let newSet = stripLaneLabels(labelSet);
    if (!hasImplementationReady) newSet.add("needs-approval");

    if (!dryRun) {
      await setIssueLabels(owner, repo, number, [...newSet]);
    } else {
      console.log(`DRY RUN: #${number} would set labels → [${[...newSet].join(", ")}]`);
    }

    // Post intake checklist comment unless already posted
    const comments = await listIssueComments(owner, repo, number);
    const already = comments.some((c) => typeof c.body === "string" && c.body.includes("PM intake checklist (baseline)"));
    if (!already) {
      const body = intakeChecklistComment(number);
      if (!dryRun) {
        await addComment(owner, repo, number, body);
      } else {
        console.log(`DRY RUN: #${number} would receive intake checklist comment`);
      }
    }

    if (!dryRun) {
      console.log(`#${number} initialized/updated in Project ${project.number} with Status '${benchName}'.`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
