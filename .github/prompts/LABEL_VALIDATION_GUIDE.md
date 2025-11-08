# Label Validation Guidelines

This document defines automated validation rules for GitHub issue labels in the PM system, ensuring completeness and correctness.

## Overview

Every issue in the AI Practitioner Resources project must have a complete, valid set of labels that enable effective prioritization and lane management. This guide provides rules for automated validation.

## Required Labels (Baseline)

Every open issue **MUST** have exactly one label from each category:

### 1. Type Labels

**Purpose:** Classify the nature of the work

**Valid Values:**
- `feature` - New functionality or capability
- `bug` - Defect or incorrect behavior
- `enhancement` - Improvement to existing functionality
- `refactor` - Code restructuring without behavior change
- `documentation` - Documentation updates or additions
- `idea` - Proposal or discussion (not yet approved)
- `automation` - Workflow or CI/CD changes
- `chore` - Maintenance tasks

**Validation Rule:**
```javascript
const typeLabels = ['feature', 'bug', 'enhancement', 'refactor', 
                    'documentation', 'idea', 'automation', 'chore'];
const hasTypeLabel = issue.labels.some(l => typeLabels.includes(l.name));
// MUST: hasTypeLabel === true
```

**Error Message:**
```
❌ Missing type label. Add one of: feature, bug, enhancement, refactor, documentation, idea, automation, chore
```

### 2. Size Labels

**Purpose:** Estimate implementation effort

**Valid Values:**
- `size:small` - < 100 lines of code changed
- `size:medium` - 100-500 lines of code changed
- `size:large` - > 500 lines of code changed

**Validation Rules:**
```javascript
const sizePattern = /^size:(small|medium|large)$/;
const sizeLabels = issue.labels.filter(l => sizePattern.test(l.name));

// MUST: Exactly one size label
if (sizeLabels.length === 0) {
  errors.push("Missing size label. Add one of: size:small, size:medium, size:large");
}
if (sizeLabels.length > 1) {
  errors.push("Multiple size labels found. Keep only one.");
}

// MUST: size:large issues require sub-issues
if (sizeLabels[0]?.name === 'size:large' && 
    !issue.body.includes('Sub-issues:') &&
    !hasLabel(issue, 'needs-clarification')) {
  errors.push("size:large issues must be split into smaller sub-issues before approval");
}
```

**Error Messages:**
```
❌ Missing size label. Add one of: size:small, size:medium, size:large
❌ Multiple size labels found. Remove duplicates.
❌ size:large issues require breakdown into sub-issues before approval
```

### 3. Priority Labels

**Purpose:** Numerical priority score for ranking

**Valid Values:**
- `priority:NN` where NN is 0-100 (integer)
- OR `score:NN` (legacy format, should be migrated)

**Validation Rules:**
```javascript
const priorityPattern = /^(priority|score):(\d{1,3})$/;
const priorityLabels = issue.labels.filter(l => priorityPattern.test(l.name));

// MUST: Exactly one priority label
if (priorityLabels.length === 0) {
  errors.push("Missing priority label. Add priority:NN (0-100)");
}
if (priorityLabels.length > 1) {
  errors.push("Multiple priority labels found. Keep only one.");
}

// MUST: Priority value in range 0-100
const match = priorityLabels[0]?.name.match(priorityPattern);
if (match) {
  const value = parseInt(match[2], 10);
  if (value < 0 || value > 100) {
    errors.push(`Priority value ${value} out of range. Must be 0-100.`);
  }
}
```

**Error Messages:**
```
❌ Missing priority label. Add priority:NN where NN is 0-100
❌ Multiple priority labels found. Remove duplicates.
❌ Priority value must be 0-100 (found: 150)
```

### 4. Independence Labels

**Purpose:** Indicate parallel implementation safety

**Valid Values:**
- `independence:high` - Can be implemented in parallel with other issues
- `independence:low` - Has dependencies or conflicts

**Optional Convenience Label:**
- `independent` - Shorthand for `independence:high` (both can be present)

**Validation Rules:**
```javascript
const independencePattern = /^independence:(high|low)$/;
const independenceLabels = issue.labels.filter(l => independencePattern.test(l.name));

// MUST: Exactly one independence label
if (independenceLabels.length === 0) {
  errors.push("Missing independence label. Add independence:high or independence:low");
}
if (independenceLabels.length > 1) {
  errors.push("Multiple independence labels found. Keep only one.");
}

// RECOMMEND: Add 'independent' for high independence issues
if (hasLabel(issue, 'independence:high') && !hasLabel(issue, 'independent')) {
  warnings.push("Consider adding 'independent' label for clarity");
}
```

