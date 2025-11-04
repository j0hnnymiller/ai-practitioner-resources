// One-off migration: Convert lane labels to Project 1 Status
// - Detect legacy lane labels: "at bat", "on deck", "in the hole", "on the bench"
// - Ensure each issue is in Project 1 (configurable)
// - Set Project Status to the matching value (or a mapped value via LANE_STATUS_MAP)
// - Remove legacy lane labels from the issue
//
// Configuration (env or CLI args):
// - PROJECT_OWNER (required) — org or user login that owns Project 1
// - PROJECT_NUMBER (default: 1)
// - PROJECT_STATUS_FIELD_NAME (default: "Status")
// - LANE_STATUS_MAP (optional) — JSON map of lane label -> project status name
// - DRY_RUN=true to preview changes without writing
// - GITHUB_REPOSITORY (fallback for owner/repo; format: "owner/repo")
// - GITHUB_TOKEN or TOKEN (required) — must have write access to Issues and Projects (v2)

const fetch = require("node-fetch");

const LANES = ["at bat", "on deck", "in the hole", "on the bench"];

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const [k, v] = a.includes("=") ? a.split("=", 2) : [a, "true"];
    if (k.startsWith("--")) args[k.slice(2)] = v;
  }
  return args;
}

function getConfig() {
  const args = parseArgs(process.argv);
  const repoFull = process.env.GITHUB_REPOSITORY || args.repoFull;
  let owner = args.owner || process.env.PROJECT_OWNER;
  let repo = args.repo || undefined;
  if (!owner && repoFull) owner = repoFull.split("/")[0];
  if (!repo && repoFull) repo = repoFull.split("/")[1];
  const projectNumber = Number(
    args["project-number"] || process.env.PROJECT_NUMBER || 1
  );
  const statusFieldName =
    args["status-field"] || process.env.PROJECT_STATUS_FIELD_NAME || "Status";
  const laneStatusMapRaw =
    args["lane-status-map"] || process.env.LANE_STATUS_MAP || "";
  const dryRun =
    String(args["dry-run"] || process.env.DRY_RUN || "").toLowerCase() ===
    "true";
  const ownerType = (
    args["owner-type"] ||
    process.env.OWNER_TYPE ||
    ""
  ).toLowerCase(); // 'org' | 'user' | ''
  if (!owner || !repo) {
    throw new Error(
      "owner/repo is required. Set GITHUB_REPOSITORY or pass --owner and --repo."
    );
  }
  let laneStatusMap = null;
  if (laneStatusMapRaw) {
    try {
      laneStatusMap = JSON.parse(laneStatusMapRaw);
    } catch (e) {
      throw new Error("LANE_STATUS_MAP is not valid JSON");
    }
  }
  return {
    owner,
    repo,
    projectNumber,
    statusFieldName,
    laneStatusMap,
    dryRun,
    ownerType,
  };
}

function laneFromLabels(labels) {
  const names = (labels || []).map((l) => (typeof l === "string" ? l : l.name));
  for (const lane of LANES) {
    if (names.some((n) => String(n).toLowerCase() === lane)) return lane;
  }
  return null;
}

function toLabelNames(labels) {
  return (labels || [])
    .map((l) => (typeof l === "string" ? l : l.name))
    .filter(Boolean);
}

function withoutLaneLabels(names) {
  const laneSet = new Set(LANES);
  return names.filter((n) => !laneSet.has(String(n).toLowerCase()));
}

async function ghRest(path, opts = {}) {
  const token = process.env.GITHUB_TOKEN || process.env.TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not set");
  const base = process.env.GITHUB_API_URL || "https://api.github.com";
  const res = await fetch(base + path, {
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
      `REST ${res.status} ${res.statusText} for ${path}: ${text}`
    );
  }
  return res;
}

