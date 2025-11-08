# Expected Workflow Behavior

## Overview

This document describes the complete expected behavior of the automated workflow system when issues are created and closed. Each step includes the triggering event, the file that executes, and the expected outcome.

## When a New Issue is Opened

### Step 1: Workflow Trigger

**File:** `.github/workflows/issue-intake.yml`

**Trigger:** `issues: types: [opened]`

**Environment Variables Set:**
- `GITHUB_REPOSITORY` (automatic)
- `ISSUE_NUMBER` (from event payload)
- `GITHUB_TOKEN` (from secrets)
- `PROJECT_NUMBER=1` (hardcoded)
- `INTAKE_MANAGE_PROJECT=true` (hardcoded)

**Action:** GitHub Actions workflow initiates

---

### Step 2: Issue Intake Processing

**File:** `scripts/issue-intake.js`

**Execution:** Node.js script runs as first job step in workflow

**Process:**
1. Reads event payload from `GITHUB_EVENT_PATH`
2. Extracts issue number from event
3. Fetches full issue details via GitHub REST API
4. Checks `INTAKE_MANAGE_PROJECT` environment variable
5. If `INTAKE_MANAGE_PROJECT=true`:
   - Adds issue to Project #1 (production)
   - Sets project status field to `"on the bench"`
   - Strips any existing lane labels (`"at bat"`, `"on deck"`, `"in the hole"`, `"on the bench"`)
6. **Does NOT** add `needs-approval` label (PM review decides this)

**Expected Result:**
- Issue exists in Project #1
- Issue has status: `"on the bench"`
- No lane labels present
- No approval labels yet

---

### Step 3: PM Review with AI

**File:** `scripts/pm-review.js`

**Execution:** Node.js script runs as second job step in workflow

**Dependencies:**
- Requires `ANTHROPIC_API_KEY` environment variable (if not set, skips AI review)

**Process:**
1. Reads event payload from `GITHUB_EVENT_PATH`
2. Extracts issue number, title, body, labels
3. Calls `generatePMReview()` function:
   - If `ANTHROPIC_API_KEY` is set: Uses Claude AI (via Anthropic API) to evaluate issue against project manager checklist
   - If `ANTHROPIC_API_KEY` is NOT set: Skips AI review, returns placeholder content
4. Posts comment to issue with review results
5. If AI review ran:
   - Calls `applyLabelsFromResult()` to apply AI-determined labels:
     - `needs-approval` (if not ready)
     - `implementation ready` (if ready)
     - Priority score (e.g., `priority:85`)
     - Size label (e.g., `size:small`, `size:medium`, `size:large`)
     - Independence label (e.g., `independent`, `independence:high`)
   - If `result.ready === true` AND issue author is a contributor:
     - Assigns issue to author via `assignIssue()`

**Expected Result (with ANTHROPIC_API_KEY):**
- Comment posted with AI review checklist
- Labels applied based on AI evaluation:
  - Either `needs-approval` OR `implementation ready`
  - Priority score label
  - Size label
  - Independence label (if applicable)
- If ready and author is contributor: issue assigned to author

**Expected Result (without ANTHROPIC_API_KEY):**
- Comment posted with error message explaining missing API key
- Project status set to `"In Review"`
- No labels applied
- No assignment

**Expected Result (on system error):**
- Comment posted with error details
- Project status set to `"In Review"`
- Process exits with error code
- Manual maintainer intervention required

---

## Current State After Issue Creation

**Project Status:** `"on the bench"`
**Project:** Project #1 (Production)
**Labels (if AI ran):**
- One of: `needs-approval` OR `implementation ready`
- Priority: `priority:XX` (score 0-100)
- Size: `size:small|medium|large`
- Independence: `independent` OR `independence:high` (optional)

**Labels (if AI skipped):** None added

**Next Manual Step:** 
- If `needs-approval` label present: maintainer reviews and either adds `implementation ready` or closes issue
- If `implementation ready` label present: issue is eligible for lane promotion

---

## When an Issue is Closed

