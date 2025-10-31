# Creating GitHub Issues from Templates

This document explains how to create GitHub issues from the issue templates located in `.github/ISSUE_TEMPLATE/`.

## Overview

This repository contains 10 comprehensive issue templates that can be converted into actionable GitHub issues:

1. **add-comprehensive-testing.md** - Add comprehensive testing framework (Jest + Playwright)
2. **add-github-footer-link.md** - Add GitHub repository link to footer
3. **automate-ai-resources-generation.md** - Automate AI resources generation via GitHub Actions
4. **gradual-fade-new-tag.md** - Implement gradual fade effect for NEW tags
5. **investigate-private-gist-impact.md** - Investigate impact of making gist private
6. **local-development-support.md** - Add local development environment support
7. **order-analysis-by-importance.md** - Order analysis points by importance
8. **remove-analysis-numbering.md** - Remove numbering from analysis points
9. **remove-analysis-prompt-bias.md** - Remove prompt bias from analysis content
10. **remove-weeks-on-list-references.md** - Remove weeks_on_list external script references

## Methods to Create Issues

There are three ways to create GitHub issues from these templates:

### Method 1: GitHub Actions Workflow (Recommended)

The easiest way is to use the automated GitHub Actions workflow.

#### Steps:

1. Go to the **Actions** tab in your GitHub repository
2. Select the **"Create Issues from Templates"** workflow from the left sidebar
3. Click **"Run workflow"** button
4. Choose options:
   - **Dry run**: Select `true` to preview what would be created without actually creating issues
   - **Dry run**: Select `false` to create the issues
5. Click **"Run workflow"** to execute

#### Dry Run Mode

It's recommended to run in dry run mode first to see what will be created:

```yaml
dry_run: true
```

This will show you:
- Which templates will be processed
- What titles will be used
- What labels will be applied
- No actual issues will be created

Once you're satisfied with the preview, run again with `dry_run: false` to create the issues.

### Method 2: Manual Script Execution

You can run the Node.js script directly from your local machine or terminal.

#### Prerequisites:

- Node.js installed (v14 or later)
- GitHub Personal Access Token with `repo` scope

#### Steps:

