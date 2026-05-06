# Path Test Issue Schema

> Draft: 2026-05-05
> Purpose: define the machine-readable structure used to generate and execute workflow path test issues

---

## Goal

Each workflow path test issue should have two synchronized forms:

1. A rendered issue body for humans to read and audit.
2. A machine-readable payload for the harness to execute deterministically.

The machine-readable payload is the execution source of truth.

---

## Storage Model

Every path definition should be stored as structured data before issue creation.

Current sources:

- `docs/transition-catalog.json` for transition metadata
- `scripts/generate-path-artifacts.js` to generate the catalog and seed together from the state diagram
- `scripts/create-path-issues.ps1` to render GitHub issue bodies from the generated seed

Every created GitHub issue should render the same information in prose sections so the path remains inspectable without the generator.

Current implementation:

- `npm run generate:path-artifacts` regenerates `docs/transition-catalog.json` and `docs/path-test-issues.seed.json` together from the Mermaid state diagram.
- `npm run validate:path-artifacts` verifies the checked-in diagram, catalog, and seed are internally consistent.
- `scripts/create-path-issues.ps1` renders issue bodies only from the generated seed file.

---

## Required Top-Level Fields

```json
{
  "schemaVersion": 1,
  "pathId": "path-001",
  "pathNumber": 1,
  "title": "[Workflow Path Test] Auto_Abandoned via Validation Failure",
  "labels": ["workflow-path-test", "on the bench"],
  "entryState": "Issue_Created",
  "exitState": "Auto_Abandoned",
  "closeReason": "not_planned",
  "transitionClassSummary": {
    "real": 2,
    "manual": 1,
    "simulated": 2
  },
  "implementationPrompt": {
    "id": "impl-001",
    "summary": "Create a file with deterministic content when the issue reaches At_Bat.",
    "executor": "harness",
    "applyWhenState": "At_Bat",
    "steps": [
      {
        "type": "create_file",
        "path": "tmp/path-001.txt",
        "content": "path-001 reached At_Bat"
      }
    ]
  },
  "actors": {
    "submitter": "simulated",
    "maintainer": "simulated",
    "harness": "simulated"
  },
  "steps": []
}
```

---

## Step Schema

Each path step should use this structure.

```json
{
  "stepNumber": 4,
  "fromState": "Validation_Failed",
  "trigger": "request details",
  "toState": "Needs_Details",
  "transitionClass": "A",
  "verificationMode": "real workflow",
  "actor": "harness",
  "expected": {
    "issueState": "open",
    "labelsPresent": ["needs-details"],
    "labelsAbsent": ["implementation ready"],
    "projectStatus": "Todo",
    "workflow": {
      "name": "Issue Intake",
      "conclusion": "success"
    }
  },
  "actions": [
    {
      "type": "create_comment",
      "body": "Harness note: step 4 expects the intake workflow to request additional details."
    }
  ],
  "notes": "This step is backed by issue-intake.yml."
}
```

---

## Transition Class Rules

### Class A Steps

- Must identify the expected workflow name or owning script.
- Must specify the repository event that triggers execution.
- Must define observable postconditions.
- Must not rely on prose-only instructions.

### Class B Steps

- Must identify the acting role: `submitter`, `maintainer`, or `github-native`.
- Must specify the exact simulated action the harness performs.
- Must specify the repository artifact that proves the action happened.

Examples:

- issue body edit by submitter
- approval review by maintainer
- changes-requested review by maintainer
- merge-linked issue closure by GitHub

### Class C Steps

- Must be marked `verificationMode: simulated`.
- Must include the harness action used to represent the transition.
- Must emit repository evidence such as a comment or report entry.

Examples:

- simulated auto-fix round
- simulated escalation node
- simulated manual close decision

---

## Actor Instructions

Every path definition should include explicit actor instructions for any non-automatic step.

Recommended structure:

