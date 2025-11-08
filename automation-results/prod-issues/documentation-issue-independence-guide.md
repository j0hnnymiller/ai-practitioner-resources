### Description

Create comprehensive documentation explaining the criteria and examples for determining whether issues are "independent" versus "dependent" in the context of parallel implementation.

### Problem

The project-manager mode and PM review process heavily rely on the concept of "independence" to determine if issues can be worked on simultaneously without merge conflicts. However, there's no clear documentation defining:

- What makes an issue "independent" vs "dependent"
- Concrete examples of independent issues
- Concrete examples of dependent issues
- How to evaluate file/component overlap
- Edge cases and gray areas
- Impact on lane assignment decisions

This ambiguity leads to:

- Inconsistent independence assessments
- Potential merge conflicts from incorrectly classified independent issues
- Uncertainty when manually reviewing or overriding PM decisions
- Difficulty training new contributors on the system

### Proposed Solution

Create `docs/ISSUE_INDEPENDENCE_GUIDE.md` with comprehensive guidance on evaluating issue independence.

### Acceptance Criteria

**Core Documentation:**

- [ ] Definition of "independent" and "dependent" issues
- [ ] List of factors that determine independence
- [ ] Decision tree or flowchart for independence evaluation
- [ ] Section on component/file path analysis
- [ ] Section on API surface area conflicts
- [ ] Section on shared resource conflicts (database schema, config files, etc.)

**Examples Section:**

- [ ] At least 5 examples of clearly independent issues with rationale
- [ ] At least 5 examples of clearly dependent issues with rationale
- [ ] At least 3 examples of gray-area cases with guidance
- [ ] Real examples from this repository where possible

**Integration:**

- [ ] Linked from README.md
- [ ] Linked from `.github/prompts/modes/project-manager.md`
- [ ] Linked from `.github/prompts/pm-review.md`
- [ ] Includes references to actual code paths in the repository

**Visual Aids:**

- [ ] Diagram showing repository structure and natural boundaries
- [ ] Table of common conflict scenarios and independence assessment
- [ ] Flowchart for independence decision-making

### Content Outline

```markdown
# Issue Independence Guide

## 1. Definition

### Independent Issues

Issues are independent if they can be implemented simultaneously by different contributors without creating merge conflicts or requiring coordination.

### Dependent Issues

Issues are dependent if implementing them simultaneously would result in:

- Merge conflicts in the same files
- API contract mismatches
- Shared resource contention
- Logical ordering requirements

## 2. Evaluation Factors

### Primary Factors (High Impact)

1. **File Overlap**: Do issues modify the same files?
2. **Component Boundaries**: Do issues touch the same components?
3. **API Surface**: Do issues change the same public interfaces?
4. **Shared Resources**: Do issues modify the same configs/schemas?

### Secondary Factors (Medium Impact)

5. **Feature Coupling**: Are features logically related?
6. **Test Coverage**: Do issues require the same test modifications?
7. **Documentation**: Do issues update the same docs?

### Contextual Factors (Case-by-case)

8. **Team Knowledge**: Who can implement which issues?
9. **Urgency**: Time-sensitive dependencies
10. **Technical Debt**: Refactoring requirements

## 3. Decision Framework

[Flowchart: Is Issue X independent of Issue Y?]
```

Start
↓
Do they modify the same files? → YES → DEPENDENT
↓ NO
Do they modify the same component? → YES → Review deeper
↓ NO ↓
Do they change the same APIs? → YES → DEPENDENT
↓ NO ↓
Do they share resources? → YES → DEPENDENT
↓ NO ↓
INDEPENDENT ← ← ← ← ← ← ← ← ← ← NO

```

## 4. Repository Structure

### This Repository's Natural Boundaries

```

ai-practitioner-resources/
├── index.html # Main viewer (UI component)
├── scripts/ # Automation (Backend component)
│ ├── pm-review.js # PM review logic
│ ├── rebalance-lanes.js # Lane management
│ └── issue-intake.js # Issue processing
├── src/ # Frontend modules
│ ├── components/ # UI components
│ ├── services/ # API services
│ └── utils/ # Utilities
└── .github/
├── workflows/ # GitHub Actions
└── prompts/ # AI prompts

