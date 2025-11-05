---
description: Guide for understanding and using the AI-assisted multi-model PR review workflow
applyTo: "**"
---

# AI-Assisted Multi-Model PR Review Workflow Guide

## Executive Summary

This guide explains the enhanced pull request workflow that uses **Copilot AI code review** as an automated quality gate before human approval. The system combines two different AI models (implementing vs. reviewing) to catch issues early while reducing review burden on humans.

### Key Innovations

1. **Multi-Model Review** - Different AI personas for implementation and review (prevents echo-chamber)
2. **Automated Iteration** - AI fixes issues, reviews its own fixes, up to 3 cycles
3. **Smart Escalation** - Complex issues escalated to humans after 3 cycles
4. **Complete Transparency** - All reviews documented as PR comments
5. **Human Approval Gate** - Final decision always with a human maintainer

---

## Workflow Overview

### The Seven-Stage Process

```
Stage 1: PR Creation
  ↓
Stage 2: AI Code Review (Copilot - Multi-Round)
  ├─ Round 1: Issues found? → Fix & recheck
  ├─ Round 2: More issues? → Fix & recheck
  ├─ Round 3: Still issues? → Escalate to human
  └─ All clear? → Continue
  ↓
Stage 3: Acceptance Criteria Verification
  ↓
Stage 4: CI/CD Checks
  ↓
Stage 5: Human Approval Gate
  ↓
Stage 6: Merge to Main
```

---

## Stage-by-Stage Breakdown

### Stage 1: Pull Request Creation

**Who**: Developer or Copilot coding agent
**What**: Submit code implementation for review
**Requirements**:

- PR title: `[Category]: Description`
- PR description: References issue with "Closes #123"
- Branch: Meaningful name (`feature/x` or `fix/x`)
- Commits: Descriptive messages

**Example PR Title**: `feature: Add dark mode toggle to filter panel`

**Outcome**: PR created and triggers automated workflow

---

### Stage 2: AI Code Review - Multi-Round Process

**Who**: Copilot (Code Reviewer Model)
**Duration**: 2-10 minutes (depends on issues)
**Key Feature**: Uses different model than implementation for unbiased review

#### How It Works

```
ROUND 1 (Initial Review)
├─ Analyze code against 8 dimensions
│  ├─ Architecture & modularity
│  ├─ Code quality
│  ├─ Testing
│  ├─ Security
│  ├─ Error handling
│  ├─ Documentation
│  ├─ Performance
│  └─ Patterns
├─ Issues found?
│  ├─ YES → Post comment with issues
│  │         ↓
│  │      IMPLEMENTING MODEL FIXES
│  │         ↓
│  │      Continue to Round 2
│  │
│  └─ NO → Post approval
│          Advanced to Stage 3

ROUND 2 (Re-Review After Fixes)
├─ Review only changed code
├─ Verify fixes address Round 1 issues
├─ Check for new issues
├─ Issues found?
│  ├─ YES → Post comment with remaining issues
│  │         ↓
│  │      IMPLEMENTING MODEL FIXES
│  │         ↓
│  │      Continue to Round 3
│  │
│  └─ NO → Post approval
│          Advanced to Stage 3

ROUND 3 (Final AI Review)
├─ This is the last AI review cycle
├─ Issues found?
│  ├─ YES → Post comment: "Escalating to human"
│  │         Add label: ai-review-escalated
│  │         Continue to Stage 3 (flagged)
│  │
│  └─ NO → Post approval
│          Continue to Stage 3
```

#### Review Comment Format

Each review round generates a PR comment with:

```markdown
## 🤖 Code Review - Round 1/3

### Issues Found (if any)

#### Issue 1: [Category]

**File**: `src/path/file.js` (line 45)
**Severity**: 🔴 Critical

**Problem**:
Description of what's wrong

**Remediation**:
Specific steps to fix it

---

### Summary

- **Total Issues**: 2
- **Critical**: 1
- **Medium**: 1
- **Action Required**: Fix issues and push commits
```

#### Key Rules

1. **Maximum 3 Rounds**: After 3 reviews, must escalate to human
2. **Must Show Progress**: Each round should resolve at least some issues
3. **Different Models**: Review model ≠ Implementation model
4. **All Comments Recorded**: Each review documented as PR comment

---

### Stage 3: Acceptance Criteria Verification

**Who**: Automated tests
**What**: Verify implementation meets issue requirements
**Checks**:

- Feature works as specified
- Edge cases handled
- Error conditions managed
- Data validation present
- API integration correct

**Outcome**: ✅ Pass → Continue | ❌ Fail → Return to Stage 2

