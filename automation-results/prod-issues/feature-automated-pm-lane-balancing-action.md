### Description

Make the Project Manager mode callable as a GitHub Action for automated lane balancing, enabling scheduled or event-triggered prioritization without manual intervention.

### Problem

Currently, lane balancing (moving issues between "at bat", "on deck", "in the hole", and "on the bench") requires:

- Manual invocation of the rebalance-lanes.js script
- Human PM to run the project-manager chat mode
- Only triggers on issue close events

This means:

- New high-priority issues aren't automatically promoted
- Lane balance isn't maintained when priority scores change
- No scheduled re-evaluation of issue priorities
- Manual intervention required for most prioritization decisions

### Proposed Solution

Create a GitHub Action that uses the project-manager.md prompt to perform automated lane balancing:

**Components:**

1. **Action Script** (`.github/actions/pm-lane-balance/action.yml`)

   - Wraps project-manager mode logic
   - Calls Anthropic API with project-manager.md prompt
   - Applies lane label changes via GitHub API

2. **Workflow Triggers** (`.github/workflows/pm-lane-balance.yml`)

   - Scheduled: Daily at midnight (cron)
   - Manual: workflow_dispatch
   - Event: Issue labeled with "implementation ready"
   - Event: Priority label changed

3. **Smart Rebalancing** (`scripts/pm-lane-balance.js`)
   - Queries all open issues with labels
   - Calculates priority scores
   - Checks independence constraints
   - Applies lane labels according to PM rules
   - Posts summary comment

### Acceptance Criteria

**Action Implementation:**

- [ ] GitHub Action created in `.github/actions/pm-lane-balance/`
- [ ] Action can be triggered manually via workflow_dispatch
- [ ] Action can be scheduled via cron
- [ ] Action respects the 3-issue cap per active lane
- [ ] Action only promotes "implementation ready" issues to active lanes
- [ ] Action checks for independence conflicts before placing issues

**Workflow Triggers:**

- [ ] Daily scheduled run at midnight UTC
- [ ] Manual trigger with optional parameters (dry-run, force-rebalance)
- [ ] Triggered when issue labeled "implementation ready"
- [ ] Triggered when priority label changes (priority:XX)

**Safety Features:**

- [ ] Dry-run mode that shows proposed changes without applying
- [ ] Validation that no more than 3 issues in at bat/on deck/in the hole
- [ ] Conflict detection for independence violations
- [ ] Summary comment posted to a tracking issue with changes made

**Reporting:**

- [ ] Posts summary of lane changes as issue comment
- [ ] Logs all lane movements for audit trail
- [ ] Reports independence conflicts or cap violations
- [ ] Includes rationale for each promotion/demotion

### Example Output

**Issue Comment:**

```markdown
## 🏷️ Lane Rebalancing — 2025-11-07

### Changes Applied

**Promoted to "at bat":**

- #145 Feature: Add export functionality (priority:92, independence:high, size:small)
  - Rationale: Highest priority implementation-ready issue, independent of current work

**Moved to "on deck":**

- #138 Bug: Fix memory leak (priority:85, independence:high, size:medium)
  - Rationale: High priority, independent, next in queue

**Demoted to "on the bench":**

- #122 Enhancement: Update docs (priority:45, independence:low, size:large)
  - Rationale: Lower priority than newly ready issues

### Current Lane Status

- **At bat (3/3):** #145, #141, #137
- **On deck (3/3):** #138, #135, #134
- **In the hole (2/3):** #133, #130
- **On the bench:** 23 issues

### Independence Check

✅ All active lane issues are independent
✅ No file/component conflicts detected

---

_Automated by PM Lane Balance Action • [View workflow run](https://github.com/...)_
```

### Technical Implementation

**PM Lane Balance Script:**

```javascript
// Pseudocode
async function balanceLanes() {
  // 1. Fetch all open issues with labels
  const issues = await fetchOpenIssues();

  // 2. Filter to implementation-ready only for active lanes
  const ready = issues.filter(hasLabel('implementation ready'));

  // 3. Calculate priority scores from labels
  const scored = ready.map(calculatePriorityScore);

  // 4. Sort by priority (desc), independence (high first), size (small first), age (old first)
  const sorted = scored.sort(compareIssues);

  // 5. Check independence constraints
  const independent = filterIndependent(sorted);

  // 6. Assign to lanes with caps
  const lanes = {
    'at bat': independent.slice(0, 3),
    'on deck': independent.slice(3, 6),
    'in the hole': independent.slice(6, 9),
    'on the bench': [...independent.slice(9), ...issues.filter(not ready)]
  };

  // 7. Apply lane labels
  await applyLaneLabels(lanes);

  // 8. Post summary
  await postSummary(lanes);
}
```

**Action Configuration:**

```yaml
name: PM Lane Balance
description: Automated lane balancing using project-manager rules
inputs:
  dry-run:
    description: "Show changes without applying them"
    required: false
    default: "false"
  force:
    description: "Force rebalance even if no issues closed"
    required: false
    default: "false"
runs:
  using: "node20"
  main: "dist/index.js"
```

### AI Integration Option

Consider two modes:

**Mode 1: Rule-Based (No AI)**

- Pure JavaScript implementation of project-manager.md rules
- Faster, no API costs
- Deterministic output
- Recommended for scheduled runs

**Mode 2: AI-Assisted (Optional)**

- Uses Anthropic API with project-manager.md prompt
- Provides rationale and nuanced decisions
- Better handling of edge cases
- Recommended for complex scenarios or manual runs

### Dependencies

- Requires GitHub API access (GITHUB_TOKEN)
- Optional: Anthropic API key for AI-assisted mode
- Must respect GitHub Actions rate limits

### Risk Level

Medium:

- Modifies issue labels automatically
- Could misclassify issues if logic is incorrect
- Mitigated by: dry-run mode, summary comments, audit trail

### Size Estimate

Large - approximately 500-700 lines:

- 200 lines for lane balancing logic
- 200 lines for independence checking and conflict detection
- 100 lines for GitHub Action wrapper
- 100 lines for reporting and summary generation
- 100 lines for tests and validation
