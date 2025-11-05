---
description: Code review guidelines and codebase overview for reviewers
applyTo: "**"
---

# Code Review Guidelines for AI Practitioner Resources

## Codebase Overview

### Architecture

The project is a modern, modular web application for curating and displaying AI-powered development resources. It features:

- **Modular Architecture**: Split into 13 focused modules across `src/` (vs. 1,155-line monolith)
- **Clean Separation**: Core logic, services, components, utilities, and main app coordinator
- **100% Testable**: Pure functions in core modules enable comprehensive unit testing
- **Zero Vulnerabilities**: Passes CodeQL security scanning

### File Structure

```
ai-practitioner-resources/
├── index.html                    # Minimal HTML structure (187 lines)
├── styles.css                    # Extracted stylesheets (554 lines)
├── schema.json                   # Resource data validation schema
├── package.json                  # Node.js dependencies and scripts
├── src/
│   ├── app.js                   # Main application coordinator
│   ├── core/                    # Pure business logic (testable)
│   │   ├── colors.js           # Score-to-color calculations
│   │   ├── filters.js          # Resource filtering logic
│   │   └── data-processor.js   # Data transformations
│   ├── services/                # External integrations (mockable)
│   │   ├── api.js              # GitHub Gist API interactions
│   │   └── storage.js          # LocalStorage abstraction
│   ├── components/              # UI rendering components
│   │   ├── resource-card.js    # Resource card rendering
│   │   ├── filter-panel.js     # Filter UI controls
│   │   ├── stats.js            # Statistics display
│   │   ├── introduction.js     # Introduction section
│   │   ├── legend.js           # Scoring methodology
│   │   ├── analysis.js         # Weekly analysis
│   │   └── modal.js            # Modal dialog support
│   ├── utils/                   # Shared utilities
│   │   ├── dom.js              # DOM helper functions
│   │   └── constants.js        # Configuration and constants
│   └── README.md               # Comprehensive module documentation
├── scripts/                      # Node.js automation scripts
│   ├── fetch-current-resources.js
│   ├── generate-resources.js
│   ├── merge-and-update.js
│   ├── validate-schema.js
│   ├── update-gist.js
│   ├── create-summary.js
│   ├── issue-intake.js
│   └── README.md
├── tests/                        # Unit tests and examples
│   ├── api.test.js
│   └── example.test.js
└── .github/
    ├── workflows/               # GitHub Actions automation
    ├── prompts/                 # AI generation prompts
    │   ├── modes/              # Chat modes
    │   └── *.prompt.md         # Reusable prompts
    └── ISSUE_TEMPLATE/         # Issue templates
```

### Core Technologies

- **Frontend**: Pure ES6+ JavaScript (no frameworks)
- **Backend Automation**: Node.js 18+
- **Testing**: Vitest with example tests
- **Data Format**: JSON with schema validation (Ajv)
- **Deployment**: GitHub Pages + GitHub Gist
- **AI Integration**: OpenAI GPT-4

## Code Quality Standards

### JavaScript Standards

**✅ Must Follow:**

- **Modern ES6+ syntax** - Use `const`/`let`, arrow functions, `async`/`await`, template literals
- **No frameworks** - Pure vanilla JavaScript for web viewer
- **CommonJS for Node.js** - Use `require`/`module.exports` in scripts
- **Functions under 20 lines** - Keep cyclomatic complexity under 10
- **Pure core functions** - No side effects, no DOM access, no global state
- **Clear module boundaries** - Each module has one clear responsibility
- **Comprehensive error handling** - Always handle errors in async functions
- **Input validation** - Validate at service boundaries, not repeatedly

**✅ Code Organization:**

- Core modules: Pure functions only
- Service modules: Single responsibility with mockable interfaces
- Component modules: Presentation logic with minimal state
- Utility modules: Shared, reusable, stateless helpers

**✅ Code Style:**

- Consistent naming: camelCase for variables/functions, UPPER_CASE for constants
- Descriptive names: `getUserResources()` not `getData()`
- Comments for "why" not "what": Code should be self-documenting
- JSDoc for public functions: Include params, returns, and usage examples

