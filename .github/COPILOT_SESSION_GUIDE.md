# Copilot Session Management Guide

## Overview

This guide explains how GitHub Copilot sessions are captured, stored, and restored to enable seamless multi-turn implementation workflows with PR review iterations.

## Session Lifecycle

```
Issue Created
    ↓
Issue Assigned to Copilot (via PM Review)
    ↓
Copilot Creates Branch & PR
    ↓
[CAPTURE] Session saved at PR creation
    ↓
PR Open for Review
    ↓
Reviewer Requests Changes
    ↓
[RESTORE] Session loaded with context
    ↓
Copilot Implements Changes
    ↓
PR Updated & Resubmitted
    ↓
Repeat or Merge
```

## Session Capture

### Trigger: `capture-copilot-session.yml`

**When**: Automatically triggered when:

- A PR is created from a `copilot/*` branch (initial capture)
- New commits are pushed to the PR (session update)

**What Gets Captured**:

```json
{
  "sessionId": "copilot-issue-49-pr-123",
  "timestamp": "2025-01-15T10:30:00Z",
  "issue": {
    "number": 49,
    "title": "Bug: Double icons in browser title bar",
    "author": "j0hnnymiller",
    "body": "Full issue description...",
    "labels": ["bug", "implementation-ready"],
    "url": "https://github.com/owner/repo/issues/49"
  },
  "pr": {
    "number": 123,
    "title": "[Implementation #49] Bug: Double icons...",
    "branch": "copilot/issue-49-double-icons",
    "author": "github-actions[bot]",
    "url": "https://github.com/owner/repo/pull/123"
  },
  "implementation": {
    "commits": [
      {
        "hash": "abc123",
        "message": "fix: remove duplicate emoji",
        "files": ["index.html"]
      }
    ],
    "filesChanged": ["index.html"],
    "files": {
      "index.html": {
        "before": "...",
        "after": "...",
        "diff": "..."
      }
    }
  },
  "restorationContext": {
    "branch": "copilot/issue-49-double-icons",
    "baseBranch": "main",
    "headSha": "abc123...",
    "baseSha": "def456..."
  },
  "reviewState": {
    "changesRequested": false,
    "reviewComments": [],
    "approvalStatus": "pending"
  }
}
```

### How Session Capture Works

1. **Workflow Triggered**: PR opened from `copilot/*` branch
   - Or PR updated with new commits (synchronize event)
2. **Issue Extraction**: Extract issue number from PR body or branch name
3. **Context Collection**: Gather issue, PR, commits, and file changes
4. **Session Creation/Update**:
   - First time: `session-manager.js save` creates new session
   - PR updated: `session-manager.js update` refreshes commits and files
5. **File Persistence**: Session saved to `.github/sessions/copilot-issue-{N}-pr-{N}.json`
6. **Git Commit**: Session file committed to branch for durability
7. **PR Comment**: Comment posted with session ID for reference

## Session Storage

Sessions are stored in `.github/sessions/` directory as JSON files:

```
.github/sessions/
├── copilot-issue-49-pr-123.json     # Session for issue #49, PR #123
├── copilot-issue-50-pr-124.json     # Session for issue #50, PR #124
└── ...
```

**Why Committed to Git**:

- Sessions survive GitHub Actions environment restarts
- Available across multiple workflow runs
- Enables local restoration if needed
- Provides implementation audit trail

## Review-Driven Restoration

### Trigger: `handle-copilot-review-changes.yml`

**When**: Automatically triggered when reviewer submits "changes requested" review

**What Happens**:

1. **Session Detection**

   - Searches PR comments for session ID
   - Falls back to branch name pattern if needed

2. **Review Comment Posted**

   - Summarizes feedback from reviewer
   - Shows session ID for reference
   - Provides restoration command

3. **Session Update**

   - Adds review feedback to session file
   - Records reviewer username and timestamp
   - Updates session `reviewState.changesRequested` flag

