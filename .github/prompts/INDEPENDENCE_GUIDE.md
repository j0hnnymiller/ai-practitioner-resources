# Issue Independence Guidelines

This document defines rules for determining whether issues are "independent" vs "dependent" and explains how to achieve consistent assessments across different reviewers.

## Overview

**Independence** is a critical factor in parallelization decisions. Independent issues can be implemented simultaneously by different developers without merge conflicts or coordination overhead. This capability is essential for maintaining high throughput in the PM system's active lanes.

## Independence Definition

### Independent Issues (independence:high)

Two or more issues are **independent** when they can be implemented in parallel with:
- **Zero merge conflicts** (no overlapping file changes)
- **Minimal coordination** (no blocking dependencies)
- **No breaking changes** (no API contract changes that affect each other)

### Dependent Issues (independence:low)

Issues are **dependent** when they:
- **Modify the same files** (even different sections)
- **Change shared APIs** (function signatures, data structures, configs)
- **Require sequential implementation** (one must complete before the other)
- **Have cross-cutting concerns** (security, authentication, routing)

## Concrete Independence Criteria

### 1. File-Level Independence

**Rule:** Issues that modify different files are typically independent.

**Implementation:**
```javascript
function checkFileIndependence(issue1, issue2) {
  const files1 = extractAffectedFiles(issue1);
  const files2 = extractAffectedFiles(issue2);
  
  const overlap = files1.filter(f => files2.includes(f));
  
  if (overlap.length === 0) {
    return { independent: true, reason: "No overlapping files" };
  } else {
    return { 
      independent: false, 
      reason: `Overlapping files: ${overlap.join(', ')}` 
    };
  }
}
```

**Examples:**

✅ **Independent:**
- Issue A: Modify `scripts/generate-resources.js`
- Issue B: Modify `index.html`
- **Reason:** Different files, no overlap

✅ **Independent:**
- Issue A: Add new script `scripts/analyze-trends.js`
- Issue B: Update documentation `README.md`
- **Reason:** New file vs documentation, no conflicts

❌ **Dependent:**
- Issue A: Refactor `scripts/pm-review.js`
- Issue B: Fix bug in `scripts/pm-review.js`
- **Reason:** Same file, guaranteed merge conflict

### 2. Component-Level Independence

**Rule:** Issues affecting different architectural components are typically independent.

**Component Boundaries:**

| Component | Files/Directories | Independence Level |
|-----------|-------------------|-------------------|
| **Web Viewer** | `index.html`, `styles.css` | High - isolated from backend |
| **Automation Scripts** | `scripts/*.js` (except shared libs) | Medium - individual scripts |
| **Shared Libraries** | `scripts/lib/*.js` | Low - affects multiple scripts |
| **Workflows** | `.github/workflows/*.yml` | High - isolated workflows |
| **Prompts** | `.github/prompts/*.md` | High - content only |
| **Schema** | `schema.json` | Low - affects validation everywhere |
| **Configuration** | `package.json`, `.gitignore` | Low - global impact |

**Examples:**

✅ **Independent:**
- Issue A: Add filter to web viewer (`index.html`)
- Issue B: Update resource generation prompt (`.github/prompts/ai-practitioner-resources-json.prompt.md`)
- **Reason:** Different components, no shared dependencies

✅ **Independent:**
- Issue A: Add new workflow for deployment (`.github/workflows/deploy.yml`)
- Issue B: Fix bug in rebalance script (`scripts/rebalance-lanes.js`)
- **Reason:** Isolated components

❌ **Dependent:**
- Issue A: Add new field to `schema.json`
- Issue B: Update validation in `scripts/validate-schema.js`
- **Reason:** Schema changes affect validation logic

❌ **Dependent:**
- Issue A: Refactor `scripts/lib/graphql-helpers.js`
- Issue B: Add feature using GraphQL helpers in `scripts/issue-intake.js`
- **Reason:** Shared library changes affect dependents

### 3. API/Interface Independence

**Rule:** Issues that modify public interfaces or contracts are typically dependent.

**Public Interfaces:**
- Function signatures (especially exported functions)
- Data structures (JSON schema, API responses)
- Environment variables and configuration
- GitHub label names (used by multiple scripts)
- Project field names (Status, Priority, etc.)

**Examples:**

✅ **Independent:**
- Issue A: Add internal helper function to `pm-review.js`
- Issue B: Add internal helper function to `rebalance-lanes.js`
- **Reason:** Internal changes, no public API impact

