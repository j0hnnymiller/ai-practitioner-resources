# PR Workflow - Quick Reference

## The 6-Stage Process

```
1. CREATE PR with implementation
   ↓
2. COPILOT CODE REVIEW (AI - up to 3 rounds)
   ├─ Issues found → Fix → Re-review
   ├─ Max 3 cycles
   └─ Escalate if still issues
   ↓
3. ACCEPTANCE CRITERIA VERIFICATION (Automated)
   ↓
4. CI/CD CHECKS (Automated)
   ↓
5. HUMAN APPROVAL (Maintainer)
   ↓
6. MERGE to main
```

## Stage 2: AI Review Deep Dive

### Round Structure

```
ROUND 1 (Initial)
├─ Review against 8 standards
├─ Issues?
│  ├─ YES → Comment + Implementing model fixes
│  └─ NO → Approval
└─ Advance

ROUND 2 (Re-Review)
├─ Check only changed code
├─ Issues?
│  ├─ YES → Comment + Implementing model fixes
│  └─ NO → Approval
└─ Advance

ROUND 3 (Final AI)
├─ Last AI review
├─ Issues?
│  ├─ YES → Escalate to human
│  └─ NO → Approval
└─ Advance
```

### The 8 Review Dimensions

1. **Architecture & Modularity** - Module fit, boundaries
2. **Code Quality** - Functions, complexity, naming
3. **Testing** - Coverage, patterns, testability
4. **Security** - No secrets, validation, injection
5. **Error Handling** - Try-catch, logging, recovery
6. **Documentation** - JSDoc, comments, README
7. **Performance** - Efficiency, caching, optimization
8. **Project Patterns** - Following established conventions

## Labels Used

### Status (One at a time)

| Label               | Meaning           |
| ------------------- | ----------------- |
| `in-review`         | AI reviewing      |
| `awaiting-approval` | Ready for human   |
| `approved-by-human` | Ready to merge    |
| `changes-requested` | Return to stage 2 |

### Additional

| Label                 | Meaning                 |
| --------------------- | ----------------------- |
| `ai-review-approved`  | AI approved (no issues) |
| `ai-review-escalated` | AI escalated (3 rounds) |

## Comment Templates

### AI Approval (No Issues)

```
## ✅ Code Review - Round 1/1

All code quality checks passed!

- ✅ Architecture: Respected
- ✅ Code Quality: Met
- ✅ Testing: Adequate
- ✅ Security: Safe
- ✅ Error Handling: Complete
- ✅ Documentation: Present
- ✅ Performance: Good
- ✅ Patterns: Followed

Ready for next stage.
```

### AI Found Issues

```
## 🤖 Code Review - Round 1/3

Found 2 issues requiring attention.

### Issue 1: Function Too Large
**File**: `src/path/file.js` line 45
**Severity**: 🟡 Medium
**Problem**: Function is 35 lines (max: 20)
**Fix**: Split into helper functions
**Reference**: .github/instructions/code-review.md § Code Quality

### Issue 2: Missing Error Handling
**File**: `src/path/api.js` line 12
**Severity**: 🔴 Critical
**Problem**: Async function not wrapped in try-catch
**Fix**: Add try-catch block
**Reference**: .github/instructions/code-review.md § Red Flags

---

Please address these and push commits.
I'll review the changes next.
```

### AI Approved After Fixes

```
## ✅ Code Review - Round 2/3 - APPROVED

Issues have been resolved!

- ✅ Issue 1 fixed: Function split
- ✅ Issue 2 fixed: Error handling added

Ready for acceptance criteria verification.
```

### AI Escalating

```
## ⚠️ Code Review - Round 3/3 - ESCALATED

After 3 review cycles, this requires human review.

**Rounds**: 3/3 completed
**Status**: Escalating for human judgment
**Reason**: [Architectural decision / Complex tradeoff / etc.]

A human maintainer will now review and make final decision.
```

### Ready for Human Approval

