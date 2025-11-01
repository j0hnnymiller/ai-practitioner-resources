# GitHub Issues: Markdown-First Process

**MANDATORY**: Always create markdown file first, then GitHub issue.

## Process

1. **Stage 1**: Create markdown file with issue content
2. **Stage 2**: Create GitHub issue from markdown file

Benefits: Version control, review process, consistency, automation support

## Required Template Structure

```markdown
---
name: "Issue Name"
title: "Category: Issue Title"
labels: ["type", "priority", "area"]
milestone: "version"
priority: "high|medium|low"
estimated_hours: X
---

## Problem Statement

Clear description of issue/requirement.

## Proposed Solution

Detailed solution explanation.

## Technical Implementation

Step-by-step plan with sub-tasks.

## Acceptance Criteria

- [ ] Specific testable requirements

## Related Issues

- Closes #X / Related to #Y

## Testing Requirements

- [ ] Test types needed
```

## Directory Structure

```
.github/
├── issue_templates/  # Ready for issue creation
├── issue_drafts/     # Awaiting review
└── issue_archive/    # Completed issues
```

Create directories: `New-Item -ItemType Directory -Force -Path ".github\issue_templates",".github\issue_drafts",".github\issue_archive"`

## Implementation Steps

### Stage 1: Create Markdown File

1. **Choose Type**: feature|bug|docs|maintenance|testing
2. **Name File**: `[category]-[description].md` (e.g., `feature-add-dark-mode.md`)
3. **Location**: Draft in `issue_drafts/`, move to `issue_templates/` when ready
4. **Complete Sections**: Problem, Solution, Implementation, Acceptance Criteria
5. **Validate**: Check YAML frontmatter and required fields

### Stage 2: Create GitHub Issue

1. **Review & Approve**: Get markdown file reviewed
2. **Move File**: `Move-Item "issue_drafts\file.md" "issue_templates\"`
3. **Create Issue**:
   - **GitHub CLI**: `gh issue create --body-file "file.md" --title "Title" --label "labels"`
   - **Manual**: Copy content to GitHub UI (exclude frontmatter)
4. **Archive**: Move to `issue_archive/` or rename with issue number

## Labels

**Category**: feature, enhancement, bug, documentation, maintenance, testing
**Priority**: priority-critical, priority-high, priority-medium, priority-low
**Status**: status-draft, status-ready, status-in-progress, status-review, status-blocked

Usage: `labels: ["feature", "priority-medium", "status-ready"]`

## Automation

**Bulk Creation**: Loop through templates with `gh issue create --body-file`
**Validation**: Check frontmatter exists, parse YAML, verify required fields (name, title, labels)
**Rate Limiting**: Add 2-second delays between API calls

## Quality Requirements

**Content**: Clear problem/solution, step-by-step implementation, specific acceptance criteria
**Technical**: Valid YAML, required fields, proper labels, issue references, time estimates
**Format**: Proper markdown, consistent style, actionable checkboxes

**Avoid**: Direct GitHub creation, missing frontmatter, vague descriptions, no acceptance criteria
**Required**: Markdown-first approach, review process, complete metadata, specific requirements

## Troubleshooting

**YAML Errors**: Test with `($content -split '---')[1] | ConvertFrom-Yaml`
**Missing Labels**: Check with `gh label list`, create with `gh label create "name"`
**Permissions**: Verify with `gh auth status`, re-auth with `gh auth login --scopes repo`

## Templates

**Feature Example**:

```markdown
---
title: "Enhancement: Add Search Feature"
labels: ["feature", "ui/ux"]
priority: "high"
estimated_hours: 12
---

## Problem Statement

Users cannot search resources easily.

## Proposed Solution

Client-side search with filters and real-time results.

## Technical Implementation

1. Add search UI components
2. Implement search logic with fuzzy matching
3. Integrate with existing interface

## Acceptance Criteria

- [ ] Real-time search functionality
- [ ] Filter by type and category
- [ ] Highlight matching terms
```

**Bug Example**:

```markdown
---
title: "Bug: Mobile Navigation Not Responsive"
labels: ["bug", "critical", "mobile"]
estimated_hours: 4
---

## Problem Statement

Navigation menu unusable on mobile devices.

## Proposed Solution

Fix CSS media queries and add hamburger menu.

## Acceptance Criteria

- [ ] Proper mobile display
- [ ] Working hamburger menu
- [ ] No horizontal scrolling
```

## Key Benefits

**Consistency**: Standardized format across all issues
**Traceability**: Version-controlled issue content
**Quality**: Review process prevents poor issues
**Automation**: Scripts can process markdown files
**Documentation**: Complete issue history preserved

**REMEMBER**: Markdown file first, then GitHub issue. Two-stage process is mandatory.