❌ **Dependent:**
- Issue A: Rename environment variable `ANTHROPIC_API_KEY` to `CLAUDE_API_KEY`
- Issue B: Add new feature using `ANTHROPIC_API_KEY`
- **Reason:** Breaking change affects all consumers

❌ **Dependent:**
- Issue A: Change `priority:NN` label format to `priority-NN`
- Issue B: Add priority sorting feature
- **Reason:** Label format is a shared contract

### 4. Dependency-Based Independence

**Rule:** Issues with blocking dependencies are not independent.

**Dependency Types:**

**Hard Dependencies (always dependent):**
- Issue B requires Issue A to be merged first
- Issue B tests functionality added by Issue A
- Issue B extends/modifies code added by Issue A

**Soft Dependencies (may be independent):**
- Issue B would benefit from Issue A being done first (but can proceed without)
- Issue B addresses similar problem space as Issue A (but different solution)

**Examples:**

✅ **Independent:**
- Issue A: Add dark mode toggle
- Issue B: Add print stylesheet
- **Reason:** Both UI features, but no dependency

❌ **Dependent:**
- Issue A: Add new GraphQL query helper function
- Issue B: Use new helper in issue-intake script
- **Reason:** B depends on A being merged

❌ **Dependent:**
- Issue A: Split large issue into sub-issues
- Issue B: Implement one of the sub-issues from A
- **Reason:** B cannot proceed until A defines it

### 5. Temporal/Sequencing Independence

**Rule:** Issues that must be done in a specific order are dependent.

**Sequential Requirements:**
- Database migrations (schema must exist before data migration)
- Feature flags (flag must exist before feature)
- Prerequisites (library must be installed before use)

**Examples:**

❌ **Dependent:**
- Issue A: Add retry logic to API calls
- Issue B: Test retry logic with fault injection
- **Reason:** Must implement before testing

✅ **Independent:**
- Issue A: Add tests for existing feature X
- Issue B: Add tests for existing feature Y
- **Reason:** Both test additions, no overlap

## Scoring Independence

### Quantitative Scoring System

Use a numerical score (0-5) for independence assessment:

**5 - Completely Independent:**
- Different components
- No shared files
- No API changes
- No dependencies
- Can merge in any order

**4 - Mostly Independent:**
- Different files in same component
- Minimal coordination needed
- Very low merge conflict risk

**3 - Moderately Independent:**
- Different sections of same large file
- Some shared dependencies
- Moderate merge conflict risk
- May require communication between implementers

**2 - Mostly Dependent:**
- Same files, different changes
- Shared API modifications
- High merge conflict risk
- Requires coordination

**1 - Highly Dependent:**
- Sequential implementation required
- Blocking dependencies
- Breaking changes to shared interfaces

**0 - Fully Dependent:**
- Same exact functionality
- Duplicate work
- Must be merged as one

### Example Scoring

```javascript
function scoreIndependence(issue1, issue2) {
  let score = 5; // Start with full independence
  
  const files1 = extractAffectedFiles(issue1);
  const files2 = extractAffectedFiles(issue2);
  const overlap = files1.filter(f => files2.includes(f));
  
  // Penalty for file overlap
  if (overlap.length > 0) score -= 2;
  
  // Penalty for same component
  const comp1 = extractComponent(issue1);
  const comp2 = extractComponent(issue2);
  if (comp1 === comp2 && overlap.length === 0) score -= 1;
  
  // Penalty for shared dependencies
  if (hasDependencyRelationship(issue1, issue2)) score -= 2;
  
  // Penalty for API changes
  if (changesPublicAPI(issue1) && changesPublicAPI(issue2)) score -= 1;
  
  return Math.max(0, score);
}
```

## Extracting Affected Files/Components

### From Issue Body

**Explicit Mentions:**
```markdown
## Affected Files
- `scripts/pm-review.js`
- `.github/workflows/issue-intake.yml`
```

**Implicit Mentions:**
```markdown
The pm-review script should add retry logic...
```
→ Inferred: `scripts/pm-review.js`

### From Issue Title

**Title Patterns:**
```
"Fix bug in rebalance-lanes.js" → scripts/rebalance-lanes.js
"Update web viewer UI" → index.html, styles.css
"Add GitHub Actions workflow for X" → .github/workflows/
```

### From Labels

**Component Labels:**
```
component:scripts → scripts/
component:web → index.html, styles.css
component:workflows → .github/workflows/
component:prompts → .github/prompts/
```

