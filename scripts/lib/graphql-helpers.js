/**
 * GraphQL helper functions for GitHub Projects V2 API
 *
 * This module provides utilities for interacting with GitHub Projects V2
 * to enable project-scoped issue management and workflow testing.
 */

const https = require("https");

/**
 * Make a GraphQL request to GitHub API
 */
function makeGraphQLRequest(query, variables, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });

    const options = {
      hostname: "api.github.com",
      path: "/graphql",
      method: "POST",
      headers: {
        "User-Agent": "ai-practitioner-resources",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData);

          if (parsed.errors) {
            reject(
              new Error(`GraphQL errors: ${JSON.stringify(parsed.errors)}`)
            );
          } else {
            resolve(parsed.data);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Get the node ID for an issue (required for GraphQL operations)
 */
async function getIssueNodeId(owner, repo, issueNumber, token) {
  const query = `
    query($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          id
        }
      }
    }
  `;

  const variables = { owner, repo, number: issueNumber };
  const result = await makeGraphQLRequest(query, variables, token);
  return result.repository.issue.id;
}

/**
 * Add an issue to a GitHub Project V2
 */
async function addIssueToProject(projectId, issueNodeId, token) {
  const query = `
    mutation($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {
        projectId: $projectId
        contentId: $contentId
      }) {
        item {
          id
        }
      }
    }
  `;

  const variables = { projectId, contentId: issueNodeId };
  const result = await makeGraphQLRequest(query, variables, token);
  return result.addProjectV2ItemById.item.id;
}

/**
 * Get all issues in a GitHub Project V2
 */
async function getProjectIssues(projectId, token) {
  const query = `
    query($projectId: ID!, $cursor: String) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 100, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              id
              content {
                ... on Issue {
                  number
                  title
                  state
                  labels(first: 20) {
                    nodes {
                      name
                    }
                  }
                  url
                }
              }
            }
          }
        }
      }
    }
  `;

  const issues = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const variables = { projectId, cursor };
    const result = await makeGraphQLRequest(query, variables, token);

    const items = result.node.items;

    // Filter out non-issue items and extract issue data
    items.nodes.forEach((item) => {
      if (item.content && item.content.number) {
        issues.push({
          number: item.content.number,
          title: item.content.title,
          state: item.content.state,
          labels: item.content.labels.nodes.map((l) => l.name),
          url: item.content.url,
          projectItemId: item.id,
        });
      }
    });

    hasNextPage = items.pageInfo.hasNextPage;
    cursor = items.pageInfo.endCursor;
  }

  return issues;
}

/**
 * Get project ID by owner (user or organization) and project number
 */
async function getProjectId(owner, projectNumber, token) {
  // Try user first (most common for personal repos)
  const userQuery = `
    query($owner: String!, $number: Int!) {
      user(login: $owner) {
        projectV2(number: $number) {
          id
          title
        }
      }
    }
  `;

  try {
    const userResult = await makeGraphQLRequest(
      userQuery,
      { owner, number: projectNumber },
      token
    );
    if (userResult.user && userResult.user.projectV2) {
      return userResult.user.projectV2;
    }
  } catch (error) {
    // User query failed, try organization
  }

  // Try organization
  const orgQuery = `
    query($owner: String!, $number: Int!) {
      organization(login: $owner) {
        projectV2(number: $number) {
          id
          title
        }
      }
    }
  `;

  try {
    const orgResult = await makeGraphQLRequest(
      orgQuery,
      { owner, number: projectNumber },
      token
    );
    if (orgResult.organization && orgResult.organization.projectV2) {
      return orgResult.organization.projectV2;
    }
  } catch (error) {
    throw new Error(
      `Could not find project #${projectNumber} for ${owner}: ${error.message}`
    );
  }

  throw new Error(`Could not find project #${projectNumber} for ${owner}`);
}

/**
 * Remove an issue from a project
 */
async function removeIssueFromProject(projectId, itemId, token) {
  const query = `
    mutation($projectId: ID!, $itemId: ID!) {
      deleteProjectV2Item(input: {
        projectId: $projectId
        itemId: $itemId
      }) {
        deletedItemId
      }
    }
  `;

  const variables = { projectId, itemId };
  const result = await makeGraphQLRequest(query, variables, token);
  return result.deleteProjectV2Item.deletedItemId;
}

module.exports = {
  makeGraphQLRequest,
  getIssueNodeId,
  addIssueToProject,
  getProjectIssues,
  getProjectId,
  removeIssueFromProject,
};
