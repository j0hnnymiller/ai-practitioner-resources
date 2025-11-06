# Issue Lifecycle Test Automation - Complete Implementation

This directory contains a complete test automation suite for the issue lifecycle as documented in `.github/workflows/ISSUE_LIFECYCLE_STATE_DIAGRAM.md`.

## 🎯 Quick Start

```bash
# Test without creating issues (recommended first)
npm run test-lifecycle-dry

# Test with real issue creation
export GITHUB_TOKEN="ghp_your_token_here"
npm run test-lifecycle

# Or use GitHub Actions (recommended)
# Go to Actions → Test Issue Lifecycle → Run workflow
```

See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for more options.

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [QUICK_REFERENCE.md](QUICK_REFERENCE.md) | Quick start guide |
| [ISSUE_LIFECYCLE_TEST_SUMMARY.md](ISSUE_LIFECYCLE_TEST_SUMMARY.md) | Complete implementation summary |
| [scripts/EXECUTION_GUIDE.md](scripts/EXECUTION_GUIDE.md) | Detailed execution instructions |
| [scripts/TEST_LIFECYCLE_README.md](scripts/TEST_LIFECYCLE_README.md) | Test script documentation |

## 🛠️ What's Included

### Test Scripts
- **scripts/test-issue-lifecycle.js** - Node.js automation (12 scenarios)
- **scripts/test-issue-lifecycle.sh** - Shell script alternative (5 scenarios)

### GitHub Actions
- **.github/workflows/test-issue-lifecycle.yml** - Automated workflow

### NPM Scripts
```json
{
  "test-lifecycle": "node scripts/test-issue-lifecycle.js",
  "test-lifecycle-dry": "DRY_RUN=true node scripts/test-issue-lifecycle.js"
}
```

## ✅ Test Coverage

- **Issue Types**: 6 (bug, feature, UI/UX, question, resource, contributor)
- **Scenarios**: 12 comprehensive test paths
- **States**: 20+ lifecycle states
- **Transitions**: 30+ state transitions
- **Gates**: 7 automated and manual gates

## 🎯 Test Scenarios

1. Happy Path - Complete flow
2. Validation Failure - Recovery path
3. PM Rejection - Triage rejected
4. Lane Progression - All lanes
5. PR Format Failure - Correction
6. AI Review Rounds - 3 rounds max
7. AC Failure - Fix cycle
8. CI/CD Failure - Fix cycle
9. Maintainer Changes - Feedback loop
10. Manual Completion - No PR
11. Escalation - AI to human
12. Different Types - Various types

## 🚀 Execution Methods

### 1. GitHub Actions (Recommended)
1. Navigate to **Actions** tab
2. Select **"Test Issue Lifecycle"**
3. Click **"Run workflow"**
4. Configure options and run

### 2. Node.js Script
```bash
# Dry run
npm run test-lifecycle-dry

# Live run
export GITHUB_TOKEN="ghp_..."
npm run test-lifecycle
```

### 3. Shell Script
```bash
gh auth login
./scripts/test-issue-lifecycle.sh
```

## 📊 Expected Results

When executed, the test will:
- Create 12-15 test issues
- Simulate all lifecycle states
- Generate a detailed report
- Auto-close test issues (optional)

All test issues are labeled `test-automation` and have `[TEST]` prefix.

## 🔍 Verification

```bash
# View test issues
gh issue list --label test-automation --state all

# View latest report
cat automation-results/issue-lifecycle-test-*.md | less
```

## 📁 Generated Output

Reports are saved to:
```
automation-results/issue-lifecycle-test-{timestamp}.md
```

Each report contains:
- Test execution metadata
- Scenario results
- Created issues list
- Coverage summary
- Statistics

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GITHUB_TOKEN` | Required | GitHub PAT |
| `DRY_RUN` | `false` | Simulate mode |
| `CLEANUP_AFTER` | `true` | Auto-close issues |
| `DELAY_MS` | `2000` | Operation delay |

## 🎓 Features

✓ **Comprehensive** - Tests all states, transitions, gates
✓ **Flexible** - Multiple execution methods
✓ **Safe** - Dry-run mode available
✓ **Automated** - Full automation, no interaction needed
✓ **Documented** - Complete documentation suite
✓ **Validated** - Dry-run tested successfully

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| "GITHUB_TOKEN not set" | Export token: `export GITHUB_TOKEN="ghp_..."` |
| "Not authenticated" | Login to gh: `gh auth login` |
| "Permission denied" | Make executable: `chmod +x scripts/*.sh` |
| "Rate limit" | Increase delay: `DELAY_MS=5000` |

## ✅ Status

- [x] Test plan created
- [x] Scripts implemented
- [x] Workflows configured
- [x] Documentation complete
- [x] Dry-run validated
- [x] Ready for execution

**Status**: 🟢 **COMPLETE** - Ready to execute!

## 📖 Related Documentation

- [Issue Lifecycle State Diagram](.github/workflows/ISSUE_LIFECYCLE_STATE_DIAGRAM.md)
- [Project Manager Mode](.github/prompts/modes/project-manager.md)
- [PR Workflow Guide](.github/PR_WORKFLOW_GUIDE.md)

---

**Implementation Date**: 2025-11-05  
**Status**: ✅ Complete  
**Next Step**: Execute via GitHub Actions or `npm run test-lifecycle`