---

### Stage 4: CI/CD Checks

**Who**: GitHub Actions
**What**: Run automated validation suite
**Checks**:

- ✅ Linting (code style)
- ✅ Type checking
- ✅ Unit tests
- ✅ Integration tests
- ✅ Security scan (CodeQL)
- ✅ Schema validation
- ✅ Build verification

**Outcome**: ✅ All pass → Stage 5 | ❌ Any fail → Notify & stop

---

### Stage 5: Human Approval Gate

**Who**: Human maintainer
**What**: Final review and approval decision
**Duration**: Target 4-6 hours (SLA varies by priority)

#### Assignment Logic

```
IF ai-review-approved AND all checks pass:
  → Assign to: Regular maintainer on rotation
  → Label: awaiting-approval
  → Priority: Standard

IF ai-review-escalated:
  → Assign to: Lead maintainer
  → Label: needs-maintainer-review
  → Priority: High (12-hour SLA)
```

#### Human Review Evaluation

The human reviewer assesses:

1. **AI Review Quality**

   - Did AI identify all issues?
   - Were fixes appropriate?
   - Is code production-ready?

2. **Escalated Issues** (if present)

   - Why did AI escalate?
   - Is this a legitimate concern?
   - Should we address before merge?
   - Or acceptable for project?

3. **Context Review**

   - Does implementation match issue?
   - Are architectural decisions sound?
   - Does it fit project direction?

4. **Final Decision**
   - ✅ Approve & merge
   - ❌ Request changes (→ back to Stage 2)
   - 🤔 Need clarification (→ discussion)

#### Human Decision Outcomes

```
APPROVE
  ↓
Post comment: "Approved. Ready to merge."
Add label: approved-by-human
Advance to Stage 6

REQUEST CHANGES
  ↓
Post comment: Specific feedback
Remove: awaiting-approval
Return to: Stage 2 (new review cycle)

REQUEST CLARIFICATION
  ↓
Post comment: Questions/discussion
Wait for response
Continue discussion
```

---

### Stage 6: Merge to Main

**Who**: Human who approved (or automated merge bot)
**What**: Merge PR to main branch

**Pre-Merge Verification**:

- ✅ All checks still passing
- ✅ No conflicts with main
- ✅ All conversations resolved
- ✅ Human approval fresh (< 24 hours)

**Merge Process**:

1. Squash commits (optional)
2. Merge to main
3. Delete feature branch
4. Issue closes automatically

---

## Practical Examples

### Example 1: Smooth Flow (No Issues)

```
Step 1: PR created
Step 2: AI Round 1 → "All checks passed ✅"
Step 3: Acceptance criteria verified
Step 4: CI/CD checks pass
Step 5: Human reviewer approves
Step 6: Merged

Timeline: ~30 minutes (automated) + 4 hours (human review)
Labels: awaiting-approval → approved-by-human
```

### Example 2: One Fix Cycle (1 Issue)

```
Step 1: PR created
Step 2: AI Round 1 → "Found 1 issue: function > 30 lines"
  ↓ Implementing model fixes issue
Step 2: AI Round 2 → "Issue resolved ✅"
Step 3-6: [Same as Example 1]

Timeline: ~45 minutes (automated) + 4 hours (human review)
Labels: ai-review-approved → approved-by-human
```

### Example 3: Multiple Fix Cycles (Escalation)

```
Step 1: PR created
Step 2: AI Round 1 → "Found 3 issues"
  ↓ Implementing model fixes
Step 2: AI Round 2 → "2 fixed, 1 remains"
  ↓ Implementing model fixes
Step 2: AI Round 3 → "Issue remains. Escalating ⚠️"
Step 3-4: Acceptance criteria & CI checks pass
Step 5: Human reviewer evaluates
  → "Issue is acceptable, approving"
  → ✅ Approve
Step 6: Merged

Timeline: ~1 hour (3 AI cycles) + 6 hours (human review)
Labels: ai-review-escalated → approved-by-human
```

### Example 4: Human Requests Changes

```
Step 1-5: PR goes through all stages
Step 5: Human reviewer → "Request changes"
  ↓ Comment: "This approach doesn't fit our architecture"
  → Remove awaiting-approval label
  → Return to implementation
  ↓
New commits pushed
  ↓
Step 2: AI Round 1 (new cycle) → Reviews new changes
  ↓
Continue through stages again

Timeline: +2-4 hours for new cycle + human review
```

---

## For Developers

### What to Expect

1. **Create PR**: Push code and create PR
2. **AI Reviews Automatically**: Don't need to do anything
3. **Monitor Comments**: AI posts review comments
   - If issues: Implement fixes, push commits
   - If approval: Wait for human review