async function ghGraphQL(query, variables) {
  const token = process.env.GITHUB_TOKEN || process.env.TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not set");
  const url =
    process.env.GITHUB_GRAPHQL_URL || "https://api.github.com/graphql";
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

async function getProject(owner, number, ownerType) {
  // GitHub Projects v2: fields is a union; select via fragments.
  // ProjectV2SingleSelectField exposes options; ProjectV2FieldCommon exposes id/name.
  const fieldFragments = `fields(first:100){ nodes{ __typename ... on ProjectV2FieldCommon { id name } ... on ProjectV2SingleSelectField { id name options{ id name } } } }`;
  const qOrg = `query($login:String!,$number:Int!){ organization(login:$login){ projectV2(number:$number){ id number ${fieldFragments} } } }`;
  const qUser = `query($login:String!,$number:Int!){ user(login:$login){ projectV2(number:$number){ id number ${fieldFragments} } } }`;
  if (ownerType === "org") {
    const data = await ghGraphQL(qOrg, { login: owner, number });
    const project = data?.organization?.projectV2 || null;
    if (!project)
      throw new Error(`Project ${number} not found for org ${owner}`);
    return project;
  }
  if (ownerType === "user") {
    const data = await ghGraphQL(qUser, { login: owner, number });
    const project = data?.user?.projectV2 || null;
    if (!project)
      throw new Error(`Project ${number} not found for user ${owner}`);
    return project;
  }
  // Default: try org, then user. Tolerate NOT_FOUND on org.
  try {
    const dataOrg = await ghGraphQL(qOrg, { login: owner, number });
    const projOrg = dataOrg?.organization?.projectV2 || null;
    if (projOrg) return projOrg;
  } catch (e) {
    // ignore and try user
  }
  const dataUser = await ghGraphQL(qUser, { login: owner, number });
  const projUser = dataUser?.user?.projectV2 || null;
  if (!projUser)
    throw new Error(`Project ${number} not found for owner ${owner}`);
  return projUser;
}

function findStatusField(project, statusFieldName) {
  const nodes = project.fields?.nodes || [];
  const match = nodes.find(
    (f) =>
      String(f.name).toLowerCase() === String(statusFieldName).toLowerCase()
  );
  if (!match)
    throw new Error(
      `Field '${statusFieldName}' not found in Project ${project.number}`
    );
  if (!match.options)
    throw new Error(`Field '${statusFieldName}' is not a single-select field`);
  return match; // { id, name, options:[{id,name}] }
}

function resolveOptionIdByName(field, desiredName) {
  const opt = (field.options || []).find(
    (o) => String(o.name).toLowerCase() === String(desiredName).toLowerCase()
  );
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
  const issues = [];
  let page = 1;
  while (true) {
    const res = await ghRest(
      `/repos/${owner}/${repo}/issues?state=open&per_page=100&page=${page}`
    );
    const data = await res.json();
    const only = data.filter((i) => !i.pull_request);
    issues.push(...only);
    if (data.length < 100) break;
    page += 1;
  }
  return issues;
}

async function setIssueLabels(owner, repo, number, names) {
  await ghRest(`/repos/${owner}/${repo}/issues/${number}`, {
    method: "PATCH",
    body: JSON.stringify({ labels: names }),
  });
}

async function main() {
  const {
    owner,
    repo,
    projectNumber,
    statusFieldName,
    laneStatusMap,
    dryRun,
    ownerType,
  } = getConfig();
  const project = await getProject(owner, projectNumber, ownerType);
  const projectId = project.id;
  const statusField = findStatusField(project, statusFieldName);

  console.log(`Project: ${owner} #${project.number} (id=${projectId})`);
  console.log(
    `Status field: ${statusField.name} (id=${statusField.id}) with ${statusField.options.length} options`
  );
  if (laneStatusMap)
    console.log(`Using lane→status mapping: ${JSON.stringify(laneStatusMap)}`);
  if (dryRun) console.log("DRY RUN: no changes will be written");

  const issues = await listOpenIssues(owner, repo);
  let touched = 0;
  for (const issue of issues) {
    const lane = laneFromLabels(issue.labels);
    if (!lane) continue; // skip issues without a lane label

    const desiredStatusName = laneStatusMap?.[lane] || lane; // default: same name
    const optionId = resolveOptionIdByName(statusField, desiredStatusName);
    if (!optionId) {
      console.warn(
        `#${issue.number} '${issue.title}': desired status '${desiredStatusName}' not found in Project options — SKIP`
      );
      continue;
    }

    // Ensure item exists in project
    let itemId = await getIssueProjectItemId(issue.node_id, projectId);
    if (!itemId) {
      if (dryRun) {
        console.log(
          `#${issue.number}: would add to project and set Status='${desiredStatusName}'`
        );
      } else {
        itemId = await addIssueToProject(projectId, issue.node_id);
      }
    }

    if (!itemId && !dryRun) {
      // Fallback: refetch after add attempt
      itemId = await getIssueProjectItemId(issue.node_id, projectId);
    }

    if (!itemId && !dryRun) {
      console.warn(`#${issue.number}: could not obtain project item id — SKIP`);
      continue;
    }

    // Set Status
    if (dryRun) {
      console.log(
        `#${issue.number}: set Status='${desiredStatusName}' (optionId=${optionId})`
      );
    } else {
      await setProjectItemStatus(projectId, itemId, statusField.id, optionId);
      console.log(`#${issue.number}: Status → '${desiredStatusName}'`);
    }

    // Remove lane labels, keep others
    const currentNames = toLabelNames(issue.labels);
    const newNames = withoutLaneLabels(currentNames);
    if (dryRun) {
      console.log(
        `#${issue.number}: would remove lane labels; labels -> ${JSON.stringify(
          newNames
        )}`
      );
    } else {
      await setIssueLabels(owner, repo, issue.number, newNames);
      console.log(`#${issue.number}: removed lane labels`);
    }

    touched += 1;
  }

  console.log(`Done. Issues updated: ${touched}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