### Step 1: Workflow Trigger

**File:** `.github/workflows/rebalance-on-close.yml`

**Trigger:** `issues: types: [closed]`

**Environment Variables Set:**
- `GITHUB_REPOSITORY` (automatic)
- `ISSUE_NUMBER` (from event payload)
- `GITHUB_TOKEN` (from secrets)
- `PROJECT_NUMBER=1` (hardcoded)

**Action:** GitHub Actions workflow initiates

---

### Step 2: Lane Rebalancing

**File:** `scripts/rebalance-lanes.js`

**Execution:** Node.js script runs as workflow job step

**Process:**
1. Queries Project #1 for all open issues
2. For each issue:
   - Extracts labels and current status
   - Calculates priority score from labels
   - Determines independence flag
   - Determines size rank (small=0, medium=1, large=2)
3. Filters to only `implementation ready` issues for active pipeline
4. Sorts by:
   - Priority score (descending)
   - Independence (true first)
   - Size (smaller first)
   - Issue number (older first)
5. Assigns to lanes with 3-item caps:
   - Top 3 eligible → `"at bat"`
   - Next 3 eligible → `"on deck"`
   - Next 3 eligible → `"in the hole"`
   - All others → `"on the bench"`
6. Updates Project #1 status field for each issue
7. Strips any legacy lane labels from issues

**Expected Result:**
- All open issues in Project #1 have updated status
- Active pipeline (`"at bat"`, `"on deck"`, `"in the hole"`) contains max 3 issues each
- Only `implementation ready` issues can be in active pipeline
- Issues without `implementation ready` are in `"on the bench"`
- No lane labels present (all removed)

---

## Workflow Limitations (Current State)

### Not Project-Aware

**Issue:** All three scripts (`issue-intake.js`, `pm-review.js`, `rebalance-lanes.js`) currently hardcode `PROJECT_NUMBER=1` and process ALL issues, regardless of which project they're in.

