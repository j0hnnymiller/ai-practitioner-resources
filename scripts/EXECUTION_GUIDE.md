# Executing the Issue Lifecycle Test

This document provides instructions for executing the issue lifecycle test automation.

## Overview

The test automation has been implemented in two ways:

1. **Node.js Script** (`scripts/test-issue-lifecycle.js`) - Comprehensive test with detailed reporting
2. **Shell Script** (`scripts/test-issue-lifecycle.sh`) - Simplified test using GitHub CLI
3. **GitHub Actions Workflow** (`.github/workflows/test-issue-lifecycle.yml`) - Automated execution

## Prerequisites

### For Local Execution

#### Node.js Script
```bash
# Set GitHub personal access token
export GITHUB_TOKEN="ghp_your_token_here"

# Token needs these scopes:
# - repo (full control)
# - issues (read/write)
```

#### Shell Script
```bash
# Authenticate GitHub CLI
gh auth login

# Or use a token
gh auth login --with-token < your-token.txt
```

### For GitHub Actions Execution

No additional setup required - the workflow uses the built-in `GITHUB_TOKEN`.

## Execution Methods

### Method 1: Node.js Script (Recommended)

#### Dry Run (Test without creating issues)
```bash
npm run test-lifecycle-dry
```

#### Live Run (Creates real issues)
```bash
npm run test-lifecycle
```

#### Custom Configuration
```bash
# Run without cleanup (keep issues open)
CLEANUP_AFTER=false npm run test-lifecycle

# Run with custom delay
DELAY_MS=5000 npm run test-lifecycle

# Combine options
DRY_RUN=false CLEANUP_AFTER=false DELAY_MS=3000 npm run test-lifecycle
```

### Method 2: Shell Script

```bash
# Run the shell script
./scripts/test-issue-lifecycle.sh

# Or with bash
bash scripts/test-issue-lifecycle.sh
```

Note: The shell script always creates real issues and closes them at the end.

### Method 3: GitHub Actions Workflow

1. Go to the **Actions** tab in the repository
2. Select **Test Issue Lifecycle** workflow
3. Click **Run workflow**
4. Configure options:
   - **dry_run**: Run without creating real issues (default: false)
   - **cleanup**: Close issues after test (default: true)
   - **delay_ms**: Delay between operations in ms (default: 2000)
5. Click **Run workflow**

The workflow will:
- Create test issues
- Simulate all lifecycle states
- Generate a detailed report
- Upload the report as an artifact
- Optionally cleanup test issues

## Expected Output

### Console Output

```
╔════════════════════════════════════════════════════════════╗
║   Issue Lifecycle Complete Test Automation                ║
╚════════════════════════════════════════════════════════════╝

Repository: j0hnnymiller/ai-practitioner-resources
Mode: LIVE (will create real issues)
Cleanup: Enabled (issues will be closed after tests)
Delay: 2000ms between operations

=== Test Scenario 1: Happy Path ===
✓ Created issue #123: [TEST] Bug: Test happy path complete flow
✓ Updated issue #123 labels
✓ Added comment to issue #123
...
✓ Happy path test completed successfully

...

# Issue Lifecycle Test Report

**Date**: 2025-11-05T05:30:00.000Z
**Duration**: 45.23 seconds
**Total Scenarios**: 12
**Passed**: 12 ✓
**Failed**: 0 ✗
```

### Generated Report

A detailed markdown report is saved to:
```
automation-results/issue-lifecycle-test-{timestamp}.md
```

The report includes:
- Test execution metadata
- Detailed results for each scenario
- List of created issues
- Coverage summary
- Pass/fail statistics

### Created Issues

All test issues are labeled with `test-automation` and have titles prefixed with `[TEST]` or `[TEST-{timestamp}]`.

Example issues created:
- `[TEST] Bug: Test happy path complete flow`
- `[TEST] Bug: Minimal information`
- `[TEST] Feature: Something completely out of scope`
- `[TEST] Feature: Test lane progression`
- etc.

## Test Scenarios

The automation tests these scenarios:

