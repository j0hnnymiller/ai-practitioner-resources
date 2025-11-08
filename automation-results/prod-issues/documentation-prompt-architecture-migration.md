### Description

Create a comprehensive migration guide for applying the prompt-based business logic architectural pattern (established in pm-review.js) to other scripts in the repository.

### Problem

The pm-review.js script was successfully refactored to move all business logic from JavaScript to AI prompts, establishing a clean architectural pattern:

- **JavaScript**: API/session management only
- **Prompts**: All business logic and decision-making

However, other scripts in the repository (issue-intake.js, rebalance-lanes.js, and potentially others) still contain business logic in JavaScript that should be moved to prompts for consistency, maintainability, and clarity.

Without a migration guide:

- Inconsistent architecture across scripts
- Business logic scattered between code and prompts
- Difficult to maintain and update decision rules
- New contributors don't know which pattern to follow
- Risk of regression (adding business logic back to JavaScript)

### Proposed Solution

Create `docs/PROMPT_ARCHITECTURE_MIGRATION.md` documenting:

1. The architectural principle and rationale
2. Step-by-step migration process
3. Examples of before/after refactoring
4. Testing strategies for migrated code
5. Checklist for reviewing scripts

### Acceptance Criteria

**Core Documentation:**

- [ ] Clear statement of the architectural principle
- [ ] Rationale for prompt-based business logic
- [ ] Benefits and trade-offs of this approach
- [ ] When to use this pattern vs when not to

**Migration Guide:**

- [ ] Step-by-step process for identifying business logic in JavaScript
- [ ] Process for extracting logic to prompts
- [ ] Process for simplifying JavaScript to pure API calls
- [ ] Validation steps to ensure behavior is preserved
- [ ] Testing strategies (unit tests, integration tests)

**Examples:**

- [ ] Complete before/after example from pm-review.js refactoring
- [ ] Annotated code showing what moved where
- [ ] Example prompt structure for business logic
- [ ] Example simplified JavaScript structure

**Script-Specific Guidance:**

- [ ] Analysis of issue-intake.js with migration recommendations
- [ ] Analysis of rebalance-lanes.js with migration recommendations
- [ ] Guidance for future scripts

**Best Practices:**

- [ ] How to structure prompts for business logic
- [ ] How to pass context to AI prompts
- [ ] How to handle prompt responses in JavaScript
- [ ] Error handling patterns
- [ ] Logging and debugging strategies

**Integration:**

- [ ] Linked from README.md under "Architecture"
- [ ] Linked from CONTRIBUTORS.md
- [ ] Linked from each script that follows (or should follow) this pattern

### Content Outline

````markdown
# Prompt Architecture Migration Guide

## 1. Architectural Principle

### The Pattern

**JavaScript Role:** API integration and session management only

- Make HTTP requests
- Handle authentication
- Parse responses
- Apply decisions made elsewhere
- Manage state and data flow

**Prompt Role:** All business logic and decision-making

- Evaluate conditions
- Apply rules
- Make decisions
- Determine actions
- Generate recommendations

### Why This Pattern?

**Benefits:**

1. **Clarity**: Business logic is visible in prompts, not hidden in code
2. **Maintainability**: Change rules by editing prompts, not code
3. **Testability**: Easier to test decision logic separately from API calls
4. **Auditability**: Prompt files show decision history and rationale
5. **AI-First**: Enables AI to make nuanced decisions humans would make
6. **Consistency**: Single source of truth for business rules

**Trade-offs:**

- Requires AI API access for runtime decisions (mitigated: cache, fallbacks)
- Slightly increased latency for AI calls (mitigated: async, parallel)
- Need to manage prompt versioning and changes

### When to Use This Pattern

✅ **Use for:**

- Decision-making logic (labels to apply, status to set)
- Rule evaluation (ready vs not ready, priority scoring)
- Classification (issue type, risk level, size)
- Recommendations (assignments, next actions)

❌ **Don't use for:**

- Pure data transformation (parsing, formatting)
- Mathematical calculations (sum, average, sort)
- I/O operations (file read/write, API calls)
- Error handling and retry logic

## 2. Identifying Business Logic in JavaScript

