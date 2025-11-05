---
description: Pull Request workflow with Copilot multi-model review and human approval gate
applyTo: "**"
---

# Pull Request Workflow - AI-Assisted Multi-Model Review

## Overview

This workflow defines a comprehensive pull request process that combines **AI-assisted multi-model code review** with **human approval gates**. The process ensures high code quality through automated review iterations followed by human verification.

## Standard PR Lifecycle

```
Issue Created
    ↓
[Implementation Phase]
1. Create PR with implementation
    ↓
[Automated Review Phase]
2. COPILOT CODE REVIEW - First AI review
    ↓
    ├─ Issues found? → Add comment to PR
    │                  ↓
    │                  Implementing Model fixes issues
    │                  ↓
    │                  Reviewing Model reviews again
    │                  ↓
    │                  Repeat up to 3 times
    │
    └─ No issues? → Advance to next step
    ↓
3. Acceptance Criteria Verification - Test against requirements
    ↓
4. CI/CD Checks - Automated validation passes
    ↓
5. Human Approval Gate - Assign to human contributor
    ↓
[Approval Phase]
6. Human Review & Approval
    ↓
7. Approval & Merge - PR merged to main
```

---

## Detailed Workflow Stages

### Stage 1: Implementation (PR Creation)

**Trigger**: Issue labeled "implementation ready" or developer creates PR
**Actor**: Developer (Human or Copilot coding agent)
**Output**: Pull Request with implementation

**Requirements**:

- PR title follows format: `[Category]: Description`
- PR description references the issue: `Closes #123`
- Branch name meaningful: `feature/description` or `fix/description`
- All commits have meaningful messages

**Acceptance**:

- ✅ PR created successfully
- ✅ Files changed are relevant to issue
- ✅ Basic structure present

---

### Stage 2: Copilot Code Review (AI First Review)

**Trigger**: PR created
**Actor**: Copilot (Code Reviewer Model - different from implementing model)
**Duration**: Automatic, typically < 2 minutes
**Output**: Review comment on PR

#### 2A: Initial Review

**Process**:

1. **Activate Review Mode**

   - Use: `.github/prompts/modes/code-reviewer.md`
   - Apply: `.github/prompts/code-review.prompt.md`

2. **Evaluate Code**

   - Run through 8 review dimensions:
     - Architecture & modularity
     - Code quality standards
     - Testing & testability
     - Security
     - Error handling
     - Documentation
     - Performance
     - Automation patterns (if applicable)

3. **Assessment Decision**

   ```
   IF no issues found:
     → Add approval comment
     → Advance to Stage 3

   IF issues found:
     → Add detailed comment describing issues
     → List required changes with specifics
     → Advance to Stage 2B
   ```

#### 2B: Issue Remediation Cycle

**Maximum Iterations**: 3 rounds

**Round 1-3 Process**:

1. **Comment Posted to PR**

   - Format: `## 🤖 Code Review - Round [N]/3`
   - Include: Issues found, specific locations, remediation steps
   - Reference: Architecture guide, code quality standards
   - Example: See "PR Comment Templates" section below

2. **Implementing Model Fixes Issues**

   - Actor: Original implementing model (Copilot with coding-agent)
   - Process:
     - Read review comment
     - Implement suggested changes
     - Push commits to PR branch
     - Do NOT merge yet

3. **Reviewing Model Re-Reviews**

   - Actor: Code Reviewer Model (different model)
   - Process:
     - Evaluate only the changed code
     - Verify issues were addressed
     - Check for new issues introduced
     - Post new comment if found issues

4. **Decision**

   ```
   IF all issues resolved:
     → Post approval comment
     → Advance to Stage 3

   IF new/remaining issues AND rounds < 3:
     → Post comment with updated issues
     → Return to Round [N+1]

   IF issues remain AND rounds = 3:
     → Post comment: "3 review cycles complete. Escalating to human review."
     → Advance to Stage 3 with flag for human review
   ```

