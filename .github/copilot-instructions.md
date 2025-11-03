# Copilot Instructions for AI Practitioner Resources

## Project Overview

This is a curated collection of AI-powered development resources featuring:
- **Static HTML web viewer** (`index.html`) for displaying resources
- **Node.js automation scripts** for weekly resource generation and gist management
- **GitHub Actions workflows** for automated updates
- **JSON schema validation** for resource data
- **AI-powered content generation** using OpenAI GPT-4

The project uses a **GitHub Gist** as the data backend, with the web viewer fetching and displaying resources in real-time.

## Repository Structure

```
ai-practitioner-resources/
├── index.html                    # Main web viewer (static HTML/CSS/JS)
├── schema.json                   # JSON schema for resource validation
├── package.json                  # Node.js dependencies and scripts
├── .github/
│   ├── workflows/                # GitHub Actions automation
│   ├── prompts/                  # AI generation prompts
│   ├── instructions/             # Project-specific instructions
│   └── ISSUE_TEMPLATE/           # Issue templates
├── scripts/                      # Automation Node.js scripts
│   ├── fetch-current-resources.js
│   ├── generate-resources.js
│   ├── merge-and-update.js
│   ├── validate-schema.js
│   ├── update-gist.js
│   └── create-summary.js
└── archive/                      # Historical documentation and legacy files
```

## Technology Stack

- **Frontend**: Pure HTML, CSS, JavaScript (no framework)
- **Backend Automation**: Node.js 18+
- **Dependencies**: node-fetch, ajv, ajv-formats
- **AI Integration**: OpenAI GPT-4 API
- **Data Storage**: GitHub Gist (JSON)
- **Deployment**: GitHub Pages

## Build and Test

### Installing Dependencies

```bash
npm install
```

### Running Scripts

Individual automation scripts:
```bash
npm run fetch-current    # Fetch current resources from gist
npm run generate          # Generate new resources with AI
npm run merge             # Merge and update weeks_on_list
npm run validate          # Validate against schema
npm run update-gist       # Update the gist
npm run create-summary    # Generate automation summary
```

Complete automation workflow:
```bash
npm run run-automation
```

### Testing Locally

1. Use `test-local.json` for local development
2. Update `GIST_CONFIG` in `index.html` to point to `"./test-local.json"`
3. Run local server: `python -m http.server 8080`
4. Access at `http://localhost:8080`
5. **Remember to switch back to production URL before committing**

### Validation

Always validate JSON against schema before committing:
```bash
npm run validate
```

## Coding Conventions

### JavaScript

- **Modern ES6+ syntax**: Use const/let, arrow functions, async/await
- **No frameworks**: Pure vanilla JavaScript for the web viewer
- **CommonJS modules**: For Node.js scripts (require/module.exports)
- **Error handling**: Always use try-catch blocks for async operations
- **API calls**: Use node-fetch for HTTP requests in scripts

### HTML/CSS

- **Semantic HTML**: Use appropriate HTML5 elements
- **Responsive design**: Mobile-first approach with media queries
- **Inline styles**: CSS is embedded in index.html for simplicity
- **Modern CSS**: Use flexbox, grid, CSS variables where appropriate
- **No external CSS frameworks**: Pure CSS only

### JSON

- **Schema compliance**: All resource JSON must validate against `schema.json`
- **HTML in text fields**: Introduction, analysis, and legend support HTML formatting
- **Required fields**: All fields defined in schema are required
- **Score range**: Resource scores must be 60-100
- **URL validation**: All source URLs must be valid and accessible

### File Organization

- **Temporary files**: Use `/tmp/` for runtime outputs (not committed)
- **Test data**: Use `test-local.json` for local testing
- **Archives**: Historical/legacy files go in `archive/` directory
- **Scripts**: All automation scripts in `scripts/` directory

## Contribution Process

**IMPORTANT**: This project uses an AI-first contribution workflow.

