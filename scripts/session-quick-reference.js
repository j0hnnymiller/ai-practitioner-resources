#!/usr/bin/env node

/**
 * Session Management Quick Reference
 *
 * This file documents the essential commands and workflows for session management.
 * Format: Node.js script with extensive comments for easy reference
 */

/**
 * ╔════════════════════════════════════════════════════════════════════════════════╗
 * ║                      COPILOT SESSION QUICK REFERENCE                           ║
 * ╚════════════════════════════════════════════════════════════════════════════════╝
 */

/**
 * 1. AUTOMATIC WORKFLOWS (No manual action needed)
 * ═════════════════════════════════════════════════════════════════════════════════
 *
 * a) SESSION CAPTURE (When PR is created)
 *    Trigger: PR opened from copilot/* branch
 *    Workflow: .github/workflows/capture-copilot-session.yml
 *    Outcome: Session file created in .github/sessions/
 *             PR comment posted with session ID
 *    Status: ✅ AUTOMATIC - No action required
 *
 * b) REVIEW CHANGES HANDLING (When changes requested)
 *    Trigger: PR review submitted with "changes_requested" state
 *    Workflow: .github/workflows/handle-copilot-review-changes.yml
 *    Outcome: Session updated with review feedback
 *             PR comment posted with restoration info
 *             copilot-review-changes label added
 *    Status: ✅ AUTOMATIC - No action required
 */

/**
 * 2. MANUAL COMMANDS (When needed)
 * ═════════════════════════════════════════════════════════════════════════════════
 */

// CAPTURE SESSION MANUALLY
// When: Automatic capture failed or need to re-capture
// Usage:
//   cd c:\git\ai-practitioner-resources
//   node scripts/session-manager.js save 49 123
// Where:
//   49 = Issue number
//   123 = PR number
// Output:
//   ✅ Session captured to .github/sessions/copilot-issue-49-pr-123.json
const captureSession = `
node scripts/session-manager.js save <ISSUE_NUMBER> <PR_NUMBER>
Example: node scripts/session-manager.js save 49 123
`;

// RESTORE SESSION MANUALLY
// When: Copilot needs to resume work with full context
// Usage:
//   node scripts/session-manager.js restore copilot-issue-49-pr-123
// Output:
//   Complete implementation context loaded
//   Ready for Copilot to continue work
const restoreSession = `
node scripts/session-manager.js restore <SESSION_ID>
Example: node scripts/session-manager.js restore copilot-issue-49-pr-123
`;

// GENERATE SESSION SUMMARY
// When: Need markdown summary for Copilot prompt
// Usage:
//   node scripts/session-manager.js summary copilot-issue-49-pr-123
// Output:
//   Markdown-formatted context summary
const generateSummary = `
node scripts/session-manager.js summary <SESSION_ID>
Example: node scripts/session-manager.js summary copilot-issue-49-pr-123
`;

// UPDATE SESSION
// When: Need to manually update session with new context
// Usage:
//   node scripts/session-manager.js update <SESSION_ID> <JSON_CONTEXT>
// Output:
//   Session updated and re-committed
const updateSession = `
node scripts/session-manager.js update <SESSION_ID> <JSON_CONTEXT>
`;

/**
 * 3. SESSION LOCATIONS
 * ═════════════════════════════════════════════════════════════════════════════════
 */

const sessionLocations = `
Session Files:     .github/sessions/*.json
Session Naming:    copilot-issue-{N}-pr-{N}.json

Examples:
  .github/sessions/copilot-issue-49-pr-123.json
  .github/sessions/copilot-issue-50-pr-124.json

Session Contents:
  {
    sessionId: "copilot-issue-49-pr-123",
    issue: { ...issue context... },
    pr: { ...PR details... },
    implementation: { ...commits and file changes... },
    reviewState: { ...review feedback... }
  }
`;

/**
 * 4. WORKFLOW TRIGGERS
 * ═════════════════════════════════════════════════════════════════════════════════
 */