### HTML/CSS Standards

**✅ HTML:**

- Semantic HTML5 elements
- Minimal structure (separated from styles and logic)
- ID and data attributes for JavaScript hooks
- Proper ARIA attributes for accessibility

**✅ CSS:**

- Responsive design (mobile-first)
- CSS variables for theming
- Flexbox/Grid for layout
- Inline styles in `styles.css` (one file for simplicity)
- No external CSS frameworks

### JSON Standards

**✅ Resource Data:**

- All resources must validate against `schema.json`
- HTML allowed in: introduction, analysis, legend fields
- All required schema fields must be present
- Score range: 60-100 (lower bounds indicate insufficient coverage)
- Dates in ISO 8601 format (YYYY-MM-DD)

### Node.js Script Standards

**✅ Automation Scripts:**

- Use built-in modules where possible (no unnecessary dependencies)
- Handle errors with try-catch for async operations
- Use `node-fetch` for HTTP requests
- Validate configuration before execution
- Return proper exit codes (0 for success, 1 for error)
- Add delays for API rate limiting (typically 1-2 seconds between requests)
- Clear, actionable error messages
- Progress reporting and summary output

## Review Checklist

### Functionality

- [ ] Feature works as described in PR/issue
- [ ] All acceptance criteria are met
- [ ] No regression in existing functionality
- [ ] Error cases are handled properly
- [ ] Edge cases are considered

### Code Quality

- [ ] Functions are under 20 lines
- [ ] Cyclomatic complexity under 10
- [ ] No global state/variables (except config)
- [ ] Clear module boundaries respected
- [ ] Consistent with existing code style
- [ ] No code duplication (follow DRY principle)

### Testing

- [ ] Core logic changes include tests
- [ ] Tests cover happy path and error cases
- [ ] Test examples updated if needed
- [ ] All tests pass locally

### Documentation

- [ ] Code comments explain "why", not "what"
- [ ] Public functions have JSDoc
- [ ] README updated if adding/changing modules
- [ ] Complex logic includes implementation notes

### Security

- [ ] No hardcoded secrets or credentials
- [ ] Input validation at service boundaries
- [ ] No direct HTML injection without sanitization
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies haven't been flagged for vulnerabilities

### Performance

- [ ] No unnecessary DOM operations
- [ ] No blocking async operations
- [ ] Efficient data filtering/sorting
- [ ] API calls are properly cached

### Accessibility

- [ ] Semantic HTML used correctly
- [ ] ARIA attributes present where needed
- [ ] Keyboard navigation supported
- [ ] Color not sole indicator of meaning

## Common Issues to Watch For

### ❌ Anti-Patterns

1. **Global Variables** - Breaks testability and isolation

   ```javascript
   // Bad
   let globalState = {};
   function updateState() {
     globalState.x = 1;
   }

   // Good
   function updateState(state) {
     return { ...state, x: 1 };
   }
   ```

2. **Mixed Concerns** - Core logic shouldn't touch DOM

   ```javascript
   // Bad: core/filters.js
   export function filterResources(criteria) {
     document.getElementById("results").innerHTML = "...";
   }

   // Good: pure function
   export function filterResources(resources, criteria) {
     return resources.filter((r) => matchesCriteria(r, criteria));
   }
   ```

3. **Inconsistent Error Handling** - Some paths ignored

   ```javascript
   // Bad
   const data = await fetch(url).then((r) => r.json());

   // Good
   try {
     const response = await fetch(url);
     const data = await response.json();
   } catch (err) {
     console.error("Failed to fetch:", err);
   }
   ```

4. **Large Functions** - Hard to test and maintain

   ```javascript
   // Bad: 100+ line function
   function processAndRenderData(data) {
     /* ... */
   }

   // Good: split into smaller functions
   function processData(data) {
     /* ... */
   }
   function renderData(data) {
     /* ... */
   }
   ```

### ✅ Best Practices

