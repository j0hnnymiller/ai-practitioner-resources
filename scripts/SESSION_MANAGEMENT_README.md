# Session Management System - README

## What This Does

This system automatically captures and restores GitHub Copilot implementation sessions, enabling seamless multi-turn iterations when reviewers request changes on pull requests.

**In One Sentence**: When a Copilot-created PR gets review feedback, the system saves the full context and helps Copilot restore it to continue work without losing any information.

## Why You Need This

GitHub Copilot doesn't persist its context across separate conversations. Without session management:

❌ When a reviewer requests changes, Copilot loses:

- Original issue details
- Why decisions were made
- What files were modified
- How commits connect
- Previous review feedback

✅ With session management:

- Full context automatically saved at PR creation
- Session updated with each review feedback
- Copilot can restore everything when resuming work
- Multi-turn iterations work smoothly
- Complete audit trail of all changes

## How It Works (High Level)

```
1. Issue assigned to Copilot (via PM review)
   ↓
2. Copilot creates PR from copilot/* branch
   ↓
3. [AUTOMATIC] Session captured & stored in .github/sessions/
   ↓
4. Reviewer provides feedback → "Request changes"
   ↓
5. [AUTOMATIC] Session updated with feedback
   ↓
6. Copilot restores session (full context restored)
   ↓
7. Copilot implements changes & pushes updates
   ↓
8. Repeat until approved
```

## Components

### 1. Session Manager Script

**File**: `scripts/session-manager.js`

CLI tool for session operations:

```bash
node scripts/session-manager.js save <issue> <pr>        # Capture session
node scripts/session-manager.js restore <session-id>     # Restore session
node scripts/session-manager.js summary <session-id>     # Get markdown summary
```

### 2. Capture Workflow

**File**: `.github/workflows/capture-copilot-session.yml`

**Trigger**: PR created from `copilot/*` branch
**Action**: Captures complete implementation context at PR creation moment

### 3. Review Changes Workflow

**File**: `.github/workflows/handle-copilot-review-changes.yml`

**Trigger**: PR review with "changes_requested" state
**Action**: Updates session with feedback, alerts Copilot

### 4. Session Storage

**Location**: `.github/sessions/copilot-issue-{N}-pr-{N}.json`

JSON files containing:

- Issue context
- PR details
- Commits and file changes
- Review feedback
- Restoration metadata

### 5. Documentation

- **`.github/COPILOT_SESSION_GUIDE.md`** - Comprehensive guide
- **`.github/SESSION_LIFECYCLE_FLOW.md`** - Visual flow diagrams
- **`scripts/session-quick-reference.js`** - Quick reference commands

## Key Features

✅ **Automatic Capture** - Sessions saved when PR created
✅ **Automatic Updates** - Sessions updated when feedback received
✅ **Full Context** - Issue, PR, commits, files, feedback all included
✅ **Git Persistence** - Sessions committed so they survive environment resets
✅ **Multi-Turn Support** - Accumulates feedback across multiple iterations
✅ **Manual Control** - CLI commands available if automation needs override
✅ **Audit Trail** - Complete history of all changes and feedback
✅ **Easy Restoration** - One command to restore full context

## Quick Start

### For Issue Authors

1. Create detailed issue with clear acceptance criteria
2. Assign to Copilot (via PM review process)
3. Wait for PR creation
4. Review Copilot's work
5. Use "Request changes" for feedback
6. Session management is automatic from there

### For Reviewers

1. Review Copilot PR normally
2. Use "Request changes" for iterations (not "Comment")
3. Provide specific, actionable feedback
4. Session automatically updated
5. Reference session ID if needed

### For Developers (Troubleshooting)

```bash
# List all sessions
ls .github/sessions/

# Restore a session
node scripts/session-manager.js restore copilot-issue-49-pr-123

# Validate a session
cat .github/sessions/copilot-issue-49-pr-123.json | jq .

# Show quick reference
node scripts/session-quick-reference.js
```

## Session Lifecycle Example

```
Issue #49: "Fix double icons in browser tab"
    │
    ├─→ Assigned to Copilot
    │
    ├─→ Copilot creates PR #123 from copilot/issue-49-*
    │   ├─→ [✅ AUTOMATIC] capture-copilot-session.yml runs
    │   └─→ Session saved: .github/sessions/copilot-issue-49-pr-123.json
    │
    ├─→ Reviewer posts: "Also check favicon references"
    │   ├─→ [✅ AUTOMATIC] handle-copilot-review-changes.yml runs
    │   └─→ Session updated with feedback
    │
    ├─→ Copilot sees copilot-review-changes label
    │   ├─→ Restores session: includes original issue + feedback
    │   ├─→ Implements both fixes (emoji + favicon)
    │   └─→ Pushes updates to PR
    │
    ├─→ Reviewer approves ✓
    │
    └─→ PR merged to main
        └─→ Session archived
```

