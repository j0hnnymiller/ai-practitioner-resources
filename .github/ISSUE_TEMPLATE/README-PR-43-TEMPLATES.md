# Issue Templates for PR #43 Review Items

This directory contains issue templates for items identified during the PR #43 code review.

## Templates Created

### Nits and Polish Items
1. **pr-43-nit-fix-comment-colors.md** - Fix comment mismatch in `src/core/colors.js:45`
2. **pr-43-nit-remove-unused-import.md** - Remove unused `addEventListener` import in `src/components/introduction.js:5`

### Suggested Follow-ups
3. **pr-43-followup-minimal-ci.md** - Add minimal CI workflow to run `npm ci && npm test`
4. **pr-43-followup-coverage.md** - Add `test:coverage` script for coverage reporting

## How to Create Issues from These Templates

### Option 1: Via GitHub Web Interface
1. Go to https://github.com/j0hnnymiller/ai-practitioner-resources/issues/new/choose
2. Select the appropriate template
3. Fill in any additional details
4. Click "Submit new issue"

### Option 2: Manually Copy Content
1. Open the template file
2. Copy the content (excluding the YAML frontmatter between `---`)
3. Go to https://github.com/j0hnnymiller/ai-practitioner-resources/issues/new
4. Paste the content
5. Add the labels mentioned in the template
6. Click "Submit new issue"

### Option 3: Using GitHub CLI (if available)
```bash
# For each template, create an issue from the file content
gh issue create --title "Fix comment in colors.js: '1-2 weeks' should be '1 week'" \
  --body-file .github/ISSUE_TEMPLATE/pr-43-nit-fix-comment-colors.md \
  --label "bug,documentation,good first issue"
```

## Before Creating Issues

Check if similar issues already exist:
- Issue #37 covers comprehensive CI/CD but is broader than the minimal workflow template
- No existing issues track the specific nits (comment fix, unused import)
- No existing issue tracks the simple coverage script suggestion

## Notes

These templates were created because automated issue creation via `gh` CLI requires a GitHub token that wasn't available in the GitHub Actions environment. The templates provide a structured way to manually create these tracking issues.