const workflowTriggers = `
CAPTURE WORKFLOW TRIGGERS:
  ✅ PR created from copilot/* branch
  ✅ GitHub Actions workflow runs
  ✅ Session file auto-created
  ✅ Session committed to branch

REVIEW CHANGES WORKFLOW TRIGGERS:
  ✅ PR review submitted
  ✅ Review state = "changes_requested"
  ✅ Session auto-updated
  ✅ copilot-review-changes label added

Manual Trigger:
  gh workflow run capture-copilot-session.yml -f issue=49 -f pr=123
`;

/**
 * 5. COMMON SCENARIOS
 * ═════════════════════════════════════════════════════════════════════════════════
 */

const scenarios = `
SCENARIO 1: Issue Assigned → PR Created → Session Captured
  1. Issue #49 assigned to copilot
  2. Copilot creates PR from copilot/issue-49-* branch
  3. [AUTOMATIC] capture-copilot-session.yml runs
  4. Session saved: .github/sessions/copilot-issue-49-pr-123.json
  5. PR comment posted with session ID

SCENARIO 2: Reviewer Requests Changes
  1. PR review submitted with "changes_requested"
  2. [AUTOMATIC] handle-copilot-review-changes.yml runs
  3. Session updated with review comments
  4. copilot-review-changes label added
  5. PR comment posted with restoration info

SCENARIO 3: Copilot Addresses Feedback
  1. Copilot sees copilot-review-changes label
  2. Restores session: node scripts/session-manager.js restore copilot-issue-49-pr-123
  3. Loads original context + review feedback
  4. Implements requested changes
  5. Commits and pushes updates
  6. Session auto-updated

SCENARIO 4: Multiple Iterations
  1. First review → changes requested
  2. [AUTOMATIC] Session updated
  3. Copilot restores and updates
  4. Second review → more changes
  5. [AUTOMATIC] Session updated again
  6. Copilot restores (with both sets of feedback) and updates
  7. Continue until approved
`;

/**
 * 6. SESSION ID FORMAT
 * ═════════════════════════════════════════════════════════════════════════════════
 */

const sessionIdFormat = `
Format: copilot-issue-{ISSUE_NUMBER}-pr-{PR_NUMBER}

Examples:
  copilot-issue-49-pr-123     → Issue #49, PR #123
  copilot-issue-50-pr-124     → Issue #50, PR #124
  copilot-issue-123-pr-456    → Issue #123, PR #456

File: .github/sessions/{SESSION_ID}.json
`;

/**
 * 7. TROUBLESHOOTING
 * ═════════════════════════════════════════════════════════════════════════════════
 */

const troubleshooting = `
PROBLEM: Session not captured automatically
  CHECK:
    1. Is PR branch named copilot/* ?
    2. Is .github/workflows/capture-copilot-session.yml enabled?
    3. Do GitHub Actions have permissions?

  FIX:
    1. Check workflow run logs: gh run view <RUN_ID> --log
    2. Manual capture: node scripts/session-manager.js save 49 123
    3. Verify permissions in .github/workflows/capture-copilot-session.yml

PROBLEM: Cannot restore session
  CHECK:
    1. Is session ID correct? (format: copilot-issue-{N}-pr-{N})
    2. Does file exist? .github/sessions/{SESSION_ID}.json
    3. Is JSON valid?

  FIX:
    1. List sessions: ls .github/sessions/
    2. Validate JSON: cat .github/sessions/{SESSION_ID}.json | jq .
    3. Re-capture if corrupted: node scripts/session-manager.js save 49 123

PROBLEM: Review changes workflow not running
  CHECK:
    1. Did you use "Request changes" (not "Comment")?
    2. Is .github/workflows/handle-copilot-review-changes.yml enabled?
    3. Are workflow permissions correct?

  FIX:
    1. Manual update: Re-post review as "Request changes"
    2. Manual session update: node scripts/session-manager.js update ...
`;

/**
 * 8. FILE LOCATIONS REFERENCE
 * ═════════════════════════════════════════════════════════════════════════════════
 */