**Error Messages:**
```
❌ Missing independence label. Add independence:high or independence:low
❌ Multiple independence labels found. Remove duplicates.
⚠️ Consider adding 'independent' label for high independence issues
```

### 5. Risk Labels

**Purpose:** Assess implementation risk

**Valid Values:**
- `risk:low` - Straightforward, well-understood changes
- `risk:medium` - Some complexity or unknowns
- `risk:high` - Significant complexity, multiple unknowns, or critical path

**Validation Rules:**
```javascript
const riskPattern = /^risk:(low|medium|high)$/;
const riskLabels = issue.labels.filter(l => riskPattern.test(l.name));

// MUST: Exactly one risk label
if (riskLabels.length === 0) {
  errors.push("Missing risk label. Add one of: risk:low, risk:medium, risk:high");
}
if (riskLabels.length > 1) {
  errors.push("Multiple risk labels found. Keep only one.");
}
```

**Error Messages:**
```
❌ Missing risk label. Add one of: risk:low, risk:medium, risk:high
❌ Multiple risk labels found. Remove duplicates.
```

### 6. Lane Labels

**Purpose:** Track issue position in workflow

**Valid Values:**
- `at bat` - Currently being worked on (max 3 issues)
- `on deck` - Next up in queue (max 3 issues)
- `in the hole` - Coming soon (max 3 issues)
- `on the bench` - Backlog (unlimited)

**Validation Rules:**
```javascript
const laneLabels = ['at bat', 'on deck', 'in the hole', 'on the bench'];
const issueLabels = issue.labels.filter(l => laneLabels.includes(l.name));

// MUST: Exactly one lane label
if (issueLabels.length === 0) {
  errors.push("Missing lane label. Add one of: at bat, on deck, in the hole, on the bench");
}
if (issueLabels.length > 1) {
  errors.push("Multiple lane labels found. Issue must be in exactly one lane.");
}

// MUST: Active lanes respect capacity
const activeLanes = ['at bat', 'on deck', 'in the hole'];
for (const lane of activeLanes) {
  const count = allIssues.filter(i => hasLabel(i, lane)).length;
  if (count > 3) {
    errors.push(`Lane "${lane}" over capacity: ${count}/3 issues`);
  }
}
```

**Error Messages:**
```
❌ Missing lane label. Add one of: at bat, on deck, in the hole, on the bench
❌ Multiple lane labels found. Issue must be in exactly one lane.
❌ Lane "at bat" over capacity: 4/3 issues
```

### 7. Readiness Labels

**Purpose:** Gate approval for implementation

**Valid Values:**
- `needs-clarification` - Missing information, not ready for implementation
- `implementation ready` - Approved by human, ready to implement (human-only)

**Validation Rules:**
```javascript
const readinessLabels = ['needs-clarification', 'implementation ready'];
const issueReadiness = issue.labels.filter(l => readinessLabels.includes(l.name));

// MUST: Exactly one readiness label
if (issueReadiness.length === 0) {
  errors.push("Missing readiness label. Add needs-clarification or implementation ready");
}
if (issueReadiness.length > 1) {
  errors.push("Both readiness labels present. Remove one.");
}

// MUST: Active lanes require implementation ready
const activeLanes = ['at bat', 'on deck', 'in the hole'];
const inActiveLane = activeLanes.some(lane => hasLabel(issue, lane));
if (inActiveLane && !hasLabel(issue, 'implementation ready')) {
  errors.push("Issues in active lanes must have 'implementation ready' label");
}
```

**Error Messages:**
```
❌ Missing readiness label. Add needs-clarification or implementation ready
❌ Both readiness labels present. Choose one.
❌ Active lane issues must have 'implementation ready' label
```

## Optional Labels

These labels provide additional context but are not required:

### Component Labels

Indicate which part of the codebase is affected:
- `component:scripts` - Automation scripts
- `component:web` - Web viewer (index.html, styles)
- `component:workflows` - GitHub Actions
- `component:prompts` - AI prompts and modes
- `component:docs` - Documentation

### Special Labels

