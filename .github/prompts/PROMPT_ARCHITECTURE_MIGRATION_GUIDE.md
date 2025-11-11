# Prompt Architecture Migration Guide

This guide explains how to apply the PM review pattern (prompts = logic, scripts = execution) to other scripts in the project, creating a clean separation between business logic and execution code.

## Overview

### The Pattern

**Current State (PM Review):**
- **Logic:** `.github/prompts/modes/ai-assistant-pm.md` - Contains decision criteria, rules, scoring formulas
- **Execution:** `scripts/pm-review.js` - Fetches data, calls API, applies results, no business logic

**Goal:**
Apply this pattern to other scripts that currently mix logic and execution.

### Benefits

1. **Maintainability:** Update rules without touching code
2. **Testability:** Test prompts independently from execution
3. **Auditability:** Track logic changes in git history
4. **Flexibility:** Swap AI models without changing logic
5. **Consistency:** Same rules expressed once, used everywhere
6. **Transparency:** Non-engineers can review and update rules

## Scripts Requiring Migration

### 1. issue-intake.js

**Current State:** ❌ Contains business logic

**Business Logic Embedded:**
- Lane assignment rules (lines 10-13)
- Status value mappings
- Label selection criteria
- Comment template formatting

**Location:** `scripts/issue-intake.js`

**Migration Complexity:** 🟡 Medium

**Lines of Business Logic:** ~40 lines

**Prompt File Target:** `.github/prompts/issue-intake.md`

### 2. rebalance-lanes.js

**Current State:** ❌ Contains business logic

**Business Logic Embedded:**
- Lane capacity rules (3 max per active lane)
- Priority scoring extraction (lines 32-46)
- Independence calculation (lines 48-59)
- Size ranking (lines 62-77)
- Issue comparison/sorting (lines 95-106)
- Lane assignment algorithm (lines 150-200)

**Location:** `scripts/rebalance-lanes.js`

**Migration Complexity:** 🔴 High

**Lines of Business Logic:** ~100 lines

**Prompt File Target:** `.github/prompts/rebalance-lanes.md`

### 3. pm-review-local.js

**Current State:** ⚠️ Partially separated (uses project-manager.md prompt)

**Remaining Business Logic:**
- Local-specific CLI interactions
- Output formatting decisions
- Dry-run logic

**Location:** `scripts/pm-review-local.js`

**Migration Complexity:** 🟢 Low

**Lines of Business Logic:** ~20 lines

**Prompt File Target:** Same as pm-review.js (already uses `.github/prompts/modes/project-manager.md`)

## Migration Strategy

### Phase 1: Extract Logic to Prompts

For each script:

1. **Identify business logic** - Rules, criteria, formulas, thresholds
2. **Create prompt file** - Document logic in AI-consumable format
3. **Define I/O schema** - Specify input context and expected output structure
4. **Add examples** - Provide concrete examples for edge cases

### Phase 2: Refactor Scripts to Execution Only

For each script:

1. **Remove hardcoded logic** - Delete business rules from code
2. **Add prompt loading** - Read logic from prompt file
3. **Implement AI call** - Use Anthropic API (or similar) to apply logic
4. **Parse and apply results** - Execute AI decisions via GitHub API

### Phase 3: Validation and Testing

For each migrated script:

1. **Test equivalence** - Ensure new version produces same results as old
2. **Add error handling** - Implement retry logic (see ERROR_HANDLING_GUIDE.md)
3. **Update documentation** - Reflect new architecture in README
4. **Deploy gradually** - Feature flag or canary deployment

## Detailed Migration: issue-intake.js

### Current Architecture

```
┌─────────────────────────────────────┐
│      issue-intake.js                │
│  ┌─────────────────────────────┐   │
│  │  Business Logic (embedded)  │   │
│  │  - Lane rules               │   │
│  │  - Status mapping           │   │
│  │  - Label criteria           │   │
│  │  - Comment templates        │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  Execution Logic            │   │
│  │  - Fetch issue data         │   │
│  │  - Call GitHub API          │   │
│  │  - Post comments            │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Target Architecture

```
┌──────────────────────────────────────────┐
│  .github/prompts/issue-intake.md         │
│  ┌────────────────────────────────────┐  │
│  │  Business Logic (prompt)           │  │
│  │  - Lane assignment criteria        │  │
│  │  - Status value selection          │  │
│  │  - Label recommendations           │  │
│  │  - Comment template                │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
                    ↓
        ┌─────────────────────────┐
        │   Anthropic API         │
        └─────────────────────────┘
                    ↓
