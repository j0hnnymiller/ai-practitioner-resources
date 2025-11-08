# PM System Documentation Index

This directory contains comprehensive documentation for the Project Manager (PM) system used in the AI Practitioner Resources project.

## Quick Navigation

### Core Concepts

- **[PM Modes Overview](./modes/PM_MODES_OVERVIEW.md)** - Explains the two PM modes and their relationship
  - Project Manager (Chat Mode) - For human interaction
  - AI Assistant PM (Automation Mode) - For GitHub Actions

### Implementation Guides

- **[Error Handling Guide](./ERROR_HANDLING_GUIDE.md)** - Retry logic and recovery strategies
  - Anthropic API retry implementation
  - Exponential backoff patterns
  - Fallback mechanisms
  - Monitoring and debugging

- **[Label Validation Guide](./LABEL_VALIDATION_GUIDE.md)** - Automated label validation rules
  - Required labels (type, size, priority, independence, risk, lane, readiness)
  - Validation rules and error messages
  - Automated remediation strategies
  - Reporting and metrics

- **[Independence Guide](./INDEPENDENCE_GUIDE.md)** - Determining issue independence
  - File-level independence criteria
  - Component-level boundaries
  - API/interface independence
  - Dependency analysis
  - Scoring system (0-5)
  - Handling inconsistent assessments

- **[Prompt Architecture Migration Guide](./PROMPT_ARCHITECTURE_MIGRATION_GUIDE.md)** - Separating logic from execution
  - Pattern: prompts = logic, scripts = execution
  - Migration strategy for `issue-intake.js` and `rebalance-lanes.js`
  - Testing and validation approaches
  - Rollout plan

## Document Structure

```
.github/prompts/
├── README.md (this file)
├── PM_MODES_OVERVIEW.md
├── ERROR_HANDLING_GUIDE.md
├── LABEL_VALIDATION_GUIDE.md
├── INDEPENDENCE_GUIDE.md
├── PROMPT_ARCHITECTURE_MIGRATION_GUIDE.md
├── modes/
│   ├── project-manager.md          # Chat mode prompt
│   ├── ai-assistant-pm.md          # Automation mode prompt
│   └── code-reviewer.md
├── pm-review.md                     # PM review prompt
├── issue-intake-testing.md
└── ... (other prompts)
```

## Common Tasks

### Understanding the PM System

1. Start with **[PM Modes Overview](./modes/PM_MODES_OVERVIEW.md)** to understand the dual-mode architecture
2. Review **[Project Manager Mode](./modes/project-manager.md)** for detailed rules and criteria
3. Check **[AI Assistant PM Mode](./modes/ai-assistant-pm.md)** for automation specifics

### Implementing Error Handling

1. Read **[Error Handling Guide](./ERROR_HANDLING_GUIDE.md)** for retry patterns
2. Review `scripts/pm-review.js` for reference implementation
3. Apply retry logic to your API calls using `callAnthropicWithRetry`

### Validating Labels

1. Review **[Label Validation Guide](./LABEL_VALIDATION_GUIDE.md)** for complete rules
2. Implement validation checks in your scripts
3. Use automated remediation for common issues

### Assessing Independence

1. Read **[Independence Guide](./INDEPENDENCE_GUIDE.md)** for criteria
2. Use the scoring system (0-5) for objectivity
3. Document reasoning for independence assessments
4. Use `scripts/check-independence.js` (future) for automation

### Migrating Scripts to Prompt Architecture

1. Study **[Prompt Architecture Migration Guide](./PROMPT_ARCHITECTURE_MIGRATION_GUIDE.md)**
2. Follow the phase-based migration strategy
3. Test for equivalence before full rollout
4. Use `scripts/pm-review.js` as reference implementation

## Key Principles

### 1. Consistency

All PM modes and scripts implement the same core rules:
- Lane management (4 lanes with capacity limits)
- Approval gate ("implementation ready" label)
- Independence requirements for parallelization
- Priority scoring formula
- Required label categories

### 2. Separation of Concerns

- **Prompts** contain business logic (rules, criteria, formulas)
- **Scripts** contain execution logic (API calls, data transformation)
- This separation enables easy updates and testing

### 3. Fail-Safe Design

- Graceful degradation when APIs are unavailable
- Fallback to default behavior
- Comprehensive error handling with retries
- Clear error messages and recovery options

### 4. Transparency

- All rules documented in human-readable markdown
- Git history tracks rule evolution
- Non-engineers can review and propose changes

### 5. Automation-First

- Rules designed for AI consumption
- Structured output formats (JSON)
- Token optimization for cost efficiency
- Batch operation support

## Implementation Status

| Component | Status | Documentation |
|-----------|--------|---------------|
| PM Review (pm-review.js) | ✅ Complete | ERROR_HANDLING_GUIDE.md |
| Issue Intake (issue-intake.js) | ⬜ Needs Migration | PROMPT_ARCHITECTURE_MIGRATION_GUIDE.md |
| Rebalance Lanes (rebalance-lanes.js) | ⬜ Needs Migration | PROMPT_ARCHITECTURE_MIGRATION_GUIDE.md |
| Label Validation | ⬜ Not Implemented | LABEL_VALIDATION_GUIDE.md |
| Independence Check | ⬜ Not Implemented | INDEPENDENCE_GUIDE.md |

## Related Documentation

### Scripts
- [Scripts README](../../scripts/README.md) - Overview of automation scripts
- [Session Management](../../scripts/SESSION_MANAGEMENT_README.md) - Session handling

### Workflows
- [Issue Intake Workflow](../workflows/issue-intake.yml) - Automated intake
- [Rebalance on Close](../workflows/rebalance-on-close.yml) - Lane rebalancing

### General
- [Repository README](../../README.md) - Project overview
- [Contributors Guide](../../CONTRIBUTORS.md) - Contribution process
- [Copilot Instructions](../copilot-instructions.md) - AI agent instructions

## Contributing

When updating PM system documentation:

1. **Update all affected documents** - Changes to rules should be reflected in both PM modes
2. **Test for equivalence** - Ensure both modes produce consistent results
3. **Update examples** - Provide concrete examples for new rules
4. **Cross-reference** - Add links in "See Also" sections
5. **Version control** - Document breaking changes in commit messages

## Questions and Support

- **Issues with PM review?** See [Error Handling Guide](./ERROR_HANDLING_GUIDE.md)
- **Label questions?** See [Label Validation Guide](./LABEL_VALIDATION_GUIDE.md)
- **Independence disputes?** See [Independence Guide](./INDEPENDENCE_GUIDE.md)
- **Migration help?** See [Prompt Architecture Migration Guide](./PROMPT_ARCHITECTURE_MIGRATION_GUIDE.md)

For general questions, create an issue with the `documentation` label.
