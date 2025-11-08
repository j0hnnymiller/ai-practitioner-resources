### Description

Document the recovery procedure for issues that become stuck in "In Review" status when PM review fails or encounters errors.

### Problem

When `ANTHROPIC_API_KEY` is not configured or PM review encounters an error, issues can get stuck in "In Review" project status with no clear path forward. There's currently no documented procedure for:

- Identifying stuck issues
- Manually triggering PM review retry
- Manually applying labels when AI review is unavailable
- Moving issues back to "on the bench" status

This leaves maintainers uncertain about how to recover from PM review failures.

### Proposed Solution

Create comprehensive documentation in `docs/PM_REVIEW_RECOVERY.md` covering:

1. **Detection**: How to find issues stuck in "In Review"
2. **Root Cause Analysis**: Common reasons for PM review failure
3. **Recovery Options**: Step-by-step procedures for each scenario
4. **Manual Review**: Template for applying labels manually when AI is unavailable
5. **Monitoring**: How to set up alerts for stuck issues

### Acceptance Criteria

- [ ] Documentation file created at `docs/PM_REVIEW_RECOVERY.md`
- [ ] Includes detection query (GitHub CLI or GraphQL)
- [ ] Documents common failure scenarios (missing API key, API errors, network issues)
- [ ] Provides step-by-step recovery procedure for each scenario
- [ ] Includes manual label application template matching PM review output
- [ ] Includes example commands for moving issues between project statuses
- [ ] Includes monitoring recommendations (GitHub Actions workflow for stuck issue detection)
- [ ] Links to relevant scripts (pm-review.js, issue-intake.js)
- [ ] Added to main README.md under troubleshooting section

### Documentation Outline

```markdown
# PM Review Recovery Procedures

## 1. Detecting Stuck Issues

### Query for "In Review" Issues

- GitHub CLI command
- GraphQL query
- Expected vs actual counts

## 2. Common Failure Scenarios

### Scenario A: Missing ANTHROPIC_API_KEY

- Symptoms
- Recovery steps
- Prevention

### Scenario B: API Rate Limiting

- Symptoms
- Recovery steps
- Prevention

### Scenario C: Network Timeout

- Symptoms
- Recovery steps
- Prevention

### Scenario D: Invalid Issue Format

- Symptoms
- Recovery steps
- Prevention

## 3. Manual PM Review

### Label Application Template

- Checklist for manual evaluation
- Label selection guidelines
- Example label sets for common issue types

### Moving Issues to Correct Status

- Command to move from "In Review" to "on the bench"
- Command to set status after manual review

## 4. Automated Recovery

### Re-trigger PM Review

- Script to re-run PM review on specific issue
- Bulk re-review for multiple stuck issues

## 5. Monitoring

### GitHub Actions Workflow

- Daily check for issues in "In Review" > 24 hours
- Alert via issue comment or notification

### Metrics to Track

- Average time in "In Review"
- PM review success rate
- Manual intervention frequency
```

### Technical Notes

**Detection Query Example:**

```bash
# Find issues in "In Review" status
gh project item-list 1 --format json | jq '.items[] | select(.status == "In Review") | {number: .content.number, title: .content.title, updatedAt: .updatedAt}'
```

**Manual Label Template:**
Based on `.github/prompts/pm-review.md`, include:

- Issue type (feature/bug/enhancement/documentation/refactor/idea)
- Size (size:small/medium/large)
- Priority (priority:0-100)
- Independence (independence:high/low, plus independent if high)
- Risk (risk:low/medium/high)
- Readiness (needs-clarification or implementation ready)

### Dependencies

None - documentation only.

### Risk Level

None - documentation does not change code.

### Size Estimate

Small - documentation task, approximately 2-3 hours to write comprehensive guide with examples.