┌─────────────────────────────────────┐
│      issue-intake.js                │
│  ┌─────────────────────────────┐   │
│  │  Execution Logic (only)     │   │
│  │  - Load prompt file         │   │
│  │  - Fetch issue data         │   │
│  │  - Call Anthropic API       │   │
│  │  - Parse AI response        │   │
│  │  - Apply via GitHub API     │   │
│  │  - Error handling           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Step 1: Create Prompt File

Create `.github/prompts/issue-intake.md`:

```markdown
# Issue Intake Prompt

## Role
You are an intake coordinator for a GitHub repository. Your job is to initialize 
new issues with appropriate project status and tracking labels.

## Input Context
You will receive:
- Issue number, title, body, author, labels
- Repository's project number and status field configuration
- Available status values

## Your Tasks

### 1. Determine Initial Status
Place the issue on the bench (backlog) by default. The issue starts as 
"needs-approval" and cannot enter active lanes (at bat, on deck, in the hole) 
until a human applies "implementation ready" label.

**Status Assignment:**
- Default: "on the bench"
- Never: "at bat", "on deck", "in the hole" (require approval)

### 2. Suggest Tracking Label
Add "needs-approval" label to new issues unless:
- Issue already has "implementation ready" label (rare, but possible)
- Issue is created by a maintainer and pre-approved

### 3. Generate Welcome Comment
Create a brief comment with:
- Welcome message
- Link to review checklist
- Quick approval commands for maintainers

**Comment Template:**
```
Welcome! This issue has been added to the project board.

**Next Steps:**
- A project manager will review this issue within 24 hours
- You'll receive feedback on any missing information
- Once approved, this will move to the active pipeline

**For Maintainers:**
To approve this issue, run:
`gh issue edit {number} --add-label "implementation ready"`
```

## Output Format (Strict JSON)

Return exactly this structure:

```json
{
  "projectStatus": "on the bench",
  "addLabels": ["needs-approval"],
  "removeLabels": [],
  "comment": "Welcome! This issue has been..."
}
```

## Edge Cases

- **Pre-approved issues:** If "implementation ready" label exists, don't add "needs-approval"
- **Maintainer issues:** Same rules apply; no special treatment
- **Duplicate issues:** Still add to board; deduplication is separate process

## Validation Rules

- `projectStatus` must be one of: "on the bench", "at bat", "on deck", "in the hole"
- `addLabels` must be array of strings (label names)
- `removeLabels` must be array of strings (label names)
- `comment` must be non-empty string (markdown supported)
```

### Step 2: Refactor Script

Update `scripts/issue-intake.js`:

```javascript
// NEW: Clean execution-only version
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

// Import retry logic
const { callAnthropicWithRetry, sleep } = require("./lib/api-helpers");

// Load prompt (logic)
function loadIntakePrompt() {
  const file = path.resolve(process.cwd(), ".github/prompts/issue-intake.md");
  return fs.readFileSync(file, "utf8");
}

// Call AI to make decisions
async function determineIntakeActions(issue) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback to default behavior
    return {
      projectStatus: "on the bench",
      addLabels: ["needs-approval"],
      removeLabels: [],
      comment: "Welcome! This issue has been added to the project board."
    };
  }

  const prompt = loadIntakePrompt();
  const user = `Issue to process:\nNumber: ${issue.number}\nTitle: ${issue.title}\nBody: ${issue.body || '(no body)'}\nAuthor: ${issue.user.login}\nLabels: ${issue.labels.map(l => l.name).join(', ')}`;

  const payload = {
    model: process.env.INTAKE_MODEL || "claude-sonnet-4-5-20250929",
    system: prompt,
    max_tokens: 1000,
    temperature: 0.1,
    messages: [{ role: "user", content: [{ type: "text", text: user }] }],
  };

  const data = await callAnthropicWithRetry(
    "https://api.anthropic.com/v1/messages",
    payload,
    apiKey
  );

  const jsonText = data.content.map(b => b.text).join("\n").trim();
  const match = jsonText.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : JSON.parse(jsonText);
}

// Execute decisions (apply to GitHub)
async function executeIntakeActions(issue, actions) {
  const { projectStatus, addLabels, removeLabels, comment } = actions;

  // 1. Update project status
  await setProjectItemStatus(issue.id, projectStatus);

  // 2. Apply labels
  for (const label of addLabels) {
    await addLabel(issue.number, label);
  }
  for (const label of removeLabels) {
    await removeLabel(issue.number, label);
  }

  // 3. Post comment
  await postComment(issue.number, comment);
}

// Main
async function main() {
  const issue = await getIssue(process.env.ISSUE_NUMBER);
  const actions = await determineIntakeActions(issue);
  await executeIntakeActions(issue, actions);
  console.log(`Issue #${issue.number} intake complete.`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
