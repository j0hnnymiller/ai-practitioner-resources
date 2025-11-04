# Issue Templates for PR #43 Review Items

This directory contains issue templates for items identified during the PR #43 code review, following the project's markdown-first issue creation process.

## Templates Available

### Nits and Polish Items
1. **pr-43-nit-fix-comment-colors.md** - Fix comment mismatch in `src/core/colors.js:45`
   - Priority: Low
   - Estimated: 0.25 hours
   - Labels: bug, documentation, good first issue

2. **pr-43-nit-remove-unused-import.md** - Remove unused `addEventListener` import in `src/components/introduction.js:5`
   - Priority: Low
   - Estimated: 0.25 hours
   - Labels: code-quality, cleanup, good first issue

### Suggested Follow-ups
3. **pr-43-followup-minimal-ci.md** - Add minimal CI workflow to run `npm ci && npm test`
   - Priority: Medium
   - Estimated: 1 hour
   - Labels: enhancement, ci/cd, testing

4. **pr-43-followup-coverage.md** - Add `test:coverage` script for coverage reporting
   - Priority: Low
   - Estimated: 1 hour
   - Labels: enhancement, testing, tooling

## How to Create Issues from These Templates

This repository follows a **markdown-first process** as documented in `.github/instructions/creating-issues.md`.

### Method 1: Using GitHub CLI (Recommended)

```bash
# Navigate to repository root
cd ai-practitioner-resources

# Create issue from template
gh issue create \
  --title "Bug: Fix comment in colors.js - '1-2 weeks' should be '1 week'" \
  --body-file .github/issue_templates/pr-43-nit-fix-comment-colors.md \
  --label "bug,documentation,good first issue"

# Repeat for other templates...
```

### Method 2: Manual Copy via GitHub Web Interface

1. Open the template file in this directory
2. Copy the content (excluding the YAML frontmatter between `---`)
3. Go to https://github.com/j0hnnymiller/ai-practitioner-resources/issues/new
4. Paste the content into the issue description
5. Add the title from the frontmatter
6. Add the labels from the frontmatter
7. Click "Submit new issue"

### Method 3: Bulk Creation Script

For creating all issues at once:

```bash
# Create all PR #43 review issues
for file in .github/issue_templates/pr-43-*.md; do
  # Extract title and labels from frontmatter
  title=$(grep "^title:" "$file" | cut -d"'" -f2)
  labels=$(grep "^labels:" "$file" | sed 's/labels: \["\(.*\)"\]/\1/' | tr ',' ' ')
  
  # Create issue
  gh issue create --title "$title" --body-file "$file" --label "$labels"
  
  # Respectful rate limiting
  sleep 2
done
```

## Before Creating Issues

Check if similar issues already exist:
- Issue #37 covers comprehensive CI/CD (broader than the minimal workflow template)
- Search existing issues for keywords: "comment", "import", "CI", "coverage"
- Avoid creating duplicate issues

## Template Structure

Each template follows the project's required structure:
- **YAML Frontmatter**: name, title, labels, priority, estimated_hours
- **Problem Statement**: Clear description of the issue
- **Proposed Solution**: Detailed solution explanation
- **Technical Implementation**: Step-by-step plan
- **Acceptance Criteria**: Specific testable requirements
- **Related Issues**: Links to PR #43 and related issues
- **Testing Requirements**: Required validation steps

## Notes

These templates were created following the project's markdown-first process after PR #43 review feedback. The markdown format allows for version control, review, and automated issue creation via GitHub CLI.

For more information on the issue creation process, see:
- `.github/instructions/creating-issues.md` - Full process documentation
- Existing templates in this directory as examples