#### 2C: Review Escalation Decision

**Approval Path**:

- ✅ Issues resolved within 3 rounds → Continue to Stage 3
- ⚠️ Issues remain after 3 rounds → Flag for human review in Stage 5

**PR Labels**:

- Add: `ai-review-approved` (if approved by AI)
- Add: `ai-review-escalated` (if escalated after 3 rounds)

---

### Stage 3: Acceptance Criteria Verification

**Trigger**: PR advanced from Stage 2
**Actor**: Automated tests (CI/CD pipeline)
**Output**: Test results comment on PR

**Validation**:

```
For each acceptance criterion from the issue:
  ☐ Feature works as specified
  ☐ Edge cases handled
  ☐ Error conditions managed
  ☐ Data validation present
  ☐ API integration correct (if applicable)
```

**Decision**:

```
IF all acceptance criteria met:
  → Advance to Stage 4

IF criteria not met:
  → Add comment with failed criteria
  → Assign back to implementation
  → Return to Stage 2
```

---

### Stage 4: CI/CD Checks

**Trigger**: Acceptance criteria verified
**Actor**: GitHub Actions / Automated validation
**Output**: Build logs, test results

**Checks Performed**:

- ✅ **Linting**: Code style compliance
- ✅ **Type Checking**: TypeScript/validation (if applicable)
- ✅ **Unit Tests**: Core logic test coverage
- ✅ **Integration Tests**: Feature functionality
- ✅ **Security Scan**: CodeQL or similar
- ✅ **Schema Validation**: JSON/data schema compliance
- ✅ **Build**: Successful compilation/bundling
- ✅ **Performance**: No performance regressions

**Decision**:

```
IF all checks pass:
  → Add success badge/comment
  → Advance to Stage 5

IF any check fails:
  → Add failure comment with details
  → Assign back to implementation
  → Return to Stage 2
```

---

### Stage 5: Human Approval Gate

**Trigger**: All automated stages (2-4) complete
**Actor**: Human contributor (maintainer/reviewer)
**Output**: Manual approval or request for changes

#### 5A: Assignment to Human Reviewer

**Auto-Assignment Logic**:

```
IF ai-review-approved AND all checks pass:
  → Assign to: Maintainer on-call (or assign from CODEOWNERS)
  → Label: `awaiting-approval`
  → Comment: "Ready for human approval. @maintainer please review."

IF ai-review-escalated:
  → Priority: HIGH
  → Assign to: Lead maintainer
  → Label: `needs-maintainer-review`
  → Comment: "AI review escalated after 3 cycles. Lead maintainer approval needed."
```

#### 5B: Human Review Assessment

**Human Reviewer Evaluates**:

1. **AI Review Quality**

   - Did AI reviews identify all issues?
   - Were suggested fixes appropriate?
   - Is the code now production-ready?

2. **Escalated Issues** (if present)

   - Why did AI escalate?
   - Is this a legitimate code quality issue?
   - Should it be addressed before merge?
   - Or acceptable for this project?

3. **Context Review**

   - Does implementation match issue requirements?
   - Are architectural decisions sound?
   - Does it fit project direction?

4. **Final Assessment**
   - ✅ Approve and merge
   - ❌ Request changes
   - 🤔 Comment for clarification

#### 5C: Human Decision

```
IF human approves:
  → Label: `approved-by-human`
  → Comment: "Approved. Ready to merge."
  → Advance to Stage 6

IF human requests changes:
  → Comment: Specific feedback
  → Remove: `awaiting-approval` label
  → Return to: Stage 2 (new review cycle)

IF human needs clarification:
  → Comment: Questions/discussion
  → Wait for response
  → Continue assessment
```

---

### Stage 6: Approval & Merge

**Trigger**: Human approval received
**Actor**: Human contributor or automated merge
**Output**: PR merged to main branch