### From Historical Data

**Check previous PRs from author:**
```bash
gh pr list --author=<username> --state=merged --json files | \
  jq -r '.[].files[].path' | sort | uniq -c | sort -rn
```

## Automated Independence Checker

### Script Implementation

Create `scripts/check-independence.js`:

```javascript
const fetch = require('node-fetch');

async function checkIndependence(issue1Number, issue2Number) {
  const issue1 = await getIssue(issue1Number);
  const issue2 = await getIssue(issue2Number);
  
  const files1 = extractAffectedFiles(issue1);
  const files2 = extractAffectedFiles(issue2);
  const comp1 = extractComponent(issue1);
  const comp2 = extractComponent(issue2);
  
  const fileOverlap = files1.filter(f => files2.includes(f));
  const sameComponent = comp1 === comp2;
  const hasDeps = checkDependencies(issue1, issue2);
  
  const score = scoreIndependence(issue1, issue2);
  const independent = score >= 4;
  
  return {
    independent,
    score,
    reasons: [
      fileOverlap.length > 0 ? `File overlap: ${fileOverlap.join(', ')}` : null,
      sameComponent ? `Same component: ${comp1}` : null,
      hasDeps ? 'Has dependencies' : null,
    ].filter(Boolean),
    recommendation: independent ? 
      'Can be implemented in parallel' : 
      'Should be implemented sequentially',
  };
}

function extractAffectedFiles(issue) {
  const files = [];
  
  // Extract from body
  const bodyMatches = issue.body.matchAll(/`([^`]+\.(js|yml|md|json|html|css))`/g);
  for (const match of bodyMatches) {
    files.push(match[1]);
  }
  
  // Extract from title
  const titleMatches = issue.title.matchAll(/\b([a-z-]+\.(js|yml|md))/gi);
  for (const match of titleMatches) {
    files.push(match[1]);
  }
  
  // Infer from component labels
  const componentLabel = issue.labels.find(l => l.name.startsWith('component:'));
  if (componentLabel) {
    const component = componentLabel.name.split(':')[1];
    files.push(...getComponentFiles(component));
  }
  
  return [...new Set(files)];
}

function extractComponent(issue) {
  // Check for explicit component label
  const label = issue.labels.find(l => l.name.startsWith('component:'));
  if (label) return label.name.split(':')[1];
  
  // Infer from affected files
  const files = extractAffectedFiles(issue);
  if (files.some(f => f.startsWith('scripts/'))) return 'scripts';
  if (files.some(f => f.includes('index.html'))) return 'web';
  if (files.some(f => f.includes('.github/workflows'))) return 'workflows';
  
  return 'unknown';
}

function checkDependencies(issue1, issue2) {
  // Check for explicit dependency mentions
  const body1 = issue1.body.toLowerCase();
  const body2 = issue2.body.toLowerCase();
  
  if (body1.includes(`#${issue2.number}`) || body2.includes(`#${issue1.number}`)) {
    return true;
  }
  
  if (body1.includes('depends on') || body2.includes('depends on')) {
    return true;
  }
  
  return false;
}
```

### CLI Usage

```bash
# Check independence between two issues
node scripts/check-independence.js 123 124

# Output:
# Independence Check: #123 vs #124
# Score: 2/5
# Independent: No
# Reasons:
#   - File overlap: scripts/pm-review.js
#   - Same component: scripts
# Recommendation: Should be implemented sequentially
```

## Addressing Inconsistent Assessments

### Problem: Inconsistent Assessments Across Reviewers

**Symptoms:**
- Different reviewers assign different independence labels to similar issues
- Same issue gets different independence scores in different reviews
- Reviewers disagree on whether issues can be parallelized

**Root Causes:**
1. **Subjective judgment** - Vague criteria allow interpretation
2. **Missing context** - Reviewers don't have full file/dependency information
3. **Experience variance** - Junior vs senior reviewers assess differently
4. **Incomplete issue descriptions** - Affected files not clearly stated

### Solution 1: Objective Criteria Checklist

Create a standardized checklist that removes subjectivity:

```markdown
## Independence Assessment Checklist

For issues #A and #B:

File Overlap:
- [ ] No overlapping files → +2 points
- [ ] Different sections of same file → +1 point
- [ ] Same sections of same file → 0 points

Component:
- [ ] Different components → +1 point
- [ ] Same component, different files → 0 points
- [ ] Same component, same files → -1 point