**Impact on Testing:**
- Test issues (Project #3) will trigger the same workflows
- Test issues will be processed by PM review
- Test issues will be included in lane rebalancing
- Cannot isolate test workflow execution from production

**Workaround (Partial):**
- `scripts/create-issue.js` automatically removes test issues from Project #1 and adds to Project #3
- This prevents test issues from appearing in production project view
- However, workflows still execute for test issues

**Future Enhancement Needed:**
- Modify scripts to accept `PROJECT_ID` (not just `PROJECT_NUMBER`)
- Filter all GitHub API queries to only process issues in specific project
- Allow workflows to pass different `PROJECT_ID` for test vs production

---

## Test Issue Behavior

### When Test Issue is Created (using create-issue.js)

**File:** `scripts/create-issue.js`

**Execution:** Manual script execution via `node scripts/create-issue.js`

**Environment Variables Required:**
- `GITHUB_TOKEN` (with repo, project scopes)
- `PROJECT_NUMBER=3` (default, can override)

**Process:**
1. Reads markdown file from `automation-results/test-issues/`
2. Adds `**TI**` prefix to title
3. Creates GitHub issue via REST API
4. Waits 1 second (allows auto-add workflow to complete)
5. Queries all projects issue is assigned to via GraphQL
6. Removes issue from all projects except target project (Project #3)
7. Adds issue to target project if not present
8. Outputs project assignment status

**Expected Result:**
- Test issue created with `**TI**` prefix in title
- Issue appears ONLY in Project #3 (Workflow Testing)
- Issue removed from Project #1 if auto-add workflow added it there

**Note:** The `issue-intake.yml` and `pm-review.yml` workflows will STILL execute because they trigger on `issues: [opened]` event, but the issue won't be visible in Project #1.

---

## Verification Checklist

### For New Issue (Production)
- [ ] Issue exists in Project #1
- [ ] Issue status = `"on the bench"` (normal) OR `"In Review"` (error condition)
- [ ] PM review comment posted (success) OR error message posted (failure)
- [ ] If AI ran: labels applied (`needs-approval` OR `implementation ready`, priority, size, independence)
- [ ] If ready + contributor author: issue assigned to author
- [ ] No lane labels present

### For New Issue (Test)
- [ ] Issue exists ONLY in Project #3
- [ ] Issue title has `**TI**` prefix
- [ ] PM review comment posted (workflow executed)
- [ ] Issue NOT visible in Project #1

### For Closed Issue (Production)
- [ ] All open issues in Project #1 have updated status
- [ ] Max 3 issues in `"at bat"`
- [ ] Max 3 issues in `"on deck"`
- [ ] Max 3 issues in `"in the hole"`
- [ ] Only `implementation ready` issues in active pipeline
- [ ] All other issues in `"on the bench"`
- [ ] No lane labels present on any issue

---

## Known Issues

1. **Auto-Add Workflow (#10)**: GitHub Projects built-in workflow automatically adds ALL new issues to Project #1. This is why `create-issue.js` must remove test issues after creation.

2. **Workflow Not Project-Aware**: Scripts process all issues regardless of project membership. Test issues trigger production workflows.

3. **Async Project Assignment**: GitHub's project assignment happens asynchronously. Scripts must wait ~1 second after issue creation to detect project membership.

4. **GraphQL vs REST**: GitHub Projects V2 requires GraphQL API. REST API cannot query or modify project assignments.

---

## Environment Variables Reference

| Variable | Used By | Purpose | Default/Required |
|----------|---------|---------|------------------|
| `GITHUB_TOKEN` | All scripts | GitHub API authentication | Required (from secrets) |
| `GITHUB_REPOSITORY` | All scripts | Owner/repo identification | Automatic (from context) |
| `ISSUE_NUMBER` | All scripts | Target issue number | From event payload |
| `PROJECT_NUMBER` | All scripts | Target project number | Hardcoded: 1 (prod), 3 (test) |
| `INTAKE_MANAGE_PROJECT` | issue-intake.js | Enable/disable project mgmt | Hardcoded: true |
| `ANTHROPIC_API_KEY` | pm-review.js | Enable AI review | Optional (skips if not set) |
| `GITHUB_EVENT_PATH` | issue-intake.js, pm-review.js | Path to event JSON | Automatic (from workflow) |

---

## File Reference

| File | Purpose | Trigger | Project-Aware? |
|------|---------|---------|----------------|
| `.github/workflows/issue-intake.yml` | Orchestrate intake + review | Issue opened | No |
| `.github/workflows/rebalance-on-close.yml` | Orchestrate rebalancing | Issue closed | No |
| `scripts/issue-intake.js` | Add to project, set status | Workflow step | No (PROJECT_NUMBER=1) |
| `scripts/pm-review.js` | AI evaluation, label assignment | Workflow step | No |
| `scripts/rebalance-lanes.js` | Lane promotion/demotion | Workflow step | No (PROJECT_NUMBER=1) |
| `scripts/create-issue.js` | Manual test issue creation | Manual execution | Yes (PROJECT_NUMBER=3) |
| `scripts/lib/graphql-helpers.js` | GraphQL utilities | Library | N/A |

---

## Next Steps for Full Test Isolation

To achieve complete test isolation, the following changes are needed:

1. **Modify Scripts to Accept PROJECT_ID:**
   - `scripts/issue-intake.js`: Add PROJECT_ID env var, filter by project
   - `scripts/pm-review.js`: Add PROJECT_ID env var, verify issue in project
   - `scripts/rebalance-lanes.js`: Add PROJECT_ID env var, query only project issues

2. **Create Test Workflows:**
   - `.github/workflows/test-issue-intake.yml`: Same as production but PROJECT_NUMBER=3
   - `.github/workflows/test-rebalance.yml`: Same as production but PROJECT_NUMBER=3

3. **Add Project Filtering:**
   - Modify GraphQL queries to filter by project membership
   - Ensure scripts skip issues not in target project

4. **Create Verification Script:**
   - Automated checking of issue state against expected values
   - Replaces manual visual observation