const fileLocations = `
CORE FILES:
  scripts/session-manager.js              → Session management API
  .github/sessions/*.json                 → Captured sessions

WORKFLOWS:
  .github/workflows/capture-copilot-session.yml
                                          → Auto-capture on PR creation
  .github/workflows/handle-copilot-review-changes.yml
                                          → Auto-update on review feedback

DOCUMENTATION:
  .github/COPILOT_SESSION_GUIDE.md        → Complete guide (you are here)
  .github/copilot-instructions.md         → Project AI instructions
  .github/prompts/pm-review.md            → PM review criteria

RELATED:
  scripts/pm-review.js                    → PM review automation
  .github/workflows/issue-intake.yml      → Issue intake automation
  .github/workflows/capture-copilot-session.yml
                                          → Session capture automation
`;

/**
 * 9. QUICK START: NEW SESSION
 * ═════════════════════════════════════════════════════════════════════════════════
 */

const quickStart = `
STEPS:

1. ISSUE CREATED
   → GitHub issue #49 created

2. PR CREATED FROM COPILOT BRANCH
   → PR #123 created from copilot/issue-49-*
   → [AUTOMATIC] capture-copilot-session.yml runs

3. SESSION CAPTURED
   ✅ .github/sessions/copilot-issue-49-pr-123.json created
   ✅ PR comment posted with session ID

4. REVIEW FEEDBACK RECEIVED
   → Reviewer posts "Request changes" review
   → [AUTOMATIC] handle-copilot-review-changes.yml runs

5. SESSION UPDATED
   ✅ Review feedback added to session
   ✅ copilot-review-changes label added
   ✅ PR comment with restoration instructions posted

6. COPILOT RESUMES WORK
   → Copilot restores session:
     node scripts/session-manager.js restore copilot-issue-49-pr-123
   → Full context loaded
   → Implements requested changes

7. ITERATION COMPLETE
   ✅ Changes pushed to PR
   ✅ Session auto-updated
   ✅ Review → Iterate cycle repeats as needed
`;

/**
 * 10. KEY POINTS TO REMEMBER
 * ═════════════════════════════════════════════════════════════════════════════════
 */

const keyPoints = `
✓ Sessions are AUTOMATIC - No manual action needed for normal flow
✓ Sessions stored in .github/sessions/ (committed to git)
✓ Session ID format: copilot-issue-{N}-pr-{N}
✓ Sessions contain: issue context, PR details, commits, file changes
✓ Multi-turn iterations supported: feedback → restore → implement → repeat
✓ All workflows require proper GitHub token permissions
✓ Sessions survive across multiple workflow runs
✓ Review changes workflow only triggers on "changes_requested" state
✓ Manual commands available if automation fails
✓ Sessions can be archived after PR merge
`;

/**
 * QUICK REFERENCE COMMANDS
 */
const commands = {
  capture: `node scripts/session-manager.js save <ISSUE> <PR>`,
  updateSession: `node scripts/session-manager.js update <ISSUE> <PR>`,
  restore: `node scripts/session-manager.js restore <SESSION_ID>`,
  listSessions: `ls .github/sessions/`,
  validateSession: `cat .github/sessions/<SESSION_ID>.json | jq .`,
};

console.log(`
╔════════════════════════════════════════════════════════════════════════════════╗
║         COPILOT SESSION MANAGEMENT - QUICK REFERENCE CARD                      ║
║                                                                                ║
║ Most workflows are AUTOMATIC. Manual commands below for troubleshooting.       ║
╚════════════════════════════════════════════════════════════════════════════════╝

${Object.entries(commands)
  .map(([name, cmd]) => `${name.padEnd(15)} : ${cmd}`)
  .join("\n")}

📖 For complete documentation, see: .github/COPILOT_SESSION_GUIDE.md
🔧 For implementation details, see: scripts/session-manager.js
🚀 For workflows, see: .github/workflows/capture-copilot-session.yml
              and: .github/workflows/handle-copilot-review-changes.yml
`);