Dependencies:
- [ ] No dependencies → +1 point
- [ ] Soft dependency (nice-to-have) → 0 points
- [ ] Hard dependency (blocking) → -1 point

API Impact:
- [ ] No API changes → +1 point
- [ ] Internal changes only → 0 points
- [ ] Public API changes → -1 point

**Total Score: _____ / 5**
**Independence: high (≥4) / low (<4)**
```

### Solution 2: Automated Assistance

Use the `check-independence.js` script to provide objective baseline:

```yaml
# .github/workflows/check-independence.yml
name: Check Independence

on:
  issue_comment:
    types: [created]

jobs:
  check:
    if: contains(github.event.comment.body, '/check-independence')
    runs-on: ubuntu-latest
    steps:
      - name: Parse issue numbers
        run: |
          # Extract issue numbers from comment
          echo "${{ github.event.comment.body }}" | \
            grep -oP '#\K\d+' > issue_numbers.txt
      
      - name: Check independence
        run: |
          issue1=$(sed -n 1p issue_numbers.txt)
          issue2=$(sed -n 2p issue_numbers.txt)
          node scripts/check-independence.js $issue1 $issue2 | \
            gh issue comment ${{ github.event.issue.number }} --body-file -
```

**Usage:**
```
Comment: "/check-independence #123 #124"
Bot replies with independence analysis
```

### Solution 3: Training and Calibration

**Calibration Exercise:**
1. Select 10 issue pairs with known independence levels
2. Have all reviewers assess them
3. Compare results and discuss discrepancies
4. Update guidelines based on findings

**Example Calibration Set:**

| Issue Pair | Expected | Files | Reason |
|------------|----------|-------|--------|
| #101 vs #102 | Independent | Different | Different components |
| #103 vs #104 | Dependent | Same | Same file, same feature |
| #105 vs #106 | Independent | None overlap | Different files, same component |
| #107 vs #108 | Dependent | Shared lib | API change dependency |

### Solution 4: Standardized Templates

**Issue Template with Independence Section:**

```markdown
## Affected Components
- [ ] Web viewer (`index.html`, `styles.css`)
- [ ] Automation scripts (`scripts/*.js`)
- [ ] Workflows (`.github/workflows/*.yml`)
- [ ] Prompts (`.github/prompts/*.md`)
- [ ] Documentation (`*.md`)

## Specific Files
List all files that will be modified:
1. 
2. 
3. 

## Dependencies
- [ ] No dependencies
- [ ] Depends on issue #___
- [ ] Blocks issue #___

## API Changes
- [ ] No API changes
- [ ] Internal API only
- [ ] Public API changes (list):
  - 
```

### Solution 5: Review and Audit Process

**Periodic Audits:**
```bash
# Find issues with potential independence conflicts
gh issue list --state open --label "at bat" --json number,title,labels | \
  jq -r '.[] | "Issue #\(.number): \(.title)"' | \
  while read line; do
    # Check each pair in "at bat" for independence
    echo "Checking: $line"
  done
```

**Metrics to Track:**
- % agreement between reviewers on independence
- Merge conflict rate in parallel issues
- Average time to resolve independence disputes

## Best Practices

### 1. Be Conservative

**When in doubt, mark as dependent.** The cost of merge conflicts exceeds the benefit of marginal parallelization.

### 2. Document Reasoning

Always explain WHY an issue is independent or dependent:

```
independence:low

Reason: Both issues modify scripts/pm-review.js, specifically the 
generatePMReview function. High likelihood of merge conflicts. 
Recommend implementing sequentially.
```

### 3. Reassess When Context Changes

Independence can change:
- Issue scope expands to touch more files
- Dependency relationship discovered
- Implementation approach changes

**Update labels and notify affected developers.**

### 4. Use Component Labels

Explicitly label component to aid independence assessment:

```bash
gh issue edit 123 --add-label "component:scripts"
gh issue edit 124 --add-label "component:web"
```

### 5. Communicate Coordination Needs

Even independent issues may benefit from coordination:

```markdown
Note: While these issues are independent (different files), 
consider coordinating on the shared GraphQL schema to ensure 
consistency in naming conventions.
```

## See Also

- [Project Manager Mode](./modes/project-manager.md)
- [AI Assistant PM Mode](./modes/ai-assistant-pm.md)
- [Label Validation Guide](./LABEL_VALIDATION_GUIDE.md)
- [Rebalance Lanes Script](../../scripts/rebalance-lanes.js)
- [PM Review Script](../../scripts/pm-review.js)
