---
name: Add minimal CI workflow (PR #43 follow-up)
title: 'Enhancement: Add minimal CI workflow to run tests'
labels: ["enhancement", "ci/cd", "testing"]
priority: "medium"
estimated_hours: 1
---

## Problem Statement

Currently, tests added in PR #43 must be run manually. There's no automated testing in the CI/CD pipeline to catch regressions before code is merged. While Issue #37 describes a comprehensive CI/CD strategy, a minimal workflow would provide immediate value.

## Proposed Solution

Add a simple GitHub Actions workflow that automatically runs tests on pull requests and pushes to the main branch. This provides a safety net without the complexity of a full CI/CD pipeline.

## Technical Implementation

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
```

### Implementation Steps

1. Create the workflow file in `.github/workflows/`
2. Test the workflow on a feature branch
3. Verify it runs successfully on PR creation
4. Merge to main branch

## Acceptance Criteria

- [ ] Workflow file created at `.github/workflows/test.yml`
- [ ] Tests run automatically on every PR
- [ ] Tests run automatically on pushes to main
- [ ] Workflow uses Node.js 20 (current project standard)
- [ ] Failed tests prevent PR merge (via branch protection rules)
- [ ] Workflow execution time is under 2 minutes

## Related Issues

- Suggested as optional next step in PR #43: https://github.com/j0hnnymiller/ai-practitioner-resources/pull/43
- Related to comprehensive CI/CD in Issue #37 (this is a simpler, immediate solution)

## Testing Requirements

- [ ] Create test PR to verify workflow triggers correctly
- [ ] Verify workflow fails when tests fail
- [ ] Verify workflow passes when tests pass
- [ ] Check workflow execution time is reasonable

## Benefits

- Automated testing on every PR
- Prevents broken code from being merged
- Provides quick feedback to contributors
- Foundation for more comprehensive CI/CD later