## File Structure

```
.github/
├── workflows/
│   ├── capture-copilot-session.yml           ← Capture on PR creation
│   └── handle-copilot-review-changes.yml     ← Update on review feedback
├── sessions/                                  ← Session storage
│   ├── copilot-issue-49-pr-123.json
│   ├── copilot-issue-50-pr-124.json
│   └── ...
├── COPILOT_SESSION_GUIDE.md                  ← Full documentation
├── SESSION_LIFECYCLE_FLOW.md                 ← Visual flows
└── copilot-instructions.md

scripts/
├── session-manager.js                        ← Session API
├── session-quick-reference.js                ← Quick commands
├── pm-review.js                              ← PM review (uses sessions)
└── issue-intake.js                           ← Issue intake (creates sessions)
```

## Session ID Format

```
Format: copilot-issue-{ISSUE_NUMBER}-pr-{PR_NUMBER}

Examples:
  copilot-issue-49-pr-123     → Issue #49, PR #123
  copilot-issue-50-pr-124     → Issue #50, PR #124

File: .github/sessions/copilot-issue-49-pr-123.json
```

## Troubleshooting

### Issue: Session not captured

1. Check PR branch name starts with `copilot/`
2. Check `capture-copilot-session.yml` is enabled
3. Check workflow run logs
4. Manual fallback: `node scripts/session-manager.js save 49 123`

### Issue: Cannot restore session

1. Verify session ID format
2. Check file exists: `ls .github/sessions/`
3. Validate JSON: `cat .github/sessions/copilot-issue-49-pr-123.json | jq .`

### Issue: Review workflow not running

1. Use "Request changes" (not "Comment")
2. Check workflow is enabled
3. Manual update: re-post review as "Request changes"

## Commands

```bash
# Quick reference
node scripts/session-quick-reference.js

# Capture session
node scripts/session-manager.js save 49 123

# Restore session
node scripts/session-manager.js restore copilot-issue-49-pr-123

# List sessions
ls .github/sessions/

# View session contents
cat .github/sessions/copilot-issue-49-pr-123.json | jq .

# Get session summary for Copilot prompt
node scripts/session-manager.js summary copilot-issue-49-pr-123
```

## Key Points

✓ **Most workflows are automatic** - Just create issues, PRs get feedback normally
✓ **Session ID format** - Always `copilot-issue-{N}-pr-{N}`
✓ **Sessions stored in Git** - Not ephemeral, persist across runs
✓ **Review changes trigger workflow** - Must use "Request changes" state
✓ **Multi-turn iterations supported** - Feedback accumulates across cycles
✓ **Manual commands available** - If automation needs override
✓ **Complete audit trail** - All changes and feedback preserved

## Integration with Project Workflow

This system integrates with:

1. **Issue Intake** (`issue-intake.yml`)

   - Creates GitHub Project entries
   - Sets up labels

2. **PM Review** (`pm-review.js`)

   - Assesses readiness
   - Assigns to contributors
   - Creates assignees

3. **4-Lane Swimlane** (Project management)

   - At Bat, On Deck, In The Hole, On Bench
   - Rebalances on issue close

4. **Copilot Implementation** (multi-turn PR iterations)
   - **← You are here: Session management**
   - Handles review feedback gracefully
   - Enables multi-turn implementation

## Documentation Links

- 📖 **Complete Guide**: `.github/COPILOT_SESSION_GUIDE.md`
- 🔄 **Lifecycle Flow**: `.github/SESSION_LIFECYCLE_FLOW.md`
- ⚡ **Quick Reference**: `scripts/session-quick-reference.js`
- 🔧 **Implementation**: `scripts/session-manager.js`
- ⚙️ **Capture Workflow**: `.github/workflows/capture-copilot-session.yml`
- ⚙️ **Review Workflow**: `.github/workflows/handle-copilot-review-changes.yml`

## Status

✅ **Session Manager** - Complete and tested
✅ **Capture Workflow** - Complete and ready
✅ **Review Workflow** - Complete and ready
✅ **Documentation** - Complete

**Ready for**: Testing on production workflows and multi-turn PR iterations

## Next Steps

1. Test capture workflow on next Copilot PR
2. Test review feedback workflow with "Request changes"
3. Validate multi-turn iteration flow
4. Monitor session storage growth
5. Archive old sessions periodically

---

**Created**: 2025-01-15
**Status**: Production Ready
**Maintained**: AI Practitioner Resources Team