4. **Human Approves**: Maintainer reviews and approves
5. **Merged**: PR merged to main

### When AI Finds Issues

```
1. Read AI review comment carefully
2. Understand each issue (click line numbers if provided)
3. Implement the suggested fixes
4. Push commits to your branch
5. AI automatically re-reviews
6. Repeat until approval
```

### Tips for Smooth Reviews

- ✅ Write clear commit messages
- ✅ Keep PRs focused (one feature per PR)
- ✅ Test locally before pushing
- ✅ Add comments in complex code
- ✅ Reference issues in PR description
- ✅ Respond quickly to AI/human feedback

---

## For Maintainers (Human Reviewers)

### Your Role

You're the **final quality gate**. AI handled 90% of review work; you verify correctness.

### What to Check

1. **AI Review Quality**

   - Did AI catch all obvious issues?
   - Were suggested fixes good?

2. **Architectural Fit**

   - Does this follow project patterns?
   - Will this cause future problems?

3. **Issue Alignment**

   - Does implementation match issue?
   - All acceptance criteria met?

4. **Escalated Issues**
   - If AI escalated: Why?
   - Is it a showstopper?
   - Or acceptable tradeoff?

### Decision Guide

| Scenario                       | Decision           | Action                             |
| ------------------------------ | ------------------ | ---------------------------------- |
| AI approved, code looks good   | ✅ Approve         | Merge                              |
| AI approved, but you see issue | ❌ Request changes | Comment, don't merge               |
| AI escalated, issue is valid   | ❌ Request changes | Ask for fix                        |
| AI escalated, but acceptable   | ✅ Approve         | Explain decision in comment, merge |
| Unclear or needs discussion    | 🤔 Ask question    | Comment with questions             |

### Approval Decision Tree

```
Does code look good?
├─ NO
│  ├─ Is it a showstopper?
│  │  ├─ YES → Request changes
│  │  └─ NO → Ask clarification
│  └─ Return to stage 2
│
└─ YES
   ├─ Does it fit architecture?
   │  ├─ NO → Request changes
   │  └─ YES → Continue
   │
   ├─ Are all tests passing?
   │  ├─ NO → Request changes
   │  └─ YES → Continue
   │
   ├─ Was issue addressed?
   │  ├─ NO → Request changes
   │  └─ YES → Continue
   │
   └─ Approve & merge ✅
```

---

## Labels Used in Workflow

### Status Labels (One at a time)

| Label               | Meaning                | Next Step            |
| ------------------- | ---------------------- | -------------------- |
| `in-review`         | AI is reviewing        | Wait for comment     |
| `awaiting-approval` | Ready for human review | Assign to maintainer |
| `approved-by-human` | Human approved         | Ready to merge       |
| `changes-requested` | Changes needed         | Fix and push commits |

### Tracking Labels (Optional)

| Label                     | Meaning                         |
| ------------------------- | ------------------------------- |
| `ai-review-approved`      | AI approved (no escalation)     |
| `ai-review-escalated`     | AI escalated after 3 cycles     |
| `needs-maintainer-review` | Lead maintainer review required |

---

## Troubleshooting

### AI Review Stuck on Same Issue

**Problem**: AI Round 2 reports same issue as Round 1

**Causes**:

- Implementing model didn't actually fix it
- Fix didn't address root cause
- Issue description was unclear

**Solution**:

1. Check implementing model's commits
2. Verify changes actually fix the issue
3. Comment with more specific guidance
4. Or escalate to human for clarification

### PR Rejected by Human After AI Approval

**Problem**: Human finds issue AI missed

**Steps**:

1. Document the issue type
2. Add to code review guidelines
3. Note in review prompt improvements
4. Create follow-up issue for prompt refinement

**Action**:

1. Request changes from developer
2. PR returns to Stage 2 for new review cycle
3. AI learns from this case

### Escalated PR Not Moving to Human Review

**Problem**: PR stuck at Stage 5, no human assignment

**Causes**:

- Assignment automation failed
- No maintainer on-call
- Too many PRs for available reviewers

**Solutions**:

1. Manually assign to maintainer
2. Check CODEOWNERS file
3. Ping maintainer in Slack
4. Escalate to project lead

### Merge Conflicts After Approval

**Problem**: PR approved but has conflicts with main

**Solution**:

1. Don't merge conflicted PR
2. Return to Stage 2
3. Developer rebases and pushes
4. Quick human re-review of conflicts
5. Then merge

---

## Metrics & Monitoring

