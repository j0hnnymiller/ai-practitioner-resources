# Project Manager Modes Overview

This document describes the two PM modes available in the AI Practitioner Resources project and explains their relationship.

## Two PM Modes with Equivalent Intent

Both modes serve the same purpose: **triaging, prioritizing, and managing issues** in a GitHub repository. They share the same core responsibilities but target different usage contexts.

### Mode 1: Project Manager (Chat Mode)
**File:** `.github/prompts/modes/project-manager.md`

**Context:** Long-form chat interactions with human project managers

**Use case:** 
- Manual issue review and prioritization sessions
- Interactive lane rebalancing discussions
- Deep-dive issue analysis with back-and-forth Q&A
- Training and documentation reference for human PMs

**Characteristics:**
- Comprehensive guidance with detailed examples
- Includes PowerShell and CLI command examples
- Extensive edge case handling
- Approval protocol and review checklists
- Full scoring rubric with tie-breaking rules

### Mode 2: AI Assistant PM
**File:** `.github/prompts/modes/ai-assistant-pm.md`

**Context:** Automated GitHub Actions workflow execution

**Use case:**
- Automated issue intake on issue open events
- Rapid initial triage with structured JSON output
- Token-optimized for cost efficiency
- Batch processing multiple issues

**Characteristics:**
- Strict JSON-first output protocol
- Concise rationales (2-4 sentences max)
- Token optimization guidelines
- Batch operation formats
- Focus on speed and automation

## Binding Relationship

Both modes implement the **same decision framework** but with different presentation styles:

### Shared Core Principles

1. **Lane Management**
   - Four swimlanes: at bat (3 max), on deck (3 max), in the hole (3 max), on the bench (unlimited)
   - Every issue has exactly one lane label
   - Rebalance only on close events, not on open/edit

2. **Approval Gate**
   - Only issues with "implementation ready" label (applied by humans) can enter active pipeline
   - Unapproved issues stay on the bench

3. **Independence Rules**
   - Active lane issues must be implementable simultaneously
   - No merge conflicts or overlapping file changes
   - Different components/folders preferred

4. **Priority Scoring**
   ```
   Priority Score = Impact (0-5) + Urgency (0-5) + (5 - Risk) + (5 - Size penalty) + Independence (0-5)
   ```
   - Tie-breaking: (1) independence > (2) smaller size > (3) older issue

5. **Required Labels**
   - Type: feature, bug, refactor, documentation, etc.
   - Size: small, medium, large
   - Priority: priority:NN (0-100)
   - Independence: independence:high or independence:low
   - Risk: risk:low, risk:medium, risk:high
   - Readiness: needs-clarification or implementation ready

6. **Size Constraints**
   - size:large issues MUST be split into smaller sub-issues
   - Only size:small and size:medium can be approved

### Key Differences

| Aspect | Project Manager (Chat) | AI Assistant PM (Automation) |
|--------|----------------------|---------------------------|
| **Output** | Conversational prose | Strict JSON + brief prose |
| **Length** | Comprehensive | Token-optimized |
| **Examples** | Extensive CLI snippets | Quick reference only |
| **Tone** | Educational | Operational |
| **Use** | Human-driven | GitHub Actions |
| **Flexibility** | Discussion-oriented | Deterministic |

## When to Use Each Mode

### Use Project Manager Mode When:
- Manually triaging issues in a chat session
- Training new team members on the PM process
- Discussing edge cases or complex dependencies
- Conducting quarterly/monthly prioritization reviews
- Resolving conflicts between competing priorities

### Use AI Assistant PM Mode When:
- Automating issue intake via GitHub Actions
- Processing high volumes of issues quickly
- Requiring consistent, structured output for parsing
- Minimizing API costs through token optimization
- Integrating with downstream automation tools

## Synchronization

Both modes reference the same source of truth:
- **Lane definitions and caps** are identical
- **Approval criteria** match exactly
- **Scoring formulas** produce the same results
- **Label naming conventions** are consistent

Changes to rules or criteria should be propagated to **both** files to maintain equivalence.

## Migration Between Modes

If you need to switch contexts:

**From Chat to Automation:**
- Extract the structured decision (JSON) from the conversation
- Apply labels and project status programmatically via `gh` CLI or API

**From Automation to Chat:**
- Review the JSON output from the automation
- Use the human-readable review comment as context
- Continue discussion based on the automated assessment

## Implementation Details

### Workflow Integration

1. **Issue Intake (Automated)**
   - Workflow: `.github/workflows/issue-intake.yml`
   - Script: `scripts/issue-intake.js` (project board setup)
   - Script: `scripts/pm-review.js` (AI assistant PM mode)
   - Uses AI Assistant PM mode for initial triage

2. **Lane Rebalancing (Automated)**
   - Workflow: `.github/workflows/rebalance-on-close.yml`
   - Script: `scripts/rebalance-lanes.js`
   - Uses scoring logic consistent with both modes

3. **Manual Review (Chat)**
   - Script: `scripts/pm-review-local.js`
   - Uses Project Manager mode for interactive sessions

## Best Practices

1. **Consistency First**: Always apply the same criteria regardless of mode
2. **Document Changes**: Update both mode files when rules change
3. **Validate Equivalence**: Test that both modes produce similar decisions for the same issue
4. **Token Budget**: Use AI Assistant mode for automation; save Project Manager mode for human interactions
5. **Audit Trail**: Both modes should reference the issue in comments for traceability

## See Also

- [Project Manager Mode Details](./project-manager.md)
- [AI Assistant PM Mode Details](./ai-assistant-pm.md)
- [PM Review Prompt](../pm-review.md)
- [Issue Intake Script](../../../scripts/issue-intake.js)
- [Rebalance Lanes Script](../../../scripts/rebalance-lanes.js)