1. **Pure Functions** - Same input always produces same output
2. **Single Responsibility** - One reason to change
3. **Explicit Dependencies** - Pass data as parameters
4. **Early Returns** - Reduce nesting
5. **Named Constants** - Over magic numbers/strings
6. **Defensive Coding** - Validate inputs, handle errors

## Testing Standards

### Unit Tests

- Test core modules with 100% coverage
- Mock external dependencies (API, storage)
- Cover happy path and error cases
- Use descriptive test names: `should return sorted array when given unsorted resources`

### Test Examples

See `tests/example.test.js` for:

- How to test core modules
- Mocking API and storage services
- Testing component rendering
- Testing with mock data

## Automation Script Standards

### Script Requirements

- **Configuration validation** - Check required env vars and parameters
- **Rate limiting** - Add delays between API calls (1-2 seconds typical)
- **Error recovery** - Graceful degradation when possible
- **Progress reporting** - Show what's happening
- **Exit codes** - Return 0 on success, 1 on error
- **Summary output** - Final status and statistics

### Script Structure

```javascript
// 1. Configuration and imports
import fetch from "node-fetch";

// 2. Helper functions
async function fetchData(url) {
  /* ... */
}
function validateConfig() {
  /* ... */
}

// 3. Main function
async function main() {
  try {
    validateConfig();
    const data = await fetchData(url);
    console.log("Success:", data);
  } catch (err) {
    console.error("Error:", err.message);
    process.exitCode = 1;
  }
}

// 4. Execute
main();
```

## Review Focus Areas

### When Reviewing Frontend Changes

1. **Modularity** - Does it fit in the existing architecture?
2. **DOM operations** - Minimal, efficient, properly managed?
3. **Event handling** - Cleanup on removal? Memory leaks?
4. **Responsive design** - Mobile-first, tested on multiple sizes?
5. **Browser compatibility** - Works in Chrome 61+, Firefox 60+, Safari 11+, Edge 16+?

### When Reviewing Automation Scripts

1. **Error handling** - Catches and reports errors clearly?
2. **Rate limiting** - Respects API limits?
3. **Logging** - Clear progress and results?
4. **Idempotency** - Can be run multiple times safely?
5. **Exit codes** - Proper success/failure indication?

### When Reviewing Schema Changes

1. **Backward compatibility** - Does it break existing data?
2. **Validation** - Can validate with Ajv?
3. **Documentation** - Updated `schema.json` comments?
4. **Migration** - Is there a migration path if needed?

## Red Flags

🚩 **Stop and Ask Questions:**

- Changes to core modules without corresponding tests
- New global state or singleton patterns
- Direct DOM access in business logic modules
- Hardcoded values that should be configurable
- Removed error handling or try-catch blocks
- Comments that say "TODO" without issue reference
- Code that only works in specific environments
- Significant performance regressions
- Security-sensitive information in logs

## Approval Criteria

**Approve When:**

- ✅ All code quality standards met
- ✅ Tests pass and cover changes
- ✅ No security vulnerabilities
- ✅ Documentation is complete
- ✅ No regressions detected
- ✅ Follows project conventions
- ✅ Acceptance criteria met

**Request Changes When:**

- ❌ Code quality standards not met
- ❌ Missing tests for core logic
- ❌ Security concerns not addressed
- ❌ Documentation incomplete
- ❌ Performance concerns
- ❌ Architecture/modularity violated

## Review Process

1. **Initial Scan** - Check file structure and scope
2. **Deep Dive** - Review code logic and implementation
3. **Standards Check** - Verify against code quality checklist
4. **Testing** - Verify tests cover changes
5. **Security** - Look for vulnerabilities
6. **Documentation** - Ensure docs are updated
7. **Approval Decision** - Approve, request changes, or comment

## Useful References

- `src/README.md` - Comprehensive module documentation
- `REFACTORING_SUMMARY.md` - Architecture overview and decisions
- `schema.json` - Resource data validation rules
- `tests/example.test.js` - Testing examples for all module types
- `.github/copilot-instructions.md` - Project-wide guidelines