```

### Step 3: Validate Equivalence

Create test script `scripts/test-intake-equivalence.js`:

```javascript
// Test that new version produces same results as old
async function testEquivalence() {
  const testIssues = [
    { number: 101, title: "Add feature X", body: "...", labels: [] },
    { number: 102, title: "Fix bug Y", body: "...", labels: ["bug"] },
    { number: 103, title: "Approved issue", body: "...", labels: ["implementation ready"] },
  ];

  for (const issue of testIssues) {
    const oldResult = oldIntakeLogic(issue);
    const newResult = await determineIntakeActions(issue);
    
    console.log(`Issue #${issue.number}:`);
    console.log(`  Old: ${JSON.stringify(oldResult)}`);
    console.log(`  New: ${JSON.stringify(newResult)}`);
    console.log(`  Match: ${deepEqual(oldResult, newResult) ? '✓' : '✗'}`);
  }
}
```

## Detailed Migration: rebalance-lanes.js

### Current Business Logic to Extract

**1. Lane Capacity Rules:**
```javascript
// Current (embedded):
const LANES = ["at bat", "on deck", "in the hole", "on the bench"];
const MAX_ACTIVE = 3; // per lane

// Target (prompt):
"Active lanes (at bat, on deck, in the hole) are capped at 3 issues each."
```

**2. Priority Scoring:**
```javascript
// Current (embedded):
function extractScore(labelsSet) {
  const m = String(l).toLowerCase().match(/^(?:priority|score):\s*(\d{1,3})$/);
  if (m) {
    const n = Number(m[1]);
    return Math.max(score, Math.min(100, Math.max(0, n)));
  }
  return score;
}

// Target (prompt):
"Extract priority from labels matching 'priority:NN' or 'score:NN' where NN is 0-100."
```

**3. Independence Calculation:**
```javascript
// Current (embedded):
function extractIndependence(labelsSet) {
  if ([...labelsSet].some(l => String(l).toLowerCase() === "independent"))
    return true;
  const indep = [...labelsSet].find(l =>
    String(l).toLowerCase().startsWith("independence:")
  );
  if (indep) {
    const val = String(indep).split(":")[1]?.trim().toLowerCase();
    return val === "high" || val === "yes" || val === "true";
  }
  return false;
}

// Target (prompt):
"Independence is true if issue has 'independent' label OR 'independence:high'."
```

**4. Issue Comparison/Sorting:**
```javascript
// Current (embedded):
function cmpIssues(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (a.independent !== b.independent)
    return (b.independent ? 1 : 0) - (a.independent ? 1 : 0);
  if (a.sizeRank !== b.sizeRank) return a.sizeRank - b.sizeRank;
  return new Date(a.created) - new Date(b.created);
}

// Target (prompt):
"Sort by: (1) priority score descending, (2) independence (true first), 
(3) size (small first), (4) creation date (older first)."
```

### Step 1: Create Prompt File

Create `.github/prompts/rebalance-lanes.md`:

```markdown
# Lane Rebalancing Prompt

## Role
You are a lane manager for a GitHub project board. Your job is to rebalance 
issues across four swimlanes when issues close or status changes.

## Lane Definitions