- `good first issue` - Suitable for new contributors
- `help wanted` - Extra attention needed
- `breaking change` - Changes that break backward compatibility
- `security` - Security-related changes

## Validation Implementation

### Validation Script

Create `scripts/validate-labels.js`:

```javascript
// Label validation script
const fetch = require('node-fetch');

async function validateIssueLabels(issue) {
  const errors = [];
  const warnings = [];
  
  // Check all required label categories
  errors.push(...validateType(issue));
  errors.push(...validateSize(issue));
  errors.push(...validatePriority(issue));
  errors.push(...validateIndependence(issue));
  errors.push(...validateRisk(issue));
  errors.push(...validateLane(issue));
  errors.push(...validateReadiness(issue));
  
  return { errors, warnings };
}

function validateType(issue) {
  const typeLabels = ['feature', 'bug', 'enhancement', 'refactor', 
                      'documentation', 'idea', 'automation', 'chore'];
  const hasType = issue.labels.some(l => typeLabels.includes(l.name));
  return hasType ? [] : ['Missing type label'];
}

// ... implement other validation functions
```

### GitHub Action Integration

Create `.github/workflows/validate-labels.yml`:

```yaml
name: Validate Labels

on:
  issues:
    types: [labeled, unlabeled, opened, reopened]
  workflow_dispatch:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci --omit=dev
      
      - name: Validate issue labels
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
          ISSUE_NUMBER: ${{ github.event.issue.number }}
        run: node scripts/validate-labels.js
      
      - name: Post validation results
        if: failure()
        run: |
          gh issue comment ${{ github.event.issue.number }} \
            --body "⚠️ Label validation failed. See workflow logs for details."
```

### Manual Validation

```bash
# Validate all open issues
gh issue list --state open --json number,labels | \
  node scripts/validate-labels.js --stdin

# Validate specific issue
gh issue view 123 --json number,labels | \
  node scripts/validate-labels.js --stdin
```

## Automated Remediation

### Auto-fix Common Issues

```javascript
// Example: Remove duplicate labels
async function removeDuplicateLabels(owner, repo, issue) {
  const categories = {
    size: /^size:(small|medium|large)$/,
    priority: /^(priority|score):\d{1,3}$/,
    independence: /^independence:(high|low)$/,
    risk: /^risk:(low|medium|high)$/,
  };
  
  for (const [category, pattern] of Object.entries(categories)) {
    const matching = issue.labels.filter(l => pattern.test(l.name));
    if (matching.length > 1) {
      // Keep first, remove rest
      const toRemove = matching.slice(1);
      for (const label of toRemove) {
        await removeLabel(owner, repo, issue.number, label.name);
      }
    }
  }
}
```

### Suggest Missing Labels

```javascript
// Example: Suggest type based on title
function suggestType(issue) {
  const title = issue.title.toLowerCase();
  if (title.includes('fix') || title.includes('bug')) return 'bug';
  if (title.includes('add') || title.includes('new')) return 'feature';
  if (title.includes('update') || title.includes('improve')) return 'enhancement';
  if (title.includes('refactor') || title.includes('cleanup')) return 'refactor';
  if (title.includes('doc')) return 'documentation';
  return null;
}
```

## Reporting and Metrics

### Label Completeness Report

```bash
# Generate report of label completeness
gh issue list --state open --json number,title,labels | \
  jq -r '.[] | 
    select(.labels | map(.name) | 
      (contains(["size:small","size:medium","size:large"]) | not) or
      (contains(["priority","score"]) | not) or
      (contains(["independence:high","independence:low"]) | not)) | 
    {number, title, missing: [
      (if (.labels|map(.name)|contains(["size:small","size:medium","size:large"])|not) then "size" else null end),
      (if (.labels|map(.name)|contains(["priority","score"])|not) then "priority" else null end),
      (if (.labels|map(.name)|contains(["independence:high","independence:low"])|not) then "independence" else null end)
    ] | map(select(.)) }'
```

### Label Validation Dashboard

Track validation metrics:
- % of issues with complete labels
- Most common missing labels
- Average time to label completion
- Issues with validation errors

## See Also

- [Project Manager Mode](./modes/project-manager.md)
- [AI Assistant PM Mode](./modes/ai-assistant-pm.md)
- [PM Review Script](../../scripts/pm-review.js)
- [Issue Intake Script](../../scripts/issue-intake.js)
- [Rebalance Lanes Script](../../scripts/rebalance-lanes.js)
