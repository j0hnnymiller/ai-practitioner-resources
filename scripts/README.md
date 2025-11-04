# Scripts Directory

Automation and maintenance scripts for the ai-practitioner-resources project.

Requirements:

- Node.js v18+ (fetch built-in, modern async/await)
- For GitHub API operations: a PAT with appropriate scopes

## Overview of Scripts

| Script                            | Purpose                                                             |
| --------------------------------- | ------------------------------------------------------------------- |
| `fetch-current-resources.js`      | Download current resources JSON from the configured Gist            |
| `generate-resources.js`           | Generate a new set of resources using the OpenAI API                |
| `merge-and-update.js`             | Merge current and new resources, update `weeks_on_list`             |
| `validate-schema.js`              | Validate resources JSON against `schema.json` using Ajv             |
| `update-gist.js`                  | Push current and timestamped resources to the target Gist           |
| `create-summary.js`               | Produce an automation summary with stats and insights               |
| `create-issues-from-templates.js` | Create GitHub issues from all templates in `.github/ISSUE_TEMPLATE` |
| `test-templates.js`               | Dry-run to parse and validate issue templates without API calls     |
| `issue-intake.js`                 | Process issue intake for prompts/modes (supports AI-first workflow) |
| `rebalance-lanes.js`              | Rebalance project lane labels per PM mode rules                     |
| `create-issues-with-gh.ps1`       | PowerShell helper to create issues using GitHub CLI                 |

Convenience npm scripts are defined in `package.json`:

```bash
npm run fetch-current
npm run generate
npm run merge
npm run validate
npm run update-gist
npm run create-summary
npm run run-automation
```

Environment variables (where applicable):

- `OPENAI_API_KEY` (generation)
- `GITHUB_GIST_TOKEN` (gist read/write)
- `GIST_ID` (target gist id)
- `GITHUB_TOKEN` and optionally `GITHUB_REPOSITORY` (issue creation)

---

## Create Issues from Templates

### `create-issues-from-templates.js`

Automatically create GitHub issues from all issue templates.

Usage:

```bash
GITHUB_TOKEN=your_token node scripts/create-issues-from-templates.js
```

Requirements:

- Node.js v18 or later
- GitHub Personal Access Token with `repo` scope
- Environment variable: `GITHUB_TOKEN`

Features:

- ✅ Parses YAML frontmatter from templates
- ✅ Creates issues via GitHub API
- ✅ Detects and skips duplicate issues
- ✅ Preserves template metadata (title, labels, body)
- ✅ Includes rate limiting and progress output

Output Example:

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

### `test-templates.js`

Validate template parsing without making API calls.

Usage:

```bash
node scripts/test-templates.js
```

Features:

- ✅ Validates all templates can be parsed
- ✅ Shows metadata for each template
- ✅ Displays statistics
- ✅ No GitHub API calls (safe for testing)

---

## Common Tasks

Preview what would be created:

```bash
node scripts/test-templates.js
```

Create all issues:

```bash
GITHUB_TOKEN=your_token node scripts/create-issues-from-templates.js
```

Create issues for a different repository:

```bash
GITHUB_TOKEN=your_token GITHUB_REPOSITORY=owner/repo node scripts/create-issues-from-templates.js
```

---

## Error Handling

Scripts include comprehensive error handling:

- Missing token → clear error message with usage
- Invalid repository → validates format
- API errors → bubbled with details
- Template parsing errors → validated with clear output
- Rate limiting → delays to respect API limits

## Integration

Use in three ways:

1. Locally (CLI)
2. CI/CD via GitHub Actions
3. Automated as part of weekly workflows

## Documentation

See:

- [CREATE_ISSUES.md](../docs/CREATE_ISSUES.md)
- [QUICK_START.md](../docs/QUICK_START.md)
- [IMPLEMENTATION_SUMMARY.md](../docs/IMPLEMENTATION_SUMMARY.md)

## Contributing

When adding new scripts:

1. Follow existing code style
2. Include error handling
3. Add usage documentation
4. Make scripts executable where relevant
5. Test thoroughly before committing

## License

These scripts are part of the ai-practitioner-resources project and follow the same license.