### Common Patterns to Look For

**Pattern 1: Conditional Decision-Making**

```javascript
// ❌ Business logic in JavaScript
if (result.ready === false) {
  labels.add("needs-clarification");
  labels.remove("implementation ready");
}
```
````

**Pattern 2: Derived Values**

```javascript
// ❌ Business logic in JavaScript
if (result.independence === "high") {
  labels.add("independent");
}
const priorityLabel = `priority:${result.priorityScore}`;
```

**Pattern 3: Rule Enforcement**

```javascript
// ❌ Business logic in JavaScript
if (result.size === "large" && result.risk === "high") {
  comments.push("Large, high-risk issues require approval");
}
```

**Pattern 4: Classification Logic**

```javascript
// ❌ Business logic in JavaScript
const issueType = title.includes("Bug:")
  ? "bug"
  : title.includes("Feature:")
  ? "feature"
  : "enhancement";
```

## 3. Migration Process

### Step 1: Audit Current State

Create inventory of business logic:

```bash
# Find conditional logic
grep -n "if\|switch\|case" scripts/*.js

# Find label/status assignments
grep -n "labels\.\(add\|remove\)" scripts/*.js

# Find derived values
grep -n "const.*result\." scripts/*.js
```

Document each piece of logic:

- What decision is being made?
- What input data is used?
- What output is produced?
- Where could this move (which prompt)?

### Step 2: Design Prompt Structure

Example prompt structure for business logic:

```markdown
# Script Name — Business Logic Prompt

## Role

You are [role description]

## Input Context

You will receive:

- Field A: [description]
- Field B: [description]
- Existing state: [description]

## Output Format

Return strict JSON:
{
"decision": string,
"actions": {
"labels": { "add": [], "remove": [] },
"status": string,
"comment": string
},
"rationale": string
}

## Rules

### Rule 1: [Rule Name]

- Condition: [when to apply]
- Action: [what to do]
- Example: [concrete example]

### Rule 2: [Rule Name]

...

## Examples

### Example 1: [Scenario]

Input: {...}
Output: {...}
Rationale: ...
```

### Step 3: Move Logic to Prompt

**Before (JavaScript):**

```javascript
async function applyLabels(result, existingLabels) {
  const current = new Set(existingLabels);

  // Business logic
  if (result.size && ["small", "medium", "large"].includes(result.size)) {
    current.add(`size:${result.size}`);
  }

  if (result.ready === false) {
    current.add("needs-clarification");
    current.delete("implementation ready");
  }

  return Array.from(current);
}
```

**After (Prompt):**

```markdown
## Label Application Rules

### Size Labels

- Always include size label: `size:small`, `size:medium`, or `size:large`
- Add to `labels.add` array: `size:${your_size_assessment}`

### Readiness Labels

- If ready=false: add `needs-clarification` to `labels.add`
- If ready=true AND `needs-clarification` exists: add to `labels.remove`
- If ready=true: add `implementation ready` to `labels.add`
```

**After (JavaScript):**

```javascript
async function applyLabels(result, existingLabels) {
  const current = new Set(existingLabels);

  // Pure API execution - no business logic
  const adds = result.labels?.add || [];
  const removes = result.labels?.remove || [];

  adds.forEach((label) => current.add(label));
  removes.forEach((label) => current.delete(label));

  return Array.from(current);
}
```

### Step 4: Update JavaScript to Pure API Layer

Transformation checklist:

- [ ] Remove all `if/else/switch` statements that make decisions
- [ ] Remove all derived value calculations
- [ ] Remove all rule enforcement logic
- [ ] Keep only: API calls, data parsing, error handling
- [ ] JavaScript should only apply what AI returns

### Step 5: Test Migration

**Test Strategy:**

1. **Unit Test Prompts**: Test prompt with various inputs, verify outputs
2. **Integration Test**: Run full script, verify behavior unchanged
3. **Regression Test**: Compare new behavior to old behavior on historical issues
4. **Edge Case Test**: Test unusual scenarios, verify graceful handling

**Test Checklist:**