**Active Lanes (max 3 each):**
- `at bat` - Currently being implemented
- `on deck` - Next up in queue
- `in the hole` - Coming soon after next

**Backlog:**
- `on the bench` - Backlog; unlimited capacity

## Rebalancing Rules

### 1. Capacity Constraints
- Each active lane: max 3 issues
- Total active issues: max 9 (3 per lane)
- Bench: unlimited

### 2. Eligibility Requirements
Only issues with "implementation ready" label can be in active lanes.
Unapproved issues stay on the bench.

### 3. Priority Scoring
Extract priority from label matching:
- `priority:NN` where NN is 0-100
- OR `score:NN` (legacy format)
- If multiple, use highest value
- If none, default to 0

### 4. Independence Assessment
Issue is independent if it has:
- Label `independent` (exact match)
- OR label `independence:high`
Otherwise, it is dependent.

### 5. Size Ranking
Extract size from label:
- `size:small` → rank 0 (smallest)
- `size:medium` → rank 1
- `size:large` → rank 2 (largest)
- Default to medium if missing

### 6. Sorting Algorithm
Sort issues by (in order):
1. Priority score (descending) - higher first
2. Independence (true first)
3. Size rank (ascending) - smaller first
4. Creation date (ascending) - older first

### 7. Lane Assignment
1. Take top 3 eligible issues → `at bat`
2. Take next 3 eligible issues → `on deck`
3. Take next 3 eligible issues → `in the hole`
4. All remaining → `on the bench`

## Input Context
You will receive:
- List of all open issues with: number, title, labels, created date, current lane
- Trigger event (e.g., "Issue #123 closed")

## Output Format (Strict JSON)

```json
{
  "changes": [
    {"issue": 101, "from": "on deck", "to": "at bat", "reason": "Promoted after #99 closed"},
    {"issue": 102, "from": "in the hole", "to": "on deck", "reason": "Moved up in queue"},
    {"issue": 103, "from": "on the bench", "to": "in the hole", "reason": "Top priority on bench"}
  ],
  "summary": "Rebalanced after issue #123 closed. Promoted 3 issues from bench/hole/deck."
}
```

## Edge Cases
- If fewer than 3 eligible issues, fill available slots left-to-right
- If no eligible issues, all lanes empty except bench
- If issue loses "implementation ready" label, move to bench immediately
- Maintain independence when possible (don't place dependent issues together)
```

### Step 2: Refactor Script

Update `scripts/rebalance-lanes.js`:

```javascript
// NEW: Execution-only version
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { callAnthropicWithRetry } = require("./lib/api-helpers");

function loadRebalancePrompt() {
  const file = path.resolve(process.cwd(), ".github/prompts/rebalance-lanes.md");
  return fs.readFileSync(file, "utf8");
}

async function determineRebalancing(issues, triggerEvent) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback to hardcoded logic (preserved for safety)
    return fallbackRebalanceLogic(issues, triggerEvent);
  }

  const prompt = loadRebalancePrompt();
  const issueList = issues.map(i => 
    `#${i.number} "${i.title}" [${i.labels.join(', ')}] created:${i.created} lane:${i.lane}`
  ).join('\n');

  const user = `Trigger: ${triggerEvent}\n\nOpen Issues:\n${issueList}`;

  const payload = {
    model: process.env.REBALANCE_MODEL || "claude-sonnet-4-5-20250929",
    system: prompt,
    max_tokens: 2000,
    temperature: 0.1,
    messages: [{ role: "user", content: [{ type: "text", text: user }] }],
  };

  const data = await callAnthropicWithRetry(
    "https://api.anthropic.com/v1/messages",
    payload,
    apiKey
  );

  const jsonText = data.content.map(b => b.text).join("\n").trim();
  const match = jsonText.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : JSON.parse(jsonText);
}

async function applyRebalancing(changes) {
  for (const change of changes) {
    await setIssueLane(change.issue, change.to);
    console.log(`#${change.issue}: ${change.from} → ${change.to}`);
  }
}

async function main() {
  const issues = await fetchAllOpenIssues();
  const event = process.env.TRIGGER_EVENT || "Manual rebalance";
  const result = await determineRebalancing(issues, event);
  await applyRebalancing(result.changes);
  console.log(result.summary);
}

