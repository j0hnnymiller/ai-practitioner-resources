# Code Review Prompt

## Objective

Perform a comprehensive code review of the AI Practitioner Resources project, evaluating changes against architecture standards, code quality guidelines, security requirements, and testing practices.

## Context

The AI Practitioner Resources project is a modern web application for curating AI development resources. It features:

- **Modular architecture** with clear separation between core logic, services, components, and utilities
- **13 focused modules** across frontend (`src/`) and automation scripts (`scripts/`)
- **Pure function design** enabling 100% testability
- **Zero security vulnerabilities** (CodeQL verified)
- **100% schema validation** for resource data

## Architecture Overview

### Module Categories

1. **Core Modules** (`src/core/`) - Pure business logic, testable, no side effects

   - `colors.js` - Score-to-color transformations
   - `filters.js` - Resource filtering logic
   - `data-processor.js` - Data calculations and transformations

2. **Service Modules** (`src/services/`) - External integrations, mockable for testing

   - `api.js` - GitHub Gist API interactions
   - `storage.js` - LocalStorage abstraction

3. **Component Modules** (`src/components/`) - UI rendering, minimal state

   - `resource-card.js`, `filter-panel.js`, `stats.js`, `introduction.js`, `legend.js`, `analysis.js`, `modal.js`

4. **Utility Modules** (`src/utils/`) - Shared helpers

   - `dom.js` - DOM manipulation
   - `constants.js` - Configuration and constants

5. **Automation Scripts** (`scripts/`) - Node.js automation for resource generation and gist updates
   - Data fetching, AI generation, merging, validation, gist updates

## Review Dimensions

### 1. Modularity & Architecture

**Evaluate:**

- Does code fit appropriately in the module structure?
- Are module boundaries respected (core = pure, services = mockable, components = UI)?
- Is there any mixing of concerns (e.g., DOM access in core logic)?
- Are dependencies explicit and clear?
- Is the code in the right layer?

**Standards:**

- Core modules: Pure functions only, no side effects, no DOM/global state
- Service modules: Single responsibility, mockable interfaces
- Components: Presentation logic, minimal state management
- Utilities: Stateless, reusable, self-contained

### 2. Code Quality

**Evaluate:**

- Function size (should be under 20 lines)
- Cyclomatic complexity (should be under 10)
- Code duplication (follow DRY principle)
- Naming clarity (descriptive vs. vague)
- Consistency with existing patterns

**Standards:**

- Modern ES6+ JavaScript (const/let, arrow functions, async/await)
- No frameworks for frontend
- CommonJS for Node.js scripts
- Consistent naming: camelCase for functions/variables, UPPER_CASE for constants
- Comments explain "why", not "what"
- JSDoc for public functions

### 3. Testing & Testability

**Evaluate:**

- Are core logic changes covered by tests?
- Do tests cover happy path and error cases?
- Can components be tested with mock data?
- Are services mockable?
- Is there unnecessary coupling preventing testing?

**Standards:**

- Core modules: 100% test coverage target
- Tests use mock data and service mocks
- Tests are readable and well-named
- Example tests in `tests/example.test.js` show patterns

### 4. Security

**Evaluate:**

- No hardcoded secrets or API keys
- Input validation at service boundaries
- Error messages don't leak sensitive info
- No direct HTML injection without sanitization
- Dependencies don't have known vulnerabilities

**Standards:**

- Pass CodeQL scanning (0 alerts)
- Explicit input validation
- Secure defaults
- Error handling that's secure

### 5. Error Handling

**Evaluate:**

- All async operations wrapped in try-catch
- Errors logged with context
- Graceful degradation where possible
- User-friendly error messages
- Proper exit codes in scripts

**Standards:**

- Comprehensive error handling
- Meaningful error messages
- No silent failures
- Proper error propagation

### 6. Documentation

**Evaluate:**

- Code comments explain complex logic
- Public functions have JSDoc
- README updated if modules changed
- Implementation notes for complex algorithms
- Examples for new patterns

**Standards:**

