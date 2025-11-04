# Scripts Directory

This directory contains automation scripts for the ai-practitioner-resources project.

## Available Scripts

### 1. `create-issues-from-templates.js`

**Purpose**: Automatically create GitHub issues from all issue templates

**Usage**:
```bash
GITHUB_TOKEN=your_token node scripts/create-issues-from-templates.js
```

**Requirements**:
- Node.js v18 or later
- GitHub Personal Access Token with `repo` scope
- Environment variable: `GITHUB_TOKEN`

**Features**:
- ✅ Parses YAML frontmatter from templates
- ✅ Creates issues via GitHub API
- ✅ Detects and skips duplicate issues
- ✅ Preserves all template metadata (title, labels, body)
- ✅ Includes rate limiting
- ✅ Provides detailed progress output

**Output Example**:
```
🚀 GitHub Issue Creator from Templates

Repository: j0hnnymiller/ai-practitioner-resources
============================================================
📂 Reading issue templates from: .github/ISSUE_TEMPLATE
Found 10 template files:
  - add-comprehensive-testing.md
  - add-github-footer-link.md
  ...

============================================================
Creating issues...

📝 Processing: Testing: Add Comprehensive Test Suite...
✅ Created: Issue #1
   URL: https://github.com/j0hnnymiller/ai-practitioner-resources/issues/1
...

============================================================
📊 Summary

✅ Created: 10 issue(s)
⏭️  Skipped: 0 issue(s) (already exist)
❌ Failed:  0 issue(s)
```

### 2. `test-templates.js`

**Purpose**: Validate template parsing without making API calls

**Usage**:
```bash
node scripts/test-templates.js
```

**Requirements**:
- Node.js v14 or later
- No authentication needed

**Features**:
- ✅ Validates all templates can be parsed
- ✅ Shows metadata for each template
- ✅ Displays statistics
- ✅ No GitHub API calls (safe for testing)

**Output Example**:
```
🔍 Template Validation Test

Reading templates from: .github/ISSUE_TEMPLATE
======================================================================

Found 10 template files

1. add-comprehensive-testing.md
   Title: "Testing: Add Comprehensive Test Suite..."
   Labels: [testing, refactoring, quality-assurance, technical-debt]
   Assignees: (none)
   Body length: 27466 characters
...

✅ Validation Summary

Total templates: 10
All templates parsed successfully!

📊 Statistics:
   Total labels: 36
   Unique labels: 23
```

## Directory Structure

```
scripts/
├── create-issues-from-templates.js  # Main issue creation script
├── test-templates.js                # Template validation script
└── README.md                        # This file
```

## Common Tasks

### Preview what would be created
```bash
node scripts/test-templates.js
```

### Create all issues
```bash
GITHUB_TOKEN=your_token node scripts/create-issues-from-templates.js
```

### Create issues for a different repository
```bash
GITHUB_TOKEN=your_token GITHUB_REPOSITORY=owner/repo node scripts/create-issues-from-templates.js
```

## Error Handling

Both scripts include comprehensive error handling:

- **Missing token**: Clear error message with usage instructions
- **Invalid repository**: Validates repository format
- **API errors**: Catches and reports GitHub API errors
- **Template parsing errors**: Validates template structure
- **Rate limiting**: Includes delays to respect API limits

## Integration

These scripts can be used:

1. **Locally**: Run from command line with personal access token
2. **CI/CD**: Via GitHub Actions workflow (see `.github/workflows/create-issues.yml`)
3. **Automated**: Triggered by events or scheduled runs

## Documentation

For more information, see:
- [CREATE_ISSUES.md](../docs/CREATE_ISSUES.md) - Full documentation
- [QUICK_START.md](../docs/QUICK_START.md) - Quick reference guide
- [IMPLEMENTATION_SUMMARY.md](../docs/IMPLEMENTATION_SUMMARY.md) - Technical overview

## Troubleshooting

### Script won't run
- Ensure Node.js is installed: `node --version`
- Check file permissions: `chmod +x scripts/*.js`

### Authentication errors
- Verify your token has `repo` scope
- Check token is not expired
- Ensure environment variable is set: `echo $GITHUB_TOKEN`

### Template parsing errors
- Run test script first: `node scripts/test-templates.js`
- Check template YAML frontmatter format
- Ensure templates are valid markdown

### API errors
- Check GitHub API status: https://www.githubstatus.com
- Verify repository exists and you have access
- Review rate limiting (script includes delays)

## Contributing

When adding new scripts:
1. Follow existing code style
2. Include error handling
3. Add usage documentation
4. Make scripts executable: `chmod +x script-name.js`
5. Test thoroughly before committing

## License

These scripts are part of the ai-practitioner-resources project and follow the same license.