1. **Traditional PRs are NOT accepted**
2. Contributors create issues with detailed prompts describing their idea
3. Approved issues are assigned to GitHub Copilot for implementation
4. See `CONTRIBUTORS.md` for complete process

### Creating Issues

**MANDATORY**: Follow the markdown-first process documented in `.github/instructions/creating-issues.md`

1. Create markdown file first with complete frontmatter and structure
2. Review and validate the markdown
3. Create GitHub issue from the markdown file
4. Never create issues directly without markdown file

## Working with Automation

### Environment Variables

Scripts require these environment variables:
- `OPENAI_API_KEY` - OpenAI API key for GPT-4
- `GITHUB_GIST_TOKEN` - GitHub PAT with gist scope
- `GIST_ID` - Target GitHub Gist ID

### GitHub Actions

- Workflows are in `.github/workflows/`
- Weekly automation runs every Monday at 9 AM UTC
- Can be manually triggered from Actions tab
- Creates timestamped archives and summaries

### Data Management

- **weeks_on_list**: Automatically tracked by merge script
- **Gist updates**: Both current and timestamped versions
- **Schema validation**: Always run before updating gist
- **Historical data**: Archived versions preserved in gist

## Security and Best Practices

### Secrets Management

- **Never commit API keys or tokens** to the repository
- Use GitHub Secrets for sensitive data in workflows
- Local development requires `.env` file (not committed)

### Code Quality

- **Validate all JSON**: Use `npm run validate` before committing
- **Test locally**: Always test changes in local environment first
- **Review changes**: Check that index.html points to production URL
- **Minimal changes**: Make surgical, focused modifications

### HTML/JavaScript Security

- **Sanitize user input**: Although static, be mindful of XSS in generated content
- **HTTPS only**: All external resources should use HTTPS
- **No inline event handlers**: Use addEventListener instead

## Common Tasks

### Adding a New Resource Type

1. Update `schema.json` to include new type in enum
2. Add type-specific styling in index.html if needed
3. Test with `npm run validate`
4. Update documentation if needed

### Modifying the Web Viewer

1. Changes go in `index.html` (all HTML/CSS/JS in one file)
2. Test locally with `test-local.json`
3. Ensure responsive design works on all screen sizes
4. Verify changes don't break gist data loading

### Updating Automation Scripts

1. Scripts are in `scripts/` directory
2. Follow existing error handling patterns
3. Test with actual API calls (using test gist)
4. Update `scripts/README.md` if adding new functionality

### Modifying AI Prompts

1. Prompts are in `.github/prompts/`
2. Ensure generated output matches `schema.json`
3. Test prompt changes with actual API calls
4. Document any scoring framework changes

## Troubleshooting

### Common Issues

1. **JSON validation fails**: Check schema.json for required fields and data types
2. **Gist update fails**: Verify GITHUB_GIST_TOKEN has gist scope
3. **Local viewer doesn't load**: Check GIST_CONFIG URL and CORS settings
4. **AI generation fails**: Verify OPENAI_API_KEY and API rate limits

### Getting Help

- Check `README.md` for general documentation
- See `DEV_NOTES.md` for development-specific notes
- Review `scripts/README.md` for automation details
- Examine `CONTRIBUTORS.md` for contribution process

## Important Reminders

1. **Always validate JSON** before updating the gist
2. **Test locally** before pushing changes
3. **Keep index.html production URL** when committing
4. **Follow markdown-first process** for issues
5. **Minimal changes only** - surgical modifications
6. **No new frameworks** - keep it simple and pure
7. **Respect the AI-first workflow** - issues over direct PRs
8. **Archive old files** - don't delete, move to archive/

## Quality Standards

- **Code must be readable**: Clear variable names, logical organization
- **Comments where needed**: Complex logic should be explained
- **Consistent formatting**: Follow existing code style
- **Error messages**: Descriptive and actionable
- **Documentation**: Update docs when changing functionality
