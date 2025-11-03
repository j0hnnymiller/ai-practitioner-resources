---
name: Fix comment in colors.js (PR #43 review)
about: Comment mismatch - says "1-2 weeks" but logic handles only 1 week
title: 'Fix comment in colors.js: "1-2 weeks" should be "1 week"'
labels: bug, documentation, good first issue
assignees: ''
---

## 🐛 Issue from PR #43 Review

**File**: `src/core/colors.js`  
**Line**: 45

### Problem
The comment says "1-2 weeks" but the logic condition `else` (following `weeks >= 2`) means this branch handles weeks < 2, which is only 1 week (assuming positive integers).

### Fix
The comment should say "1 week" to accurately reflect the actual condition:

```javascript
// 1 week: Green
```

### Context
This was identified in PR #43 code review: https://github.com/j0hnnymiller/ai-practitioner-resources/pull/43#discussion_r2487757775

### Labels
- bug
- documentation
- good first issue