**Merge Process**:

1. **Pre-Merge Checks**

   - ✅ All checks still passing
   - ✅ No conflicts with main
   - ✅ All conversations resolved
   - ✅ Human approval fresh (within 24 hours)

2. **Merge**

   - Merge strategy: Squash or conventional (project setting)
   - Commit message: Includes issue reference
   - Delete branch: Yes (cleanup)

3. **Post-Merge**
   - ✅ Issue automatically closed (via "Closes #123" in PR)
   - ✅ Milestone marked complete (if applicable)
   - ✅ Release notes updated (if applicable)
   - ✅ Notify stakeholders

---

## PR Comment Templates

### Template 1: Initial Code Review (No Issues)

```markdown
## ✅ Code Review - Round 1/1

All code quality checks passed! Ready to proceed.

### Review Summary

- **Architecture**: ✅ Module boundaries respected
- **Code Quality**: ✅ Meets all standards
- **Testing**: ✅ Adequate coverage
- **Security**: ✅ No vulnerabilities found
- **Error Handling**: ✅ Comprehensive
- **Documentation**: ✅ Complete

### Next Steps

This PR is ready for acceptance criteria verification.
```

### Template 2: Issues Found

```markdown
## 🤖 Code Review - Round [N]/3

Found [X] issues that need to be addressed before approval.

### Issues Found

#### Issue 1: [Category] - [Specific File/Function]

**Location**: `src/path/file.js` line XXX
**Severity**: 🔴 Critical / 🟡 Medium / 🟢 Minor

**Problem**:
[Description of issue]

**Remediation**:
[Specific steps to fix]

**Reference**:
[Link to standards or documentation]

---

#### Issue 2: ...

### Summary

- **Total Issues**: X
- **Critical**: X
- **Medium**: X
- **Minor**: X

### Next Steps

Please address these issues and push commits to this branch. I will review the changes and confirm resolution.
```

### Template 3: Issues Resolved (Approval)

```markdown
## ✅ Code Review - Round 2/3 - APPROVED

All identified issues have been successfully addressed!

### Changes Verified

- ✅ [Issue 1] - Fixed
- ✅ [Issue 2] - Fixed

### Final Assessment

Code quality is now acceptable and ready for the next stage.

### Next Steps

- Proceeding to acceptance criteria verification
- CI/CD checks will run next
- After passing, this will be assigned to a human maintainer for final approval
```

### Template 4: Escalation (3 Rounds Complete)

```markdown
## ⚠️ Code Review - Round 3/3 - ESCALATED

After 3 review cycles, some issues remain unresolved. This PR is now escalated for human review.

### Remaining Issues

- [Issue 1]: [Description]
- [Issue 2]: [Description]

### AI Review Summary

- **Rounds Completed**: 3/3
- **Issues Identified**: X
- **Issues Resolved**: Y
- **Issues Remaining**: Z

### Escalation Reason

[Explanation of why AI couldn't resolve all issues]

### Next Steps

This PR will be assigned to a human maintainer who will:

1. Evaluate remaining issues
2. Determine if they're blocking concerns
3. Decide on approval/further changes

---

**Labels Added**: `ai-review-escalated`
```

### Template 5: Human Approval Ready

```markdown
## 👤 Ready for Human Approval

All automated checks have passed:

- ✅ AI code review completed
- ✅ Acceptance criteria verified
- ✅ CI/CD checks passing
- ✅ Security scan clean

### Automated Review Summary

- **Code Quality**: Approved
- **Test Coverage**: Adequate
- **Security**: No vulnerabilities
- **Performance**: No regressions

### Awaiting

Human maintainer final approval before merge.

---

**Labels**: `awaiting-approval`
**Assigned to**: [Maintainer name]
```

---

## Workflow Rules & Constraints

### AI Review Rules

1. **Model Separation**

   - Implementing model ≠ Reviewing model
   - Different specialized prompts/personas
   - Prevents echo-chamber effect

2. **Iteration Limit**

   - Maximum 3 review cycles
   - Each cycle must show progress
   - After 3: Escalate to human

3. **Issue Tracking**

   - Every issue gets a comment
   - Every fix gets verification
   - Every round gets documentation

4. **Auto-Decisions**
   - Issues found → Comment + Fix
   - Issues resolved → Approval comment
   - 3 rounds reached → Escalation

### Human Review Rules

1. **Assignment Criteria**

   - All PRs → Must reach human reviewer
   - Escalated PRs → Lead maintainer
   - Auto-assigned per CODEOWNERS

2. **Review Timeliness**

   - Target: 24 hours for review
   - Escalated: 12 hours for lead
   - Critical: ASAP

3. **Decision Options**

   - ✅ Approve & merge
   - ❌ Request changes (returns to stage 2)
   - 🤔 Ask clarification (discussion)

4. **Merge Criteria**
   - All checks passing
   - Human approval recorded
   - No merge conflicts
   - Issue references correct

---

## Status Labels

### During Workflow

| Label                            | Stage | Meaning                        |
| -------------------------------- | ----- | ------------------------------ |
| `awaiting-implementation`        | 1     | PR created, awaiting code      |
| `in-review`                      | 2     | AI code review in progress     |
| `ai-review-approved`             | 2     | AI review passed               |
| `ai-review-escalated`            | 2     | AI review escalated (3 rounds) |
| `awaiting-criteria-verification` | 3     | Testing acceptance criteria    |
| `awaiting-ci-checks`             | 4     | Running automated validation   |
| `awaiting-approval`              | 5     | Waiting for human reviewer     |
| `changes-requested`              | 5     | Human requested changes        |
| `approved-by-human`              | 6     | Ready to merge                 |

### Blocked States

| Label               | Reason                 | Action                   |
| ------------------- | ---------------------- | ------------------------ |
| `blocked-ai-review` | AI review unresolved   | Escalate to human        |
| `blocked-criteria`  | Acceptance test failed | Return to implementation |
| `blocked-ci`        | Build/test failed      | Fix per CI output        |
| `blocked-human`     | Needs clarification    | Respond to comments      |

---

## Integration Points

### With Project Management

- **Project Manager Mode** (`.github/prompts/modes/project-manager.md`)
  - Issues marked "implementation ready" enter pipeline
  - PRs in "awaiting-approval" move to done on merge
  - Blocked PRs labeled as such

### With Code Review Standards

- **Review Guidelines** (`.github/instructions/code-review.md`)
  - AI reviews use same standards as human
  - Checklist applied consistently
  - Red flags trigger escalation

### With CI/CD Pipeline

- **GitHub Actions**
  - Automated comments for check results
  - Blocking checks prevent merge
  - Status checks visible on PR

### With Issue Templates

- **Issue Fields**
  - "Acceptance Criteria" field checked during Stage 3
  - "Type" field influences review focus
  - "Priority" influences assignment

---

## Examples

### Example 1: Smooth Flow (No Issues)

```
1. PR created with implementation
   ↓
2. AI Code Review Round 1
   → "All checks passed" ✅
   ↓
3. Acceptance Criteria Verified ✅
   ↓
4. CI/CD Checks Pass ✅
   ↓
5. Human Reviewer Approves ✅
   ↓
6. Merged to main ✅

Timeline: ~30 minutes (automated) + 4 hours (human review)
```

### Example 2: Issues Found & Fixed (1 Cycle)

```
1. PR created with implementation
   ↓
2. AI Code Review Round 1
   → "Found 2 issues" 🤖
   ↓
2B. Implementing model fixes issues
   ↓
2. AI Code Review Round 2
   → "All checks passed" ✅
   ↓
3-6. [Same as Example 1]

Timeline: ~45 minutes (automated) + 4 hours (human review)
```

### Example 3: Complex Issues (Escalation)

```
1. PR created with implementation
   ↓
2. AI Code Review Rounds 1-3
   → Round 1: "Found 3 issues"
   → Round 2: "2 fixed, 1 remains"
   → Round 3: "Issue remains, escalating" ⚠️
   ↓
3-4. Acceptance criteria & CI still run
   ↓
5. Human Reviewer Evaluates
   → "Issue is architectural, needs discussion"
   → "Let's address in next phase"
   → Approves with note ✅
   ↓
6. Merged to main ✅

Timeline: ~1 hour (automated, 3 review cycles) + 6 hours (human review/discussion)
```

---

## Troubleshooting

### PR Stuck in Stage 2 (AI Review Cycle)

**Symptom**: Same issues reported multiple rounds

**Solutions**:

1. Check that implementing model is actually making changes
2. Verify issue descriptions are clear and actionable
3. Manually intervene - comment with explicit steps
4. Escalate to human if pattern continues

### PR Rejected by Human After AI Approval

**Symptom**: Human finds issues AI missed

**Actions**:

1. Document issue in code review guidelines
2. Add to common issues list
3. Refine review prompt to catch this class of issue
4. Note in retrospective for prompt improvement

### Escalated PR Stuck in Human Review

**Symptom**: PR waiting > 24 hours for human review

**Actions**:

1. Ping assignee in Slack/Discord
2. If no response in 12 hours, reassign to backup maintainer
3. If critical, escalate to project lead
4. Review and update review SLA

---

## Metrics & Monitoring

### Track These Metrics

- **PR Velocity**: Time from creation to merge
- **AI Review Effectiveness**: % approved without escalation
- **Issue Resolution**: % fixed in each AI review round
- **Human Review Load**: PRs awaiting human review
- **Escalation Rate**: % of PRs escalated to human
- **Quality Trend**: Issues found per PR over time

### Dashboard Views

```
PR Status:
  ├─ Open: 5
  ├─ In AI Review: 2
  ├─ Awaiting Human: 3
  └─ Ready to Merge: 1

AI Review Stats:
  ├─ Approved on Round 1: 15 (60%)
  ├─ Approved on Round 2: 8 (32%)
  ├─ Escalated: 2 (8%)
  └─ Avg Time: 23 minutes

Human Review Stats:
  ├─ Avg Time to Review: 4.2 hours
  ├─ Approval Rate: 92%
  ├─ Change Request Rate: 8%
  └─ Avg Review Time: 15 minutes
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

- [ ] Set up review prompt (`.github/prompts/code-review.prompt.md`)
- [ ] Set up chat mode (`.github/prompts/modes/code-reviewer.md`)
- [ ] Manual PR reviews using resources
- [ ] Document workflow

### Phase 2: Automation (Week 2-3)

- [ ] GitHub Actions workflow for AI reviews
- [ ] Bot to post review comments
- [ ] Bot to manage labels
- [ ] Implement feedback loop

### Phase 3: Refinement (Week 4+)

- [ ] Tune review prompts based on feedback
- [ ] Adjust escalation criteria
- [ ] Optimize assignment logic
- [ ] Monitor and improve metrics

---

## References

**Code Review Resources**:

- `.github/instructions/code-review.md` - Standards & checklist
- `.github/prompts/code-review.prompt.md` - Review prompt
- `.github/prompts/modes/code-reviewer.md` - Chat mode

**Project Context**:

- `.github/prompts/modes/project-manager.md` - Issue pipeline
- `.github/copilot-instructions.md` - Project guidelines
- `src/README.md` - Architecture documentation

**Testing & Quality**:

- `tests/example.test.js` - Testing patterns
- `scripts/README.md` - Automation patterns

---

**Last Updated**: November 4, 2025
**Status**: Framework Complete - Ready for Implementation
**Owner**: Development Team
