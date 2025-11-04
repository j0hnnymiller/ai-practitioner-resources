---
name: Add test coverage script (PR #43 follow-up)
title: 'Enhancement: Add test coverage reporting script'
labels: ["enhancement", "testing", "tooling"]
priority: "low"
estimated_hours: 1
---

## Problem Statement

Tests were added in PR #43, but there's no easy way to track test coverage metrics. Developers cannot easily see which parts of the codebase are tested and which need more coverage. This makes it difficult to maintain or improve code quality over time.

## Proposed Solution

Add a test coverage script to `package.json` that generates coverage reports using Vitest's built-in coverage capabilities.

## Technical Implementation

### Step 1: Install Coverage Dependency

```bash
npm install --save-dev @vitest/coverage-v8
```

### Step 2: Add Script to package.json

Add to the `scripts` section:

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

### Step 3: (Optional) Configure Coverage Thresholds

Create or update `vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
})
```

## Acceptance Criteria

- [ ] `@vitest/coverage-v8` installed as dev dependency
- [ ] `test:coverage` script added to package.json
- [ ] Running `npm run test:coverage` generates coverage report
- [ ] Coverage report shows line, branch, function, and statement coverage
- [ ] HTML coverage report generated for detailed analysis
- [ ] Documentation updated with coverage script usage

## Related Issues

- Suggested as optional next step in PR #43: https://github.com/j0hnnymiller/ai-practitioner-resources/pull/43

## Testing Requirements

- [ ] Verify coverage script runs successfully
- [ ] Verify coverage reports are generated
- [ ] Verify coverage metrics are accurate
- [ ] Test that coverage reports update when code changes

## Benefits

- Track test coverage metrics over time
- Identify untested code paths
- Set and enforce coverage thresholds
- Generate coverage reports for documentation
- Improve code quality confidence