- [ ] Same inputs produce same outputs (regression test)
- [ ] Edge cases handled correctly
- [ ] Error cases handled gracefully
- [ ] Performance acceptable (within 2x of original)
- [ ] Logs show clear decision rationale

### Step 6: Deploy and Monitor

**Deployment:**

1. Deploy to test environment (Project #3)
2. Run on test issues
3. Verify outputs match expectations
4. Deploy to production (Project #1)
5. Monitor first 10-20 issues closely

**Monitoring:**

- Track AI API success rate
- Track decision quality (manual review sample)
- Track processing time
- Track errors and edge cases

## 4. Case Study: pm-review.js Refactoring

### Before: JavaScript Contains Business Logic

```javascript
async function applyLabelsFromResult(
  owner,
  repo,
  number,
  result,
  existingLabels
) {
  const current = toNameSet(existingLabels);

  const adds = new Set(result?.labels?.add || []);
  const removes = new Set(result?.labels?.remove || []);

  // ❌ Business logic: Derived labels from fields
  if (result?.size && ["small", "medium", "large"].includes(result.size)) {
    adds.add(`size:${result.size}`);
  }
  if (Number.isFinite(result?.priorityScore)) {
    const score = Math.max(0, Math.min(100, Math.round(result.priorityScore)));
    adds.add(`priority:${score}`);
  }
  if (result?.independence && ["high", "low"].includes(result.independence)) {
    adds.add(`independence:${result.independence}`);
    if (result.independence === "high") adds.add("independent"); // Derived rule
  }

  // ❌ Business logic: Enforce rules
  if (result?.ready === false) {
    removes.add("needs-approval");
    adds.add("needs-clarification");
  }

  // API execution
  const finalAdds = Array.from(adds).filter((n) => !current.has(n));
  for (const name of finalAdds) {
    await ensureLabel(owner, repo, name, "d4c5f9");
    current.add(name);
  }

  for (const name of removes) {
    current.delete(name);
  }

  await setIssueLabels(owner, repo, number, Array.from(current));
}
```

**Problems:**

- 50+ lines of business logic in JavaScript
- Rules hidden in code, not visible in prompts
- Must change code to change rules
- Hard to test decision logic separately

### After: Prompt Contains Business Logic

**Prompt (.github/prompts/pm-review.md):**

```markdown
## Rules for labels:

- **You must explicitly list ALL labels to add in the `labels.add` array.**
- Always include in `labels.add`:

  - `size:small` OR `size:medium` OR `size:large`
  - `priority:NN` where NN is 0-100
  - `independence:high` OR `independence:low`
  - `independent` (if independence is high - add this in addition)
  - `risk:low` OR `risk:medium` OR `risk:high`
  - Issue type: `feature` OR `bug` OR...

- If ready=false: add `needs-clarification` to `labels.add`
- If ready=true: add `implementation ready` to `labels.add`
- If ready=true and `needs-clarification` present: add to `labels.remove`

- **PM cannot add `needs-approval`** - humans only
```

**JavaScript:**

```javascript
async function applyLabelsFromResult(
  owner,
  repo,
  number,
  result,
  existingLabels
) {
  const current = toNameSet(existingLabels);

  // ✅ Pure API execution - no business logic
  const adds = new Set(result?.labels?.add || []);
  const removes = new Set(result?.labels?.remove || []);

  // Ensure labels exist and apply
  const finalAdds = Array.from(adds).filter((n) => !current.has(n));
  for (const name of finalAdds) {
    await ensureLabel(owner, repo, name, "d4c5f9");
    current.add(name);
  }

  for (const name of removes) {
    current.delete(name);
  }

  await setIssueLabels(owner, repo, number, Array.from(current));
}
```

**Benefits:**

- 20 lines (down from 50+)
- All rules visible in prompt
- Change rules by editing prompt file
- JavaScript is pure API execution

## 5. Script-Specific Recommendations

### issue-intake.js

**Current State:**

- Has routing logic: **TI** detection → Project #3 vs #1
- Has status setting logic
- Minimal business logic (mostly API execution)

**Recommendation:**
✅ Keep as-is for now

- Routing logic is simple and deterministic
- Not a good fit for AI decision-making (needs to be fast, reliable)
- Consider if routing becomes more complex

### rebalance-lanes.js

**Current State:**

- Has scoring logic: priority calculation
- Has sorting logic: priority, independence, size, age
- Has cap enforcement: 3 per lane
- Has independence checking

**Recommendation:**
🔄 Consider migration

- Scoring could use AI for nuanced decisions
- Independence checking could benefit from AI
- BUT: Performance critical (runs on every close)
- Hybrid approach: Rules in code, AI for edge cases?

**Potential Approach:**

1. Keep deterministic rules in code (caps, sorting)
2. Add AI optional override for independence conflicts
3. Document decision rules in separate markdown (not prompt)

## 6. Best Practices

### Prompt Design

**DO:**

- ✅ Use strict JSON output format
- ✅ Provide complete examples
- ✅ State all rules explicitly
- ✅ Include rationale requirements
- ✅ Handle edge cases

**DON'T:**

- ❌ Assume AI will infer unstated rules
- ❌ Leave output format ambiguous
- ❌ Mix instructions and data
- ❌ Omit error handling guidance

### JavaScript Design

**DO:**

- ✅ Validate AI output before applying
- ✅ Handle API errors gracefully
- ✅ Log decisions for debugging
- ✅ Keep functions small and focused
- ✅ Add comments explaining AI integration

**DON'T:**

- ❌ Add business logic to error handlers
- ❌ Silently modify AI decisions
- ❌ Skip validation of AI output
- ❌ Mix API calls and business logic

### Error Handling

```javascript
// ✅ Good: Validate and fail fast
async function applyAIDecision(result) {
  if (!result || typeof result !== "object") {
    throw new Error("Invalid AI response format");
  }

  if (!Array.isArray(result.labels?.add)) {
    throw new Error("Missing labels.add array in AI response");
  }

  // Apply decision
  await applyLabels(result.labels);
}

// ❌ Bad: Add business logic to error handler
async function applyAIDecision(result) {
  try {
    await applyLabels(result.labels);
  } catch (err) {
    // ❌ Business logic in error handler
    if (err.message.includes("timeout")) {
      result.labels = { add: ["needs-review"], remove: [] };
      await applyLabels(result.labels);
    }
  }
}
```

## 7. Maintenance and Evolution

### Prompt Versioning

Consider versioning prompts:

```
.github/prompts/
  pm-review.md          # Current version
  pm-review-v1.md       # Archive old versions
  pm-review-v2.md
```

### Regression Testing

Create test suite for prompts:

```
tests/prompts/
  pm-review.test.js     # Test prompt outputs
  test-cases/
    case-1-simple-feature.json
    case-2-complex-refactor.json
    expected-outputs/
      case-1-output.json
```

### Monitoring

Track prompt effectiveness:

- Decision quality (manual review)
- Error rates
- Processing time
- Override frequency (when humans change AI decisions)

## 8. Getting Started Checklist

For migrating a new script:

- [ ] Audit: Identify all business logic in JavaScript
- [ ] Document: List all decisions and rules
- [ ] Design: Create prompt structure
- [ ] Extract: Move logic to prompt
- [ ] Simplify: Reduce JavaScript to API calls
- [ ] Test: Verify behavior unchanged
- [ ] Deploy: Test environment first
- [ ] Monitor: Track for issues
- [ ] Document: Update this guide with learnings

## 9. Related Documentation

- [PM Review Prompt](.github/prompts/pm-review.md) - Example of prompt with business logic
- [Project Manager Mode](.github/prompts/modes/project-manager.md) - Example of decision-making prompt
- [Contributing Guide](CONTRIBUTORS.md) - For new contributors following this pattern

```

### Technical Notes

This guide documents the architectural refactoring that was completed for pm-review.js during this conversation, making it the canonical reference for future refactoring efforts.

### Dependencies

None - documentation only, but references the pm-review.js refactoring as primary example.

### Risk Level

None - documentation does not change functionality.

### Size Estimate

Large - comprehensive documentation task:
- 6-8 hours to write complete guide with examples
- 2-3 hours to analyze other scripts and provide recommendations
- 1-2 hours to create testing and monitoring guidance
- Should be treated as a significant documentation effort
```