```json
{
  "actorInstructions": [
    {
      "actor": "submitter",
      "whenStep": 5,
      "action": "edit_issue_body",
      "summary": "Add the missing reproduction steps and environment details.",
      "payload": {
        "appendMarkdown": "## Updated Details\n\nAdded missing reproduction steps."
      }
    },
    {
      "actor": "maintainer",
      "whenStep": 12,
      "action": "submit_review",
      "summary": "Approve the PR after all automated checks pass.",
      "payload": {
        "reviewEvent": "APPROVE",
        "reviewBody": "Simulated maintainer approval for path coverage."
      }
    }
  ]
}
```

Rules:

- Actor instructions must be rendered in the issue body.
- The harness must execute the machine-readable instruction, not scrape the prose.
- The prose and the structured payload must describe the same action.

---

## Implementation Prompt Schema

If a path can reach `At_Bat`, it must define an implementation prompt.

Recommended structure:

```json
{
  "implementationPrompt": {
    "id": "impl-007",
    "summary": "Create a deterministic file to prove At_Bat execution.",
    "executor": "harness",
    "applyWhenState": "At_Bat",
    "promptText": "Create the file tmp/impl-007.txt with the exact contents 'implementation prompt executed'.",
    "steps": [
      {
        "type": "create_file",
        "path": "tmp/impl-007.txt",
        "content": "implementation prompt executed"
      },
      {
        "type": "git_commit",
        "message": "test: execute implementation prompt impl-007"
      },
      {
        "type": "open_pr",
        "title": "test: execute implementation prompt impl-007",
        "body": "Closes #<issue-number>"
      }
    ]
  }
}
```

Rules:

- `promptText` is rendered verbatim in the GitHub issue body.
- `steps` are used by the harness for deterministic execution.
- The schema must permit minimal prompts, but they must still produce an observable code change.

---

## Review-Loop Simulation Schema

Paths that require extra changes after review should define a simulated follow-up change loop.

```json
{
  "reviewLoop": {
    "enabled": true,
    "triggerAfterStep": 9,
    "mode": "simulated",
    "commentTemplate": "Harness simulation: an additional change is required before the next review round.",
    "followUpPrompt": "Append the line 'follow-up change applied' to tmp/impl-007.txt.",
    "followUpSteps": [
      {
        "type": "append_file",
        "path": "tmp/impl-007.txt",
        "content": "\nfollow-up change applied"
      },
      {
        "type": "git_commit",
        "message": "test: apply simulated review follow-up"
      },
      {
        "type": "push_branch"
      }
    ]
  }
}
```

Rules:

- Use this only when no first-class repository automation performs the extra change loop.
- The PR comment must clearly state that the loop is simulated.
- Reports must count this as `simulated`, not `real workflow`.

---

## Rendered Issue Body Requirements

The generated GitHub issue body should include these sections in order:

1. Path metadata
2. Steps
3. Expected labels and project status changes
4. Actor instructions
5. Implementation prompt
6. Exit conditions
7. Verification mode summary
8. Checklist

Recommended headings:

- `## Path`
- `## Steps`
- `## Labels`
- `## Actor Instructions`
- `## Implementation Prompt`
- `## Exit`
- `## Verification`

---

## Minimum Valid Path Definition

A valid path definition must satisfy all of the following:

- has a stable `pathId`
- identifies entry and exit state
- classifies every step as `A`, `B`, or `C`
- defines a verification mode for every step
- defines actor instructions for every manual or simulated human action
- defines an implementation prompt if the path can reach `At_Bat`
- can be rendered into a GitHub issue body without losing execution data

---

## Current Integration Status

The hardcoded issue bodies in `scripts/create-path-issues.ps1` have been replaced. The current integration path is:

1. Update `.github/workflows/ISSUE_LIFECYCLE_STATE_DIAGRAM.md`.
2. Run `npm run generate:path-artifacts`.
3. Run `npm run validate:path-artifacts`.
4. Run `pwsh -File scripts/create-path-issues.ps1` to create workflow path issues from the generated seed.