1. **Happy Path** - Complete flow from creation to successful merge
2. **Validation Failure** - Validation fails, user provides details, then passes
3. **PM Rejection** - Issue rejected during triage as out of scope
4. **Lane Progression** - Movement through all lanes (bench → hole → deck → bat)
5. **PR Format Failure** - PR validation fails, then corrected
6. **AI Review Rounds** - Multiple rounds of AI review with fixes
7. **Acceptance Criteria Failure** - AC check fails, fixed, then passes
8. **CI/CD Failure** - Tests fail, fixed, then pass
9. **Maintainer Changes** - Human reviewer requests changes
10. **Manual Completion** - Issue closed without PR
11. **Escalation** - AI review escalates to human after 3 rounds
12. **Different Issue Types** - Tests UI/UX, resource, contributor types

## Verification

### Manual Verification Steps

After running the test:

1. **Check Created Issues**
   ```bash
   gh issue list --label test-automation --state all
   ```

2. **View a Test Issue**
   ```bash
   gh issue view <issue-number>
   ```

3. **Check Issue Labels**
   ```bash
   gh issue view <issue-number> --json labels
   ```

4. **Review Test Report**
   ```bash
   cat automation-results/issue-lifecycle-test-*.md | tail -1
   ```

### Expected Results

All test scenarios should:
- ✓ Create issues successfully
- ✓ Update labels correctly
- ✓ Add comments as expected
- ✓ Transition through states properly
- ✓ Close issues with appropriate reasons
- ✓ Generate a complete test report

## Cleanup

### Automatic Cleanup

By default, all test issues are closed automatically after tests complete.

### Manual Cleanup

If cleanup was disabled or failed:

```bash
# List all test issues
gh issue list --label test-automation --state open

# Close individual issue
gh issue close <issue-number>

# Bulk close all test issues (bash)
gh issue list --label test-automation --state open --json number -q '.[].number' | \
  xargs -I {} gh issue close {}

# Bulk close all test issues (PowerShell)
gh issue list --label test-automation --state open --json number | \
  ConvertFrom-Json | ForEach-Object { gh issue close $_.number }
```

### Delete Test Issue Comments (if needed)

GitHub doesn't support bulk deletion of issues, but you can close them with:

```bash
gh issue close <issue-number> --reason "not_planned"
```

## Troubleshooting

### "GITHUB_TOKEN not set"

**Node.js Script**: Export the token before running
```bash
export GITHUB_TOKEN="ghp_your_token_here"
npm run test-lifecycle
```

### "Not authenticated with GitHub CLI"

**Shell Script**: Authenticate first
```bash
gh auth login
./scripts/test-issue-lifecycle.sh
```

### "Permission denied"

Make scripts executable:
```bash
chmod +x scripts/test-issue-lifecycle.js
chmod +x scripts/test-issue-lifecycle.sh
```

### "Rate limit exceeded"

Increase delay between operations:
```bash
DELAY_MS=5000 npm run test-lifecycle
```

Or wait for rate limit reset (typically 1 hour).

### Issues Not Created

1. Verify token has correct permissions (`repo` scope)
2. Check repository name is correct
3. Run in dry-run mode to test logic first
4. Check GitHub API status: https://www.githubstatus.com/

## Advanced Usage

### Custom Test Scenarios

You can modify the test script to add custom scenarios:

1. Edit `scripts/test-issue-lifecycle.js`
2. Add a new test function following the pattern
3. Add it to the `runAllTests()` function
4. Run the modified script

### Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Test Issue Lifecycle
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    npm ci
    npm run test-lifecycle
```

### Scheduled Testing

Add a scheduled workflow:

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
```

## Support

For issues or questions:
1. Check the [test script README](./TEST_LIFECYCLE_README.md)
2. Review the [issue lifecycle diagram](../.github/workflows/ISSUE_LIFECYCLE_STATE_DIAGRAM.md)
3. Open an issue with label `test-automation`

## References

- [Issue Lifecycle State Diagram](../.github/workflows/ISSUE_LIFECYCLE_STATE_DIAGRAM.md)
- [Test Script Documentation](./TEST_LIFECYCLE_README.md)
- [GitHub REST API - Issues](https://docs.github.com/en/rest/issues)
- [GitHub CLI Manual](https://cli.github.com/manual/)