1. **Create a GitHub Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a descriptive name (e.g., "Create Issues Script")
   - Select the `repo` scope (this includes all repository permissions)
   - Click "Generate token"
   - **Copy the token immediately** (you won't be able to see it again)

2. **Clone the repository** (if not already done):
   ```bash
   git clone https://github.com/j0hnnymiller/ai-practitioner-resources.git
   cd ai-practitioner-resources
   ```

3. **Run the script**:
   ```bash
   GITHUB_TOKEN=your_token_here node scripts/create-issues-from-templates.js
   ```

   Replace `your_token_here` with your actual GitHub token.

#### Example Output:

```
🚀 GitHub Issue Creator from Templates

Repository: j0hnnymiller/ai-practitioner-resources
============================================================
📂 Reading issue templates from: /path/to/.github/ISSUE_TEMPLATE
Found 10 template files:
  - add-comprehensive-testing.md
  - add-github-footer-link.md
  - automate-ai-resources-generation.md
  ...

============================================================
Creating issues...

📝 Processing: Testing: Add Comprehensive Test Suite and Refactor for Testability
✅ Created: Issue #1
   URL: https://github.com/j0hnnymiller/ai-practitioner-resources/issues/1

📝 Processing: Enhancement: Add GitHub Repository Link to Page Footer
✅ Created: Issue #2
   URL: https://github.com/j0hnnymiller/ai-practitioner-resources/issues/2

...

============================================================
📊 Summary

✅ Created: 10 issue(s)
⏭️  Skipped: 0 issue(s) (already exist)
❌ Failed:  0 issue(s)

📝 Created Issues:
   - #1: Testing: Add Comprehensive Test Suite and Refactor for Testability
     https://github.com/j0hnnymiller/ai-practitioner-resources/issues/1
   - #2: Enhancement: Add GitHub Repository Link to Page Footer
     https://github.com/j0hnnymiller/ai-practitioner-resources/issues/2
   ...

============================================================
✨ Done!
```

### Method 3: Manual Creation via GitHub UI

If you prefer, you can manually create each issue using the GitHub web interface:

1. Go to the **Issues** tab in your repository
2. Click **"New issue"**
3. Select one of the templates from the template chooser
4. The template content will be pre-filled
5. Click **"Submit new issue"**
6. Repeat for all 10 templates

**Note**: This method is more time-consuming but gives you the opportunity to review and customize each issue before creation.

## Features

### Duplicate Detection

The script automatically checks for existing issues with the same title and skips them:

```
📝 Processing: Testing: Add Comprehensive Test Suite and Refactor for Testability
⏭️  Skipped: Issue already exists (#1)
   URL: https://github.com/j0hnnymiller/ai-practitioner-resources/issues/1
```

This prevents creating duplicate issues if you run the script multiple times.

### Metadata Preservation

The script extracts and preserves metadata from the template frontmatter:

- **Title**: From the `title:` field
- **Labels**: From the `labels:` array
- **Assignees**: From the `assignees:` field (if specified)
- **Body**: The full markdown content after the frontmatter

### Rate Limiting

The script includes a 1-second delay between issue creation to respect GitHub's rate limits and avoid overwhelming the API.

## Template Structure

Each template follows this structure:

```markdown
---
name: Template Name
about: Brief description
title: "Category: Specific Task Title"
labels: ["label1", "label2", "label3"]
assignees: ""
---

## 🎯 Problem Statement
...

## 💡 Proposed Solution
...

## 🛠️ Technical Implementation
...

## ✅ Acceptance Criteria
...
```

## Troubleshooting

### Error: GITHUB_TOKEN environment variable is required

**Solution**: Make sure you've set the `GITHUB_TOKEN` environment variable with a valid GitHub personal access token.

```bash
export GITHUB_TOKEN=your_token_here
node scripts/create-issues-from-templates.js
```

### Error: GitHub API error: 401

**Solution**: Your token may be invalid or expired. Generate a new token with the `repo` scope.

### Error: GitHub API error: 403

**Solution**: 
- You may have hit GitHub's rate limit. Wait a few minutes and try again.
- Your token may not have the necessary permissions. Ensure it has the `repo` scope.

### Error: GitHub API error: 422

**Solution**: This usually means the issue data is invalid. Check that:
- The issue title is not empty
- Labels are valid (they must already exist in the repository or will be ignored)
- Assignees are valid GitHub usernames

### Issues Already Exist

If you see "Skipped: Issue already exists", this is expected behavior. The script won't create duplicates. If you want to recreate an issue:

1. Close the existing issue in GitHub
2. Run the script again

Or manually delete the issue and run the script again.

## Security Notes

- **Never commit your GitHub token** to the repository
- Use environment variables or GitHub Secrets for token storage
- The GitHub Actions workflow uses the built-in `GITHUB_TOKEN` secret, which is automatically provided
- Personal access tokens should be treated like passwords

## Advanced Usage

### Creating Issues for a Different Repository

You can specify a different repository using the `GITHUB_REPOSITORY` environment variable:

```bash
GITHUB_TOKEN=your_token GITHUB_REPOSITORY=owner/repo node scripts/create-issues-from-templates.js
```

### Filtering Templates

To create issues from specific templates only, modify the script or manually move unwanted templates temporarily:

```bash
# Create a temporary backup
mkdir /tmp/backup
mv .github/ISSUE_TEMPLATE/unwanted-*.md /tmp/backup/

# Run the script
GITHUB_TOKEN=your_token node scripts/create-issues-from-templates.js

# Restore templates
mv /tmp/backup/*.md .github/ISSUE_TEMPLATE/
```

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the script output for error messages
3. Open a new issue in the repository with:
   - The error message
   - Steps to reproduce
   - Your environment (Node.js version, OS, etc.)

## License

This script and documentation are part of the ai-practitioner-resources project and are available under the same license as the main project.
