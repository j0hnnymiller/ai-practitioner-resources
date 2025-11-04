# Quick Start: Create GitHub Issues from Templates

This is a quick reference guide for creating issues. For full documentation, see [CREATE_ISSUES.md](CREATE_ISSUES.md).

## 🚀 Fastest Method: GitHub Actions

1. Go to [Actions](../../actions) tab
2. Click **"Create Issues from Templates"** workflow
3. Click **"Run workflow"**
4. Select `dry_run: false`
5. Click **"Run workflow"** button

✅ Done! One issue will be created for each available template (up to 10 if all templates are present).

## 📝 What Gets Created

Up to 10 comprehensive issues for:

1. ✅ **Testing Framework** - Jest + Playwright implementation
2. 🔗 **Footer Link** - Add GitHub repository link
3. 🤖 **Automation** - Weekly AI resource generation
4. 🎨 **Fade Effect** - Gradual NEW tag fade
5. 🔍 **Investigation** - Private vs public gist impact
6. 💻 **Local Dev** - Development environment support
7. 📊 **Analysis Order** - Importance-based ordering
8. 🔢 **Remove Numbers** - Clean up analysis numbering
9. 📝 **Remove Bias** - Clean up prompt bias
10. 🧹 **Cleanup** - Remove external script references

## 💻 Alternative: Run Script Locally

```bash
# Requires Node.js and GitHub token
GITHUB_TOKEN=your_token_here node scripts/create-issues-from-templates.js
```

## ✨ Features

- ✅ Duplicate detection (won't create issues that already exist)
- 🏷️ Automatic label assignment
- 📝 Full template content preserved
- ⚡ Rate limiting to respect API limits

## 🔍 Preview Mode

Want to see what would be created first?

**GitHub Actions**: Select `dry_run: true`

**Script**: 
```bash
node scripts/test-templates.js
```

## ❓ Need Help?

See the full documentation: [CREATE_ISSUES.md](CREATE_ISSUES.md)