// Fallback for when API unavailable
function fallbackRebalanceLogic(issues, triggerEvent) {
  // Preserve existing hardcoded logic as safety net
  // ... existing implementation ...
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
```

## Common Patterns

### Pattern 1: Decision Functions

**Before (embedded):**
```javascript
function shouldApprove(issue) {
  return issue.body.length > 100 && 
         hasLabel(issue, 'size:small') &&
         !hasLabel(issue, 'needs-clarification');
}
```

**After (prompt-driven):**
```markdown
Approve issue if:
- Description is at least 100 characters
- Has size:small label
- Does not have needs-clarification label
```

### Pattern 2: Scoring/Ranking

**Before (embedded):**
```javascript
function calculatePriority(issue) {
  let score = 0;
  score += countLabels(issue, 'high-priority') * 10;
  score += countLabels(issue, 'urgent') * 5;
  score -= countLabels(issue, 'low-priority') * 5;
  return Math.max(0, Math.min(100, score));
}
```

**After (prompt-driven):**
```markdown
Priority Score = 
  + 10 for each 'high-priority' label
  + 5 for each 'urgent' label
  - 5 for each 'low-priority' label
Clamp to 0-100 range.
```

### Pattern 3: Multi-Step Workflows

**Before (embedded):**
```javascript
async function processIssue(issue) {
  const labels = await determineLabels(issue);
  const lane = await determineLane(issue, labels);
  const comment = await generateComment(issue, labels, lane);
  
  await applyLabels(issue, labels);
  await setLane(issue, lane);
  await postComment(issue, comment);
}
```

**After (prompt-driven):**
```markdown
For each issue, determine:
1. Labels to apply (based on content analysis)
2. Lane to assign (based on labels and capacity)
3. Comment to post (based on labels and lane)

Return JSON:
{
  "labels": ["feature", "size:medium", "priority:65"],
  "lane": "on the bench",
  "comment": "Issue triaged and added to backlog."
}
```

## Shared Utilities Library

Create `scripts/lib/prompt-helpers.js`:

```javascript
// Reusable utilities for prompt-driven scripts
const fs = require("fs");
const path = require("path");

function loadPrompt(name) {
  const file = path.resolve(process.cwd(), `.github/prompts/${name}.md`);
  if (!fs.existsSync(file)) {
    throw new Error(`Prompt file not found: ${file}`);
  }
  return fs.readFileSync(file, "utf8");
}

async function callPromptWithRetry(promptName, userMessage, options = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

  const prompt = loadPrompt(promptName);
  const model = options.model || "claude-sonnet-4-5-20250929";
  const maxTokens = options.maxTokens || 1500;
  const temperature = options.temperature || 0.1;

  const payload = {
    model,
    system: prompt,
    max_tokens: maxTokens,
    temperature,
    messages: [{ role: "user", content: [{ type: "text", text: userMessage }] }],
  };

  const { callAnthropicWithRetry } = require("./api-helpers");
  const data = await callAnthropicWithRetry(
    "https://api.anthropic.com/v1/messages",
    payload,
    apiKey
  );

  return data.content.map(b => b.text).join("\n").trim();
}

function parseJSONResponse(text) {
  // Extract JSON from response (handles markdown fences)
  const match = text.match(/```json\s*(\{[\s\S]*?\})\s*```/) || 
                text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No JSON found in response");
  }
  return JSON.parse(match[1] || match[0]);
}

module.exports = {
  loadPrompt,
  callPromptWithRetry,
  parseJSONResponse,
};
```

## Testing Strategy

### Unit Tests

Test prompts independently:

```javascript
// tests/prompts/rebalance-lanes.test.js
const { loadPrompt, callPromptWithRetry, parseJSONResponse } = require("../scripts/lib/prompt-helpers");

