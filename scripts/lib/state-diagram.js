function extractMermaidBlock(markdown) {
  const match = markdown.match(/```mermaid\s*([\s\S]*?)```/i);
  if (!match) {
    throw new Error("Could not find mermaid block in state diagram markdown");
  }
  return match[1];
}

function normalizeStateName(name) {
  return String(name || "").trim();
}

function parseMermaidTransitions(mermaid) {
  const edges = [];
  const lines = mermaid.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("%%") || line === "stateDiagram-v2") {
      continue;
    }

    const match = line.match(/^(.+?)\s+-->\s+(.+?)(?::\s*(.+))?$/);
    if (!match) {
      continue;
    }

    edges.push({
      from: normalizeStateName(match[1]),
      to: normalizeStateName(match[2]),
      trigger: normalizeStateName(match[3] || ""),
    });
  }

  return edges;
}

function buildGraph(edges) {
  const adjacency = new Map();
  const edgeSet = new Set();

  for (const edge of edges) {
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, []);
    }
    adjacency.get(edge.from).push(edge);
    edgeSet.add(`${edge.from}-->${edge.to}`);
  }

  return { adjacency, edgeSet };
}

const REENTRY_STATE_KEYS = {
  AC_Check: {
    At_Bat: "AC_Check__at_bat",
    Stage_3_Acceptance: "AC_Check__stage_3_acceptance",
  },
};

function getTraversalStateKey(edge) {
  return REENTRY_STATE_KEYS[edge.to]?.[edge.from] || edge.to;
}

function getEntryStates(edges) {
  return edges.filter((edge) => edge.from === "[*]").map((edge) => edge.to);
}

function getExitStates(edges) {
  return edges.filter((edge) => edge.to === "[*]").map((edge) => edge.from);
}

function countSimplePaths(edges) {
  const { adjacency } = buildGraph(edges);
  const entries = getEntryStates(edges);
  const exits = new Set(getExitStates(edges));
  let total = 0;

  function dfs(node, visited) {
    if (exits.has(node)) {
      total += 1;
      return;
    }

    for (const edge of adjacency.get(node) || []) {
      const next = edge.to;
      if (next === "[*]" || visited.has(next)) {
        continue;
      }

      visited.add(next);
      dfs(next, visited);
      visited.delete(next);
    }
  }

  for (const entry of entries) {
    const visited = new Set([entry]);
    dfs(entry, visited);
  }

  return total;
}

module.exports = {
  extractMermaidBlock,
  parseMermaidTransitions,
  buildGraph,
  getEntryStates,
  getExitStates,
  getTraversalStateKey,
  countSimplePaths,
};
