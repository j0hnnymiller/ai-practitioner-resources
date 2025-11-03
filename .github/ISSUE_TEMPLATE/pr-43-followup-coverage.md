---
name: Add test coverage script (PR #43 follow-up)
about: Add test:coverage script to track test coverage
title: 'Add test coverage reporting script'
labels: enhancement, testing, tooling
assignees: ''
---

## 📊 Enhancement from PR #43 Review

### Description
Add a test coverage script to track and monitor test coverage over time.

### Implementation
Add to `package.json` scripts:

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

And install coverage dependency:

```bash
npm install --save-dev @vitest/coverage-v8
```

### Usage
```bash
npm run test:coverage
```

### Benefits
- Track test coverage metrics
- Identify untested code paths
- Ensure coverage thresholds are met
- Generate coverage reports for documentation

### Context
This was suggested as an optional next step in PR #43: https://github.com/j0hnnymiller/ai-practitioner-resources/pull/43

### Labels
- enhancement
- testing
- tooling