4. **Copilot Alert**
   - Adds `copilot-review-changes` label to PR
   - Signals that Copilot attention is needed

### Session Restoration Command

```bash
node scripts/session-manager.js restore copilot-issue-49-pr-123
```

**What Gets Restored**:

- Complete issue context
- Original problem statement
- Current branch state (for context)
- File changes already made
- Review feedback received
- Implementation history

## Session Manager API

The `scripts/session-manager.js` script provides a CLI interface:

### Save Session

```bash
node scripts/session-manager.js save <issue-number> <pr-number>
```

**Purpose**: Create a new session when PR is first opened
**Returns**: Saves session JSON and outputs summary

### Update Session (PR with new commits)

```bash
node scripts/session-manager.js update <issue-number> <pr-number>
```

**Purpose**: Refresh existing session with new commits and file changes
**When Used**: Called automatically when new commits pushed to PR
**Returns**: Loads existing session, updates commits/files, re-saves

### Restore Session

```bash
node scripts/session-manager.js restore <session-id>
```

**Purpose**: Load saved session for Copilot context restoration
**Returns**: Loads session JSON and outputs full context

## Workflow Permissions

Both workflows require specific GitHub token scopes:

```yaml
permissions:
  pull-requests: write # Post comments, create labels
  issues: write # Update issue status
  contents: write # Commit session files
```

## Integration with Issue Workflow

### Flow Diagram

```
Issue #49 Created
    ↓ [issue-intake.yml]
Issue Labeled & Assigned for PM Review
    ↓ [captured automatically]
PM Review Assessment Posted
    ↓
Issue Labeled "implementation-ready"
    ↓
Issue Assigned to Copilot (if contributor)
    ↓ [wait for PR]
PR #123 Created from copilot/issue-49-*
    ↓ [capture-copilot-session.yml]
Session Captured to .github/sessions/
    ↓ [wait for review]
Reviewer Requests Changes
    ↓ [handle-copilot-review-changes.yml]
Session Updated with Feedback
    ↓ [copilot-review-changes label]
Copilot Sees Feedback & Label
    ↓ [restore session]
Copilot Implements Changes
    ↓
PR Updated
    ↓
Repeat: Review → Changes → Update
```

## Best Practices

### For Issue Authors

1. Create clear, actionable issue descriptions
2. Use labels consistently
3. Request specific changes in reviews (not vague feedback)

### For Reviewers

1. Use "Request changes" for iterations (not "Approve")
2. Provide specific, actionable feedback
3. Reference the session ID when needed for context

### For Copilot Implementation

1. Always restore session before responding to changes
2. Reference original issue context in commit messages
3. Keep changes focused on requested modifications
4. Request clarification if feedback is ambiguous

### For Maintainers

1. Review session storage periodically (sessions accumulate)
2. Archive old sessions after PR merge
3. Monitor workflow performance
4. Keep token scopes minimal and rotate regularly

## Troubleshooting

### Session Not Captured

**Check**:

1. PR branch name starts with `copilot/`
2. GitHub Actions has proper permissions
3. `capture-copilot-session.yml` workflow is enabled
4. Check workflow run logs for errors

**Solution**:

```bash
# Manually trigger capture
node scripts/session-manager.js save <issue> <pr>
```

### Session Not Found on Restore

**Check**:

1. Session ID is correct (format: `copilot-issue-{N}-pr-{N}`)
2. Session file exists in `.github/sessions/`
3. Session file is valid JSON

**Solution**:

```bash
# List all sessions
ls .github/sessions/

# Verify session file
cat .github/sessions/copilot-issue-49-pr-123.json | jq .
```

### Workflow Permissions Error

**Check**:

1. GitHub token has `contents`, `issues`, and `pull-requests` scopes
2. `permissions:` block is set correctly in workflow
3. Token isn't expired or revoked

**Solution**:

1. Regenerate GitHub token with correct scopes
2. Update `GITHUB_TOKEN` in GitHub Secrets
3. Re-run workflow

