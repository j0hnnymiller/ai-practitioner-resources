# Issue Lifecycle Test Automation

This script automates comprehensive testing of the entire issue lifecycle as documented in `.github/workflows/ISSUE_LIFECYCLE_STATE_DIAGRAM.md`.

## Overview

The test automation creates real GitHub issues and simulates their progression through all states, transitions, and gates in the issue lifecycle state machine.

## Test Coverage

### Issue Types Tested
- ✓ Bug reports
- ✓ Feature requests
- ✓ UI/UX improvements
- ✓ Questions
- ✓ Resource suggestions
- ✓ Contributor requests

### States Tested
- ✓ Issue Created
- ✓ Auto Validation (pass/fail)
- ✓ Backlog
- ✓ PM Triage (approve/reject)
- ✓ Lane Assignment (on bench, in hole, on deck, at bat)
- ✓ Development phases
- ✓ PR workflow stages
- ✓ Closure states

### Transitions Tested
- ✓ Happy path (complete flow from creation to merge)
- ✓ Validation failure → details needed → retry
- ✓ PM rejection (triage rejected)
- ✓ Lane progression (bench → hole → deck → bat)
- ✓ PR format failure → correction → pass
- ✓ AI review multiple rounds (1-3)
- ✓ Acceptance criteria failure → fix → pass
- ✓ CI/CD failure → fix → pass
- ✓ Maintainer requests changes → update → approval
- ✓ Manual completion (no PR)
- ✓ AI review escalation to human

### Gates Tested
- ✓ Gate 1: Auto Validation
- ✓ Gate 2: PM Triage (Manual)
- ✓ Gate 3: PR Format Check (Stage 1)
- ✓ Gate 4: AI Code Review (Stage 2)
- ✓ Gate 5: Acceptance Criteria (Stage 3)
- ✓ Gate 6: CI/CD Checks (Stage 4)
- ✓ Gate 7: Human Approval (Stage 5)

## Test Scenarios

### 1. Happy Path
Complete flow from issue creation through all gates to successful merge and closure.

### 2. Validation Failure
Tests the validation failure → needs details → user updates → retry flow.

### 3. PM Rejection
Tests triage rejection for out-of-scope issues.

### 4. Lane Progression
Tests movement through all lanes: on bench → in hole → on deck → at bat.

### 5. PR Format Failure
Tests PR format validation failure and correction.

### 6. AI Review Multiple Rounds
Tests AI code review with multiple fix iterations (up to 3 rounds).

### 7. Acceptance Criteria Failure
Tests AC check failure and subsequent fix.

### 8. CI/CD Failure
Tests CI/CD pipeline failure and fix cycle.

### 9. Maintainer Requests Changes
Tests human review feedback loop with change requests.

### 10. Manual Completion
Tests manual issue closure without PR (e.g., documentation, discussion).

### 11. AI Review Escalation
Tests escalation to human maintainer after 3 AI review rounds.

### 12. Different Issue Types
Tests various issue types (UI/UX, resource, contributor) through lifecycle.

## Usage

### Prerequisites

```bash
# Set GitHub token with appropriate permissions
export GITHUB_TOKEN="ghp_your_token_here"

# Token needs these permissions:
# - repo (full control)
# - issues (read/write)
```

### Dry Run (Recommended First)

Test without creating real issues:

```bash
npm run test-lifecycle-dry
```

or

```bash
DRY_RUN=true node scripts/test-issue-lifecycle.js
```

### Live Run

Create real issues and run the full test:

```bash
npm run test-lifecycle
```

or

```bash
node scripts/test-issue-lifecycle.js
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GITHUB_TOKEN` | Required | GitHub personal access token |
| `GITHUB_REPOSITORY` | `j0hnnymiller/ai-practitioner-resources` | Target repository |
| `DRY_RUN` | `false` | Set to `true` to simulate without creating issues |
| `CLEANUP_AFTER` | `true` | Set to `false` to keep test issues open |
| `DELAY_MS` | `2000` | Delay in milliseconds between operations |

### Examples

```bash
# Run in dry-run mode
DRY_RUN=true npm run test-lifecycle

# Run with custom delay
DELAY_MS=5000 npm run test-lifecycle

# Run without cleanup (keep issues open)
CLEANUP_AFTER=false npm run test-lifecycle

# Run against different repository
GITHUB_REPOSITORY="owner/repo" npm run test-lifecycle
```

## Output

The script generates:
1. **Console output** with real-time progress
2. **Test report** saved to `automation-results/issue-lifecycle-test-{timestamp}.md`
3. **Summary statistics** showing passed/failed scenarios

### Sample Output

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

## Report Structure

The generated markdown report includes:

- **Test execution metadata** (date, duration, counts)
- **Detailed scenario results** with steps executed
- **List of issues created** with links
- **Coverage summary** by category
- **Pass/fail statistics**

## Notes

### Issue Labeling

All test issues are labeled with `test-automation` to distinguish them from real issues.

### Cleanup

By default, all created test issues are closed after test completion. Use `CLEANUP_AFTER=false` to inspect issues manually.

### Simulated Actions

The script simulates:
- PR creation and updates (via comments)
- Review feedback (AI and human)
- Gate checks (format, AC, CI/CD)
- State transitions

These are simulated because:
1. Creating real PRs would require branches and code changes
2. AI reviews require actual PR code to review
3. CI/CD requires actual test runs

The simulation focuses on testing the **issue lifecycle state transitions** rather than the actual implementation details of each gate.

### Rate Limiting

The script includes configurable delays (`DELAY_MS`) between API calls to avoid GitHub rate limits. Adjust if needed based on your API quota.

### Error Handling

If a scenario fails:
- The error is captured in the test results
- Subsequent scenarios continue running
- Final exit code reflects overall pass/fail status

## Integration with CI/CD

You can run this as part of CI/CD to validate the issue lifecycle:

```yaml
- name: Test Issue Lifecycle
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    DRY_RUN: 'false'
    CLEANUP_AFTER: 'true'
  run: npm run test-lifecycle
```

## Troubleshooting

### "GITHUB_TOKEN not set"
Ensure you've exported the token: `export GITHUB_TOKEN="ghp_..."`

### "Permission denied"
Token needs `repo` scope with full control

### "Rate limit exceeded"
Increase `DELAY_MS` or wait for rate limit reset

### "Issue creation failed"
Check repository permissions and token validity

## Future Enhancements

Potential additions:
- GraphQL API integration for Projects v2 testing
- Real PR creation and merging (requires branch management)
- Webhook simulation for automated workflows
- Performance benchmarking
- Parallel test execution
- Custom scenario configuration via JSON

## Related Documentation

- [Issue Lifecycle State Diagram](../.github/workflows/ISSUE_LIFECYCLE_STATE_DIAGRAM.md)
- [Project Manager Mode](../.github/prompts/modes/project-manager.md)
- [PR Workflow Guide](../.github/PR_WORKFLOW_GUIDE.md)

## License

Same as parent project.
