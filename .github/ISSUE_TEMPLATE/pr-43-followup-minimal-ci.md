---
name: Add minimal CI workflow (PR #43 follow-up)
about: Add simple GitHub Actions workflow to run tests on PRs
title: 'Add minimal CI workflow to run tests'
labels: enhancement, ci/cd, testing
assignees: ''
---

## 🚀 Enhancement from PR #43 Review

### Description
Add a minimal CI workflow to automatically run tests on pull requests and pushes to main branch.

### Implementation
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

### Benefits
- Automated testing on every PR
- Prevents broken code from being merged
- Provides quick feedback to contributors

### Context
This was suggested as an optional next step in PR #43: https://github.com/j0hnnymiller/ai-practitioner-resources/pull/43

### Labels
- enhancement
- ci/cd
- testing

### Note
This is a simpler implementation than the comprehensive CI/CD pipeline described in Issue #37. This focuses on just running the basic test suite that was added in PR #43.