## Performance Considerations

### Session Size

- Average session: 15-50 KB
- Large implementation: up to 200 KB
- Monitor `.github/sessions/` directory size

### Workflow Runtime

- Session capture: ~10-15 seconds
- Session restoration: ~5 seconds
- Typical per-review-cycle overhead: ~20 seconds

### Storage Limits

- GitHub repo size included in GitHub Pages quota
- Recommend archiving sessions older than 30 days
- Create maintenance script if sessions accumulate

## Security Considerations

### Session File Access

- Sessions stored in private repo (.github/ folder)
- Committed to branch only (not pushed to main)
- Contains full implementation details

### Sensitive Information

- Never include secrets in session files
- Review files generated by Copilot for exposed keys
- Use GitHub Secrets for sensitive data

### Token Scope

- Keep token scopes minimal
- Use `GITHUB_TOKEN` auto-token when possible
- Rotate tokens regularly

## Example: Complete Multi-Turn Implementation

### Scenario: Issue #49 - Double Icons Bug

**Step 1: Issue Created & PM Review**

```
Issue #49: Bug - Double icons in browser title bar
Labels: bug, size:small, priority:65
Assigned to: j0hnnymiller (contributor)
Status: implementation-ready
```

**Step 2: Copilot Creates PR**

```
PR #123: [Implementation #49] Bug: Double icons...
Branch: copilot/issue-49-double-icons
```

**Step 3: Session Captured**

```
Session ID: copilot-issue-49-pr-123
File: .github/sessions/copilot-issue-49-pr-123.json
Comment Posted: "Session saved with ID: copilot-issue-49-pr-123"
```

**Step 4: Reviewer Requests Changes**

```
Review Comment: "Please also check the favicon references"
State: changes_requested
```

**Step 5: Session Updated & Alert Posted**

```
Session Updated: reviewState.changesRequested = true
Label Added: copilot-review-changes
Comment Posted: "Changes requested - session ready for restoration"
```

**Step 6: Copilot Restores & Updates**

```
Command: node scripts/session-manager.js restore copilot-issue-49-pr-123
Context Loaded: Original issue + favicon references + previous changes
Implementation: Add favicon fix to existing changes
```

**Step 7: PR Updated**

```
Commit: "fix: remove duplicate emoji AND update favicon references"
Files: index.html (updated)
Session: Re-saved with new commits
```

**Step 8: Approved & Merged**

```
Review State: approved
PR Merged to main
Session: Archived or retained for reference
```

## Session Lifecycle Diagram

```
Time ──────────────────────────────────────────────────────────────>

Issue #49 Created
│
├─→ [PM Review] Labeled "implementation-ready"
│
├─→ PR #123 Created from copilot/ branch
│   │
│   ├─→ [capture-copilot-session.yml] ✅ Session Captured
│   │   └─ copilot-issue-49-pr-123.json created
│   │
│   ├─→ Review Posted
│   │
│   └─→ Changes Requested
│       │
│       ├─→ [handle-copilot-review-changes.yml] ✅ Session Updated
│       │   └─ reviewState.changesRequested = true
│       │   └─ copilot-review-changes label added
│       │
│       ├─→ Copilot Restores Session
│       │   └─ Loads implementation context
│       │
│       ├─→ Copilot Implements Changes
│       │   └─ Addresses review feedback
│       │
│       └─→ PR Updated
│           └─ Session Re-saved
│
└─→ PR Approved & Merged
    └─ Session Archived
```

## See Also

- `.github/workflows/capture-copilot-session.yml` - Session capture automation
- `.github/workflows/handle-copilot-review-changes.yml` - Review feedback automation
- `scripts/session-manager.js` - Session management API
- `.github/prompts/pm-review.md` - PM review criteria and assessment

---

**Last Updated**: 2025-01-15
**Maintained By**: AI Practitioner Resources Team
**Status**: Active / Production Ready