### Track These

```
PR Flow Metrics:
  - PRs created per week
  - Avg time to merge
  - % approved on first AI review
  - % escalated to human

AI Review Metrics:
  - Avg issues found per PR
  - Issues resolved in Round 1 vs 2 vs 3
  - Escalation rate
  - AI accuracy (% of findings valid)

Human Review Metrics:
  - Avg time to review
  - Approval rate
  - Change request rate
  - Human reversals (AI approved, human rejected)

Quality Metrics:
  - Bugs found post-merge
  - Regressions per month
  - Code quality trend
```

### Dashboard Example

```
This Month:
  PRs Merged: 24
  Avg Time: 3.5 hours
  AI Approval %: 85% (on first round)
  Escalation %: 8%
  Human Approval %: 100%

AI Review Effectiveness:
  Issues Found: 47
  Round 1 Approval: 20 PRs (83%)
  Round 2 Approval: 3 PRs (13%)
  Round 3 Escalation: 1 PR (4%)

Quality Indicators:
  Post-Merge Bugs: 0
  Code Coverage: 94%
  CodeQL Alerts: 0
```

---

## Integration Points

### With Issue Management

```
Issue Created
    ↓
Labeled: implementation-ready
    ↓
Developer implements
    ↓
Creates PR (references issue)
    ↓
Workflow runs
    ↓
Merged
    ↓
Issue closes automatically
    ↓
Marked as done in project
```

### With Code Quality Standards

```
AI uses:
  - .github/prompts/code-review.prompt.md
  - .github/instructions/code-review.md
  - .github/prompts/modes/code-reviewer.md

Human uses:
  - .github/instructions/code-review.md (checklist)
  - src/README.md (architecture)
  - Project guidelines
```

### With CI/CD

```
Stages 1-2 → Complete
    ↓
CI/CD Pipeline Runs
    ├─ Tests
    ├─ Linting
    ├─ Security scan
    └─ Build checks
    ↓
All pass → Stage 5
Any fail → Notify & stop
```

---

## Best Practices

### For Optimal Results

1. **Keep PRs Small**

   - Single feature per PR
   - Easier to review
   - Faster approval

2. **Write Good Descriptions**

   - Explain what & why
   - Reference issue
   - Include manual testing notes

3. **Respond Quickly**

   - Fix issues same day if possible
   - Don't let PR languish
   - Keep momentum

4. **Engage with AI**

   - Read review comments carefully
   - Understand issues, don't just fix them
   - Learn from feedback

5. **Trust But Verify**
   - As human reviewer: Trust AI, verify context
   - As developer: Trust AI feedback, understand fixes
   - Both: Always think critically

---

## Frequently Asked Questions

**Q: What if I disagree with AI's issue?**
A: Add a comment explaining your disagreement. Human reviewer will see the discussion and make final call.

**Q: Can I skip AI review?**
A: No, AI review is mandatory. After 3 rounds, human can override if needed.

**Q: How long until human reviews?**
A: Target 4-6 hours during business hours. Escalated PRs (ai-review-escalated) get 12-hour SLA.

**Q: What if human and AI disagree?**
A: Human decision is final. Disagreements are logged for prompt improvement.

**Q: Can AI review be overridden?**
A: Yes, human reviewer can approve code that AI escalated if they judge it acceptable.

**Q: How is the reviewing model chosen?**
A: Different from implementing model to prevent bias. Typically uses different model variant or persona.

---

## Documentation References

**Workflow Documents**:

- `PR_WORKFLOW_AI_REVIEW.md` - Complete workflow specification
- `ai-code-review.yml` - GitHub Actions workflow file

**Code Review Standards**:

- `.github/instructions/code-review.md` - Review guidelines
- `.github/prompts/code-review.prompt.md` - Review prompt
- `.github/prompts/modes/code-reviewer.md` - Chat mode

**Project Context**:

- `.github/copilot-instructions.md` - Project guidelines
- `src/README.md` - Architecture documentation
- `REFACTORING_SUMMARY.md` - Design decisions

---

## Support & Issues

### Getting Help

1. **Understanding the Workflow**: See "Workflow Overview" section
2. **Troubleshooting**: Check "Troubleshooting" section
3. **Best Practices**: See "Best Practices" section
4. **Questions**: Post in project discussions

### Feedback & Improvements

Found an issue or have improvement ideas?

- Create an issue with label `workflow-improvement`
- Include specific scenario
- Suggest improvement
- Will be reviewed in next cycle

---

**Version**: 1.0
**Last Updated**: November 4, 2025
**Status**: Production Ready
**Owner**: Development Team
