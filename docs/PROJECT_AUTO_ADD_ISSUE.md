# Project Auto-Add Issue

## Problem

When creating test issues with `scripts/create-issue.js`, issues are automatically added to **both** the test project (Project #3) and the production project (Project #1), even though the script only explicitly adds them to the test project.

This defeats the purpose of having an isolated test environment.

## Root Cause

The production project "AI Practitioner Resources" (Project #1) has a built-in GitHub Projects automation workflow called **"Auto-add to project"** (Workflow #10) that is **enabled**.

### Evidence

```json
{
  "id": "PWF_lAHOCkVgYc4BHOekzgPMU08",
  "name": "Auto-add to project",
  "enabled": true,
  "number": 10
}
```

This workflow automatically adds new issues from the `ai-practitioner-resources` repository to the production project based on some criteria (likely all issues, or issues matching certain labels).

## Project Workflows Found

The production project has these automation workflows:

| Workflow Name                  | Number | Status      | Description                                        |
| ------------------------------ | ------ | ----------- | -------------------------------------------------- |
| Auto-add to project            | 10     | ✅ Enabled  | **Causes the problem** - automatically adds issues |
| Auto-archive items             | 11     | ✅ Enabled  | Archives items automatically                       |
| Auto-close issue               | 7      | ✅ Enabled  | Closes issues automatically                        |
| Code changes requested         | 12     | ✅ Enabled  | Handles code change requests                       |
| Item added to project          | 9      | ✅ Enabled  | Triggers when items are added                      |
| Item closed                    | 5      | ✅ Enabled  | Triggers when items are closed                     |
| Item reopened                  | 13     | ✅ Enabled  | Triggers when items are reopened                   |
| Pull request merged            | 6      | ✅ Enabled  | Triggers on PR merge                               |
| Auto-add sub-issues to project | 8      | ❌ Disabled | Would add sub-issues                               |

## Solutions

### Option 1: Disable the Auto-Add Workflow (Recommended for Testing)

**Pros:**

- Simplest solution
- No code changes needed
- Test issues won't be added to production project

**Cons:**

- Affects production workflow - new production issues won't auto-add
- Need to remember to re-enable after testing

**How to do it:**

1. Go to https://github.com/users/j0hnnymiller/projects/1
2. Click the three dots menu (⋯) → Settings
3. Navigate to Workflows
4. Find "Auto-add to project" (Workflow #10)
5. Toggle it to disabled

### Option 2: Modify Auto-Add Workflow Filter (Recommended for Production)

**Pros:**

- Preserves production functionality
- Surgical fix - excludes only test issues
- No code changes needed

**Cons:**

- Requires understanding of GitHub Projects workflow filters
- May not be possible depending on available filter options

**How to do it:**

1. Go to project settings → Workflows → "Auto-add to project"
2. Add a filter to **exclude** issues with label `workflow-test`
3. This way test issues are never auto-added to production

**Filter logic (if supported):**

```
Add to project when:
  Issue is opened
  AND label is NOT "workflow-test"
```

### Option 3: Continue Using remove-from-production.js Script (Current Workaround)

**Pros:**

- No changes to GitHub settings
- Automated via script
- Works reliably

**Cons:**

- Extra step after every issue creation
- Issue briefly appears in production project
- More API calls needed

**Current usage:**

```bash
node scripts/remove-from-production.js <issue-number>
```

### Option 4: Create Issues Without Repository (Advanced)

**Pros:**

- True isolation from the start

**Cons:**

- Complex - requires creating issues in a different repo or org
- Not practical for testing workflow that depends on the repo

## Recommended Approach

**For immediate testing:** Use Option 3 (current workaround with `remove-from-production.js`)

**For long-term solution:** Use Option 2 (modify workflow filter to exclude `workflow-test` label)

This preserves production functionality while ensuring test issues are never auto-added to the production project.

## Implementation Status

- ✅ Identified root cause (Auto-add to project workflow #10)
- ✅ Created workaround script (`scripts/remove-from-production.js`)
- ⏳ Pending: Modify workflow filter to exclude test issues
- ⏳ Pending: Test workflow automation in isolated environment

## Related Files

- `scripts/create-issue.js` - Creates issues and adds to test project
- `scripts/remove-from-production.js` - Removes issues from production project
- `scripts/lib/graphql-helpers.js` - GraphQL utilities for project operations

## References

- Production Project: https://github.com/users/j0hnnymiller/projects/1
- Test Project: https://github.com/users/j0hnnymiller/projects/3
- GitHub Projects Workflows Documentation: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations
