---
description: Implementation guide for AI-assisted PR workflow with multi-model review
applyTo: "**"
---

# AI PR Workflow - Implementation Guide

## Quick Start

### For Immediate Use (Manual)

1. **Copy the review prompt**: `.github/prompts/code-review.prompt.md`
2. **Reference the chat mode**: `.github/prompts/modes/code-reviewer.md`
3. **Use during code reviews**: Reference `.github/instructions/code-review.md`

### For Automation (GitHub Actions)

1. **Enable workflow**: `.github/workflows/ai-code-review.yml`
2. **Configure**: Set appropriate branch/path triggers
3. **Monitor**: Check PR comments for review output

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Manual AI-assisted code reviews using existing prompts

**Steps**:

1. Train team on workflow

   - Read: `PR_WORKFLOW_GUIDE.md` (1 hour)
   - Discussion: Workflow explanation (30 min)
   - Q&A: Answer questions (30 min)

2. Establish code review standards

   - Use: `.github/instructions/code-review.md`
   - Print: Review checklist
   - Post: In Slack/team channel

3. Manual pilot

   - Start with 2-3 PRs
   - Use Copilot for AI review manually
   - Reference the prompt and chat mode
   - Document learnings

4. Gather feedback
   - What went well?
   - What was confusing?
   - Adjust standards as needed

### Phase 2: Automation Setup (Week 2-3)

**Goal**: Automated AI reviews via GitHub Actions

**Steps**:

1. Enable workflow

   ```bash
   # Verify workflow file is valid
   gh workflow list
   gh workflow view ai-code-review
   ```

2. Configure triggers

   - Set branch filter (e.g., main)
   - Set path ignore (e.g., markdown files)
   - Test with a sample PR

3. Set up automation

   - Label creation (script for new labels)
   - Auto-assignment (CODEOWNERS file)
   - PR templates (if not exists)

4. Monitor and adjust
   - Watch first 5 PRs through workflow
   - Verify comments are posted
   - Check label application
   - Adjust workflow if needed

### Phase 3: Integration (Week 4)

**Goal**: Full workflow adoption with human approval gate

**Steps**:

1. Implement human approval process

   - Set branch protection rules
   - Require approvals before merge
   - Set approval count (1-2)

2. Configure auto-merge (optional)

   - After human approval + all checks pass
   - Automatic merge to main

3. Train human reviewers

   - What to look for
   - When to request changes
   - Approval criteria

4. Launch
   - All new PRs use workflow
   - Old PRs handled manually if needed
   - Monitor metrics

### Phase 4: Optimization (Week 5+)

**Goal**: Continuous improvement based on metrics

**Steps**:

1. Collect metrics

   - PR velocity
   - AI approval rate
   - Escalation rate
   - Human review time

2. Analyze patterns

   - What issues are most common?
   - Where do PRs get stuck?
   - What could be improved?

3. Refine workflow

   - Update review prompt
   - Adjust escalation criteria
   - Improve automation

4. Share learnings
   - Team retrospectives
   - Update documentation
   - Celebrate improvements

---

## Configuration Checklist

### GitHub Settings

- [ ] Enable required status checks (branch protection)
- [ ] Set up CODEOWNERS file (for auto-assignment)
- [ ] Configure PR templates (if needed)
- [ ] Enable auto-merge (optional)
- [ ] Set up branch rules for main

### Labels

Create these labels in your repo:

```
in-review
  Color: Blue
  Description: PR is currently being reviewed by AI

awaiting-approval
  Color: Purple
  Description: Ready for human maintainer approval

approved-by-human
  Color: Green
  Description: Human maintainer approved

ai-review-approved
  Color: Green
  Description: AI review passed without issues

ai-review-escalated
  Color: Orange
  Description: AI escalated to human after 3 review cycles

changes-requested
  Color: Red
  Description: Changes requested by reviewer

needs-maintainer-review
  Color: Orange
  Description: Lead maintainer review required
```

### Workflow Files

- [ ] `.github/workflows/ai-code-review.yml` - Main workflow
- [ ] `.github/CODEOWNERS` - Ownership rules
- [ ] `.github/pull_request_template.md` - PR template

### Documentation

- [ ] `.github/workflows/PR_WORKFLOW_GUIDE.md` - Full guide
- [ ] `.github/workflows/PR_WORKFLOW_QUICK_REFERENCE.md` - Quick ref
- [ ] `.github/workflows/PR_WORKFLOW_AI_REVIEW.md` - Specification
- [ ] `PR_IMPLEMENTATION_GUIDE.md` - This file

---

## GitHub Actions Workflow Details

### Trigger Configuration

Current triggers in `ai-code-review.yml`:

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
    paths-ignore:
      - "**.md"
      - ".github/workflows/*.yml"
```

**What this means**:

- Runs when PR is created, updated, or reopened
- Ignores markdown files (don't need review)
- Ignores workflow YAML files

### Job Structure

```
ai-code-review
  ├─ Get PR details
  ├─ Get changed files
  ├─ Check existing reviews
  ├─ Determine review status
  ├─ Post review comment
  ├─ Apply labels
  └─ Escalate if needed

acceptance-criteria
  └─ Verify requirements met

ci-checks
  ├─ Run linting
  ├─ Run tests
  ├─ Validate schema
  └─ Post results

ready-for-approval
  ├─ Add labels
  └─ Post approval request
```

### Customization Options

**Change review dimensions**:

- Edit the checklist in "Post initial review comment"
- Add/remove review areas as needed
- Must match `.github/instructions/code-review.md`

**Change escalation threshold**:

- Current: 3 rounds maximum
- To change: Modify the comparison in "Determine review status"

**Change labels**:

- Edit label names in "Add in-review label" step
- Must create labels in GitHub first

**Change auto-assignment**:

- Edit assignees list in "Request human review if escalated"
- Use GitHub team names or usernames

---

## Using the Review Prompt

The prompt is in `.github/prompts/code-review.prompt.md`

### Manual Usage

```bash
# 1. Get the prompt
cat .github/prompts/code-review.prompt.md

# 2. Get the code to review
git diff origin/main...branch-name

# 3. In Copilot chat:
#    Paste prompt + code
#    Ask for review

# 4. Copilot uses 8-dimension review framework
#    Posts structured feedback

# 5. Developer fixes issues
#    You re-run review
```

### Automated Usage (in workflow)

The workflow automatically:

1. Gets PR diff
2. Loads review prompt
3. Sends to Copilot for review
4. Posts result as comment

---

## Handling Review Comments

### When Copilot Posts a Review

As a **developer**:

```
1. Read the comment carefully
2. For each issue:
   - Understand the problem
   - Find the suggested fix
   - Implement the change
3. Commit with descriptive message
4. Push to your branch
5. Copilot auto-reviews
```

As a **maintainer**:

```
1. See PR has review comment
2. Read the review
3. If approved:
   - Proceed to approval step
   - Assign to human reviewer
4. If issues remain:
   - Let dev fix
   - Copilot will re-review
```

### Comment Format Variations

**Round 1 (Initial)**:

```
## 🤖 Code Review - Round 1/3
[Issues or approval]
```

**Round 2-3 (Re-review)**:

```
## 🤖 Code Review - Round 2/3
[Re-evaluated changes]
```

**Escalation**:

```
## ⚠️ Code Review - Round 3/3 - ESCALATED
[Escalation notice]
```

---

## Managing the Workflow

### For Repository Owners

**Enable the workflow**:

```bash
# Verify workflow is present
ls -la .github/workflows/ai-code-review.yml

# Enable in GitHub UI:
# 1. Go to Actions tab
# 2. Click "AI Code Review Workflow"
# 3. Click "Enable workflow"
```

**Set up branch protection**:

```bash
# Using GitHub CLI
gh api repos/{owner}/{repo}/branches/main/protection \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ai-code-review"]
  },
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  }
}
EOF
```

### For Maintainers

**Set up CODEOWNERS** (`.github/CODEOWNERS`):

```
# Default owner for everything
* @default-owner

# Component-specific owners
src/components/ @component-owner
scripts/ @automation-owner
docs/ @docs-owner
```

**Configure PR templates** (`.github/pull_request_template.md`):

```markdown
## Description

Brief description of changes

## Issue

Closes #123

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Testing

Manual testing steps or notes
```

### Monitoring Workflow Runs

```bash
# List recent workflow runs
gh workflow run list

# Watch workflow progress
gh workflow run view <run-id>

# Debug failed job
gh workflow run view <run-id> --log
```

---

## Metrics & Monitoring

### What to Track

Set up dashboards to track:

```
PR Metrics:
  - PRs created per week
  - Avg time from PR to merge
  - Avg time in AI review
  - Avg time in human review

AI Review Metrics:
  - % approved on Round 1 (goal: 75%+)
  - % approved on Round 2 (goal: 15%+)
  - % escalated on Round 3 (goal: 10%-)
  - Avg issues per PR (trending)

Quality Metrics:
  - Bugs found post-merge
  - Regression rate
  - Code coverage trend
  - Security issues found
```

### Dashboard Setup

Using GitHub Projects:

```
1. Create project "PR Metrics"
2. Add custom fields:
   - PR created date
   - AI review complete date
   - Human review date
   - Merge date
3. Calculate times between dates
4. Track trends over time
```

### Monthly Retrospective

Schedule monthly review:

```
Review questions:
  1. How many PRs merged? (goal: X)
  2. What was avg time to merge? (target: < 5h)
  3. What was escalation rate? (target: < 10%)
  4. What issues keep coming up? (for training)
  5. What went well? What didn't?
  6. How can we improve?
```

---

## Troubleshooting

### Workflow Not Running

**Problem**: PR created but workflow doesn't run

**Solutions**:

1. Check workflow is enabled (Actions tab)
2. Verify file exists: `.github/workflows/ai-code-review.yml`
3. Check branch protection rules
4. Review workflow file syntax
5. Check permissions (need write access)

### Review Comments Not Posting

**Problem**: Workflow runs but no comment appears

**Solutions**:

1. Check workflow logs for errors
2. Verify GitHub token permissions (need `issues:write`)
3. Check if comments are being hidden
4. Verify action syntax

### Labels Not Applied

**Problem**: Workflow runs but labels don't appear

**Solutions**:

1. Verify labels exist in repo
2. Check label names match exactly
3. Verify permissions (need `labels:write`)
4. Check workflow syntax

### Escalation Not Happening

**Problem**: PR doesn't escalate after 3 rounds

**Solutions**:

1. Verify round counting logic
2. Check escalation condition in workflow
3. Ensure comments are being saved
4. Test manually with sample PR

### Human Assignment Failed

**Problem**: Escalated PR not assigned to maintainer

**Solutions**:

1. Verify CODEOWNERS file exists
2. Check username/team names are correct
3. Verify permissions for assignment
4. Manually assign as backup

---

## FAQ

**Q: Can I use this workflow without GitHub Actions?**
A: Yes, use the prompt and chat mode manually. Workflow automation is optional.

**Q: What if AI approval disagrees with human decision?**
A: Human decision is final. Document disagreement for prompt improvements.

**Q: How do I update review standards?**
A: Update `.github/instructions/code-review.md` and the workflow will use new standards.

**Q: Can I adjust the 3-round limit?**
A: Yes, edit the workflow job or create a modified version.

**Q: How do I train the AI to catch more issues?**
A: Refine `.github/prompts/code-review.prompt.md` based on what's being missed.

**Q: What if a PR needs to skip AI review?**
A: Add label `skip-ai-review` before workflow runs. Human review still required.

**Q: Can I use different review models?**
A: Yes, modify the prompt to specify different model personas.

---

## Resources

**Workflow Documentation**:

- `PR_WORKFLOW_GUIDE.md` - Complete guide
- `PR_WORKFLOW_AI_REVIEW.md` - Specification
- `PR_WORKFLOW_QUICK_REFERENCE.md` - Quick ref
- `ai-code-review.yml` - GitHub Actions file

**Code Review Standards**:

- `.github/instructions/code-review.md` - Review guidelines (411 lines)
- `.github/prompts/code-review.prompt.md` - Review prompt (291 lines)
- `.github/prompts/modes/code-reviewer.md` - Chat mode (328 lines)

**Project Documentation**:

- `.github/copilot-instructions.md` - Project guidelines
- `src/README.md` - Architecture (398 lines)
- `REFACTORING_SUMMARY.md` - Design decisions

---

## Support

**For Questions**:

1. Check documentation above
2. See FAQ section
3. Review troubleshooting
4. Ask in project discussions

**For Issues**:

1. Create issue with `workflow` label
2. Include: What happened, what was expected
3. Include: Steps to reproduce
4. Attach: Relevant logs or screenshots

**For Improvements**:

1. Create issue with `workflow-improvement` label
2. Describe improvement
3. Explain benefit
4. Link to related discussions

---

**Version**: 1.0
**Created**: November 4, 2025
**Status**: Production Ready
**Owner**: Development Team