- Self-documenting code with clear names
- "Why" comments, not "what" comments
- JSDoc for all exported functions
- Usage examples in comments or README

### 7. Performance

**Evaluate:**

- No unnecessary DOM operations
- Efficient data filtering/sorting
- API calls properly cached
- No memory leaks
- No blocking operations

**Standards:**

- Minimal DOM manipulation
- Efficient algorithms (avoid O(n²) where possible)
- Cache when appropriate
- Async operations don't block UI

### 8. Automation Scripts

**Evaluate:**

- Configuration validation before execution
- Rate limiting respects API limits (1-2 second delays typical)
- Clear progress reporting
- Comprehensive error handling
- Proper exit codes (0 = success, 1 = error)
- Summary output with statistics

**Standards:**

- Use built-in Node.js modules where possible
- Handle all error cases
- Log progress clearly
- Can be run multiple times safely (idempotent)
- Exit with proper codes for CI/CD

## Review Process

1. **Scope Assessment**

   - What files changed?
   - What modules are affected?
   - What's the risk level?

2. **Architecture Review**

   - Do changes respect module boundaries?
   - Is code in the right layer?
   - Are concerns properly separated?

3. **Code Quality Review**

   - Apply code quality standards
   - Check for violations
   - Assess maintainability

4. **Testing Review**

   - Are tests adequate?
   - Do they cover edge cases?
   - Are mocks used correctly?

5. **Security Review**

   - Check for vulnerabilities
   - Verify input validation
   - Look for secret leakage

6. **Documentation Review**

   - Is documentation complete?
   - Are examples clear?
   - Is README updated?

7. **Decision**
   - Approve, request changes, or comment

## Common Issues to Flag

### Code Quality

🚩 **Functions over 30 lines** - Request refactoring into smaller functions
🚩 **Deeply nested conditions** - Suggest early returns or extracted helpers
🚩 **No error handling** - Require try-catch for async operations
🚩 **Global state** - Request refactoring to explicit dependencies
🚩 **Copy-paste code** - Suggest extraction to shared function

### Architecture

🚩 **DOM access in core modules** - Move to component layer
🚩 **Business logic in components** - Move to core modules
🚩 **Hardcoded values** - Move to constants
🚩 **No module isolation** - Add clear boundaries
🚩 **Missing interfaces** - Define expected function signatures

### Testing

🚩 **No tests for core changes** - Require test coverage
🚩 **Tests that only test one thing** - Ask for edge cases
🚩 **Untestable code** - Suggest refactoring for testability
🚩 **Hardcoded test data** - Suggest fixtures or factories

### Security

🚩 **Hardcoded API keys** - Require environment variables
🚩 **Direct HTML injection** - Require sanitization
🚩 **No input validation** - Add validation layer
🚩 **Sensitive data in logs** - Remove or sanitize

### Documentation

🚩 **No JSDoc on public functions** - Require documentation
🚩 **Comments that repeat code** - Suggest better names
🚩 **No implementation notes** - Explain the "why"
🚩 **Outdated README** - Update module documentation

## Approval Template

**Status**: ✅ Approved / ⏸️ Changes Requested / 🤔 Comments

**Summary**: Brief overview of what's good and what needs work

**Strengths**:

- ✅ Item 1
- ✅ Item 2

**Feedback**:

- 🔍 Concern 1 - [specific guidance]
- 🔍 Concern 2 - [specific guidance]

**Required Changes** (before approval):

- ⚠️ Item 1
- ⚠️ Item 2

**Optional Improvements**:

- 💡 Suggestion 1
- 💡 Suggestion 2

**Test Results**:

- ✅ All tests pass
- ✅ No security issues
- ✅ No performance regressions

## Useful References

- **Architecture**: `src/README.md` - Module documentation and examples
- **Standards**: `.github/instructions/code-review.md` - Code quality guidelines
- **Tests**: `tests/example.test.js` - Testing patterns for all module types
- **Automation**: `scripts/README.md` - Automation script patterns
- **Schema**: `schema.json` - Resource validation rules
- **Refactoring**: `REFACTORING_SUMMARY.md` - Architecture decisions
