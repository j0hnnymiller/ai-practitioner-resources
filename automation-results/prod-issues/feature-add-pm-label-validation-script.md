### Description

Create a validation script that verifies label completeness and correctness after PM review processes issues, ensuring all required metadata labels are present.

### Problem

After PM review applies labels, there's no automated way to verify that:

- All required label types are present (size, priority, independence, risk, type)
- Label values are valid (e.g., priority:0-100, not priority:150)
- Label combinations are logical (e.g., independence:high should have independent label)
- No conflicting labels exist (e.g., both size:small and size:large)

This can lead to issues entering the workflow with incomplete metadata, causing problems in lane rebalancing and prioritization.

### Proposed Solution

Create `scripts/validate-pm-labels.js` that:

1. Queries all open issues with their labels
2. Validates required label categories are present
3. Checks label values are within valid ranges
4. Verifies label consistency rules
5. Reports issues with missing or invalid labels
6. Optionally: auto-correct obvious errors (with --fix flag)

### Acceptance Criteria

- [ ] Script can validate all open issues in the repository
- [ ] Script can validate a specific issue by number
- [ ] Validation checks all required label categories (type, size, priority, independence, risk)
- [ ] Validation checks label values are within valid ranges
- [ ] Validation checks for label consistency (independence:high → independent present)
- [ ] Script produces a clear report of validation failures
- [ ] Script exits with error code if validation fails (for CI integration)
- [ ] Optional `--fix` flag can auto-correct simple issues
- [ ] Script is integrated into CI pipeline (GitHub Actions)

### Technical Notes

**Required Label Categories:**

- Issue type: feature, bug, enhancement, documentation, refactor, idea
- Size: size:small, size:medium, size:large
- Priority: priority:0 to priority:100 (integers)
- Independence: independence:high, independence:low (plus independent if high)
- Risk: risk:low, risk:medium, risk:high
- Readiness: needs-clarification OR implementation ready

**Validation Rules:**

1. Exactly one label from each category (except independence can have 2 if high)
2. Priority score must be 0-100 integer
3. If independence:high, must also have independent label
4. Cannot have both needs-clarification and implementation ready
5. Issue type label must be present

### Example Output

```
Validating 47 open issues...

✅ #123: All labels valid
✅ #124: All labels valid
❌ #125: Missing size label
❌ #126: Invalid priority:150 (must be 0-100)
❌ #127: Has independence:high but missing independent label
⚠️  #128: Has both needs-clarification and implementation ready

Summary:
- 44 issues valid
- 3 issues with errors
- 1 issue with warnings

Use --fix to auto-correct issues #127, #128
```

### Dependencies

- Requires access to GitHub REST API
- Should use same token handling as other scripts (TOKEN or GITHUB_TOKEN)

### Risk Level

Low - read-only validation script that doesn't modify issues unless --fix is used.

### Size Estimate

Medium - approximately 200-300 lines including validation rules, reporting, and optional fix logic.