describe("Rebalance Lanes Prompt", () => {
  it("should assign issues to correct lanes", async () => {
    const issues = [
      { number: 1, labels: ["priority:90", "implementation ready"], created: "2024-01-01" },
      { number: 2, labels: ["priority:50", "implementation ready"], created: "2024-01-02" },
      // ... more test issues
    ];

    const response = await callPromptWithRetry(
      "rebalance-lanes",
      `Trigger: Test\n\nIssues:\n${JSON.stringify(issues)}`
    );

    const result = parseJSONResponse(response);
    
    expect(result.changes).toHaveLength(3);
    expect(result.changes[0].to).toBe("at bat");
    expect(result.changes[0].issue).toBe(1); // Highest priority
  });
});
```

### Integration Tests

Test full workflow:

```bash
# scripts/test-migration.sh
#!/bin/bash

# Test old vs new implementation
echo "Testing issue-intake migration..."
OLD_RESULT=$(node scripts/issue-intake-old.js --issue 123)
NEW_RESULT=$(node scripts/issue-intake.js --issue 123)

if [ "$OLD_RESULT" == "$NEW_RESULT" ]; then
  echo "✓ issue-intake: Results match"
else
  echo "✗ issue-intake: Results differ"
  diff <(echo "$OLD_RESULT") <(echo "$NEW_RESULT")
fi
```

## Rollout Plan

### Phase 1: Parallel Run (2 weeks)

- Run both old and new implementations
- Compare results
- Log discrepancies
- Adjust prompts to match expected behavior

### Phase 2: Canary Deployment (1 week)

- Route 10% of traffic to new implementation
- Monitor error rates
- Collect feedback
- Increase to 50% if stable

### Phase 3: Full Migration (1 week)

- Route 100% to new implementation
- Keep old code as fallback
- Archive old implementation after stabilization

### Phase 4: Cleanup

- Remove old code
- Update documentation
- Train team on new architecture

## Monitoring and Debugging

### Logging

Add comprehensive logging:

```javascript
console.log(`[${new Date().toISOString()}] Calling prompt: ${promptName}`);
console.log(`[DEBUG] Input: ${JSON.stringify(userMessage).substring(0, 200)}...`);
console.log(`[DEBUG] Response: ${JSON.stringify(response).substring(0, 200)}...`);
```

### Debugging Failed Prompts

```bash
# Save prompt + input for debugging
export DEBUG_PROMPTS=true
node scripts/issue-intake.js

# Creates files:
# /tmp/prompts/issue-intake-TIMESTAMP.txt (full prompt)
# /tmp/prompts/issue-intake-TIMESTAMP-input.txt (user message)
# /tmp/prompts/issue-intake-TIMESTAMP-output.txt (AI response)
```

### A/B Testing

Compare prompt versions:

```javascript
async function comparePromptVersions(issue) {
  const v1Result = await callPrompt("issue-intake-v1", issue);
  const v2Result = await callPrompt("issue-intake-v2", issue);
  
  console.log("V1:", v1Result);
  console.log("V2:", v2Result);
  console.log("Winner:", determineWinner(v1Result, v2Result));
}
```

## Benefits Realized

After full migration:

✅ **Maintainability:** Rules updated in markdown, not code  
✅ **Testability:** Prompt changes testable without deployments  
✅ **Auditability:** Git history shows rule evolution  
✅ **Flexibility:** Swap AI models via environment variable  
✅ **Consistency:** Single source of truth for business logic  
✅ **Transparency:** Non-engineers can review and propose changes  
✅ **Scalability:** Add new prompts without touching infrastructure  

## Next Steps

1. ✅ Read this guide
2. ✅ Review pm-review.js as reference implementation
3. ⬜ Migrate issue-intake.js (medium complexity)
4. ⬜ Migrate rebalance-lanes.js (high complexity)
5. ⬜ Migrate pm-review-local.js (low complexity)
6. ⬜ Create shared utilities library
7. ⬜ Add comprehensive tests
8. ⬜ Deploy with feature flags
9. ⬜ Monitor and iterate
10. ⬜ Archive old implementations

## See Also

- [PM Review Script](../../scripts/pm-review.js) - Reference implementation
- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md) - Retry logic for API calls
- [PM Modes Overview](./modes/PM_MODES_OVERVIEW.md) - Dual mode architecture
- [Project Manager Mode](./modes/project-manager.md) - Example of logic-in-prompt
- [AI Assistant PM Mode](./modes/ai-assistant-pm.md) - Example of logic-in-prompt
