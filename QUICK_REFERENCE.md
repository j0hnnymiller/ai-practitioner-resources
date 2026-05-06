# Issue Lifecycle Test - Quick Reference

## 🚀 Quick Start

### Regenerate Diagram-Derived Path Artifacts

```bash
npm run generate:path-artifacts
```

### Validate Diagram, Catalog, and Seed Alignment

```bash
npm run validate:path-artifacts
```

### Create Workflow Path Issues From Generated Seed

```powershell
pwsh -File scripts/create-path-issues.ps1
```

### Test Without Creating Issues (Dry Run)

```bash
npm run test-lifecycle-dry
```

### Test With Real Issues

```bash
export GITHUB_TOKEN="ghp_your_token_here"
npm run test-lifecycle
```

### Shell Script Version

```bash
gh auth login
./scripts/test-issue-lifecycle.sh
```

### GitHub Actions (Recommended)

1. Go to **Actions** tab
2. Select **"Test Issue Lifecycle"**
3. Click **"Run workflow"**
4. Configure and run

## 📊 What Gets Tested

| Category           | Count | Examples                                                           |
| ------------------ | ----- | ------------------------------------------------------------------ |
| **Issue Types**    | 6     | Bug, Feature, UI/UX, Question, Resource, Contributor               |
| **Test Scenarios** | 12    | Happy path, failures, rejections, escalations                      |
| **Gates**          | 7     | Auto validation, PM triage, PR format, AI review, AC, CI/CD, human |
| **States**         | 20+   | Created, validated, triaged, lanes, PR workflow, closed            |
| **Transitions**    | 30+   | All paths including failures and recovery                          |

## 🎯 Test Scenarios

1. ✓ Happy Path - Complete flow
2. ✓ Validation Failure - Recovery path
3. ✓ PM Rejection - Triage rejection
4. ✓ Lane Progression - All 4 lanes
5. ✓ PR Format Failure - Correction
6. ✓ AI Review Rounds - 3 rounds max
7. ✓ AC Failure - Fix cycle
8. ✓ CI/CD Failure - Fix cycle
9. ✓ Maintainer Changes - Feedback loop
10. ✓ Manual Completion - No PR path
11. ✓ Escalation - AI to human
12. ✓ Different Types - Various issue types

## ⚙️ Configuration

| Variable        | Default  | Description                |
| --------------- | -------- | -------------------------- |
| `GITHUB_TOKEN`  | Required | GitHub PAT with repo scope |
| `DRY_RUN`       | `false`  | Set `true` to simulate     |
| `CLEANUP_AFTER` | `true`   | Set `false` to keep issues |
| `DELAY_MS`      | `2000`   | Delay between operations   |

## 📁 Generated Output

### Diagram-Derived Path Artifacts

```
docs/transition-catalog.json
docs/path-test-issues.seed.json
```

### Report Location

```
automation-results/issue-lifecycle-test-{timestamp}.md
```

### Report Contains

- ✓ Test execution metadata
- ✓ Scenario-by-scenario results
- ✓ List of created issues
- ✓ Coverage summary
- ✓ Pass/fail statistics

## 🔍 Verification

```bash
# List test issues
gh issue list --label test-automation --state all

# View latest report
cat automation-results/issue-lifecycle-test-*.md | tail -100

# Check specific issue
gh issue view <number>
```

## 🧹 Cleanup

```bash
# Automatic (default)
# Issues auto-close after test

# Manual (if needed)
gh issue list --label test-automation --state open --json number \
  -q '.[].number' | xargs -I {} gh issue close {}
```

## 🆘 Troubleshooting

| Problem                | Solution                        |
| ---------------------- | ------------------------------- |
| "GITHUB_TOKEN not set" | `export GITHUB_TOKEN="ghp_..."` |
| "Not authenticated"    | `gh auth login`                 |
| "Permission denied"    | `chmod +x scripts/*.sh`         |
| "Rate limit"           | Increase `DELAY_MS` or wait     |

## 📚 Full Documentation

- [Test Script README](scripts/TEST_LIFECYCLE_README.md)
- [Execution Guide](scripts/EXECUTION_GUIDE.md)
- [Implementation Summary](ISSUE_LIFECYCLE_TEST_SUMMARY.md)
- [State Diagram](.github/workflows/ISSUE_LIFECYCLE_STATE_DIAGRAM.md)
- [Path Test Issue Schema](docs/path-test-issue-schema.md)
- [Workflow Testing Setup](WORKFLOW_TESTING_SETUP.md)

## ✅ Expected Results

All 12 scenarios should **PASS** with:

- Issues created successfully
- Labels updated correctly
- Comments added as expected
- Issues closed appropriately
- Report generated
- Zero failures

---

**Ready to Run** | **Tested** ✓ | **Documented** ✓