```

**Independence by Path:**
- ✅ `scripts/` vs `src/` → INDEPENDENT
- ✅ Different `src/components/` → INDEPENDENT
- ⚠️  Same file in `scripts/` → DEPENDENT
- ⚠️  `index.html` + `src/` → POSSIBLY DEPENDENT (check CSS/JS integration)

## 5. Examples

### Clearly Independent

**Example 1: Different Scripts**
- Issue A: Enhance pm-review.js with retry logic
- Issue B: Add metrics to rebalance-lanes.js
- **Rationale**: Different files, different components, no shared logic

**Example 2: Different UI Components**
- Issue A: Add dark mode toggle to filter panel
- Issue B: Improve modal animation
- **Rationale**: Different components, different CSS, different JS modules

[... 3 more examples ...]

### Clearly Dependent

**Example 1: Same File, Different Features**
- Issue A: Refactor pm-review.js label logic
- Issue B: Add error handling to pm-review.js
- **Rationale**: Same file, high likelihood of merge conflicts

**Example 2: API Contract Change**
- Issue A: Change GitHub API authentication method
- Issue B: Add new API endpoint call
- **Rationale**: Both touch API layer, auth changes affect all calls

[... 3 more examples ...]

### Gray Areas

**Example 1: Related Features**
- Issue A: Add export button to UI
- Issue B: Add export functionality to backend
- **Assessment**: DEPENDENT if implemented simultaneously
  - Reason: Need to coordinate API contract
  - Recommendation: Implement sequentially or with tight coordination

[... 2 more examples ...]

## 6. Special Considerations

### Refactoring Issues
Large refactors are inherently low-independence:
- Touch many files
- Change APIs
- Affect multiple components
- **Recommendation**: Block other work or coordinate carefully

### Documentation Issues
Often high-independence:
- Usually modify different markdown files
- Rarely conflict with code changes
- **Exception**: API documentation that must match code changes

### Configuration Changes
Medium independence:
- Few files touched (package.json, config files)
- But: Many issues may need config changes
- **Recommendation**: Review case-by-case

## 7. How to Use This Guide

### For PM Review (Automated)
The PM review script uses independence as a scoring factor:
- `independence:high` → Issue can be parallelized
- `independence:low` → Issue should be sequenced

### For Lane Assignment (Manual)
When manually reviewing lane assignments:
1. Check current "at bat" and "on deck" issues
2. For new issue, apply this guide's decision framework
3. If independent of all active issues → Eligible for active lanes
4. If dependent on any active issue → Keep "on the bench" or "in the hole"

### For Implementation (Contributors)
Before starting work:
1. Check active lane issues
2. Evaluate independence using this guide
3. If uncertain, ask in issue comments
4. Coordinate with other contributors if needed

## 8. Updating This Guide

This guide should evolve as the project grows:
- Add new examples from actual conflicts encountered
- Refine decision framework based on experience
- Update repository structure map as it changes

## 9. Related Documentation

- [Project Manager Mode](.github/prompts/modes/project-manager.md)
- [PM Review Prompt](.github/prompts/pm-review.md)
- [Expected Workflow Behavior](docs/EXPECTED_WORKFLOW_BEHAVIOR.md)
```

### Technical Notes

**Integration Points:**

1. Reference from `project-manager.md` in the "Parallelization/independence checks" section
2. Reference from `pm-review.md` in the "Decision rubric" section
3. Add to README.md under "Understanding the Workflow"

**Visual Assets:**

- Create flowchart using Mermaid diagram syntax
- Repository structure can be rendered as tree in markdown
- Consider adding example PR/merge conflict screenshots

### Dependencies

None - documentation only.

### Risk Level

None - documentation does not change functionality.

### Size Estimate

Medium - documentation task requiring:

- 4-6 hours to write comprehensive guide
- 2-3 hours to create visual aids
- 1-2 hours to gather and document real examples from the repository