```
## 👤 Ready for Human Approval

Automated checks completed:

- ✅ AI review: Passed
- ✅ Acceptance criteria: Verified
- ✅ CI/CD: All checks pass
- ✅ Security: No issues

Awaiting human maintainer approval.

@maintainer: Please review when ready.
```

## Decision Trees

### Developer Flow

```
Create PR
  ↓
AI reviews (automatic)
  ├─ Issues found?
  │  ├─ YES → Read comment
  │  │        Fix issue
  │  │        Push commits
  │  │        Go back to top
  │  │
  │  └─ NO → Wait for human review
  ↓
Human reviews
  ├─ Approved?
  │  ├─ YES → PR merges (done!)
  │  └─ NO → Implement feedback
  │         Go back to top
  ↓
DONE
```

### Maintainer Flow

```
PR arrives at stage 5
  ↓
Review code & comments
  ├─ Looks good?
  │  ├─ YES → Continue
  │  └─ NO → Request changes
  │         (returns to stage 2)
  ↓
Approve
  ├─ Click "Approve" button
  ├─ Add label: approved-by-human
  └─ Merge PR
     DONE
```

## Timelines

| Scenario     | AI Time | Human Time | Total   |
| ------------ | ------- | ---------- | ------- |
| No issues    | 5 min   | 4 hrs      | ~4h 5m  |
| 1 fix cycle  | 15 min  | 4 hrs      | ~4h 15m |
| 3 fix cycles | 45 min  | 4 hrs      | ~4h 45m |
| Escalated    | 45 min  | 6 hrs      | ~6h 45m |

## Common Issues & Fixes

| Issue                       | Fix                            |
| --------------------------- | ------------------------------ |
| Function > 30 lines         | Split into smaller functions   |
| No error handling           | Add try-catch block            |
| Hardcoded values            | Move to constants              |
| No tests                    | Add unit tests                 |
| Mixed concerns              | Separate core logic from UI    |
| Global state                | Pass as parameters             |
| No comments                 | Add JSDoc/explanatory comments |
| Security: Hardcoded secrets | Use environment variables      |

## Quick Commands

**For Developers**:

```bash
# Check code before PR
npm run lint
npm run test
npm run validate

# After AI feedback
git add .
git commit -m "fix: Address code review feedback"
git push
```

**For Maintainers**:

```bash
# Check out PR locally
gh pr checkout <number>

# Run checks
npm ci
npm run lint
npm run test

# Review then approve
gh pr review <number> --approve
gh pr merge <number>
```

## Key Resources

**Understand Workflow**:

- Read: `PR_WORKFLOW_GUIDE.md` (full guide)
- Reference: `PR_WORKFLOW_AI_REVIEW.md` (specification)

**Code Quality Standards**:

- `.github/instructions/code-review.md` (70+ guidelines)
- `.github/prompts/code-review.prompt.md` (review prompt)

**Architecture & Patterns**:

- `src/README.md` (module docs)
- `tests/example.test.js` (testing patterns)

## Priority Labels

| Level    | SLA      | Label               |
| -------- | -------- | ------------------- |
| Critical | 2 hours  | `priority-critical` |
| High     | 4 hours  | `priority-high`     |
| Medium   | 24 hours | (none)              |
| Low      | 48 hours | `priority-low`      |

## Escalation Checklist

When a PR is escalated (ai-review-escalated):

- [ ] Read AI review comments (what issues were found)
- [ ] Check implementation attempt (what model tried to fix)
- [ ] Evaluate issue (is it valid?)
- [ ] Make decision:
  - [ ] Approve (acceptable tradeoff)
  - [ ] Request changes (need to fix)
  - [ ] Ask clarification (need more info)

## Success Metrics

Track these over time:

- % PRs approved on first AI review (goal: 80%+)
- Avg time to merge (goal: < 5 hours)
- Escalation rate (goal: < 10%)
- Human reversals (goal: < 2%)
- Post-merge bugs (goal: 0)

---

**Print this page for quick reference during reviews!**

**Last Updated**: November 4, 2025
**Version**: 1.0
