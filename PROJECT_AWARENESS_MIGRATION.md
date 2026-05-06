# Transition Automation Implementation Plan

> Generated: 2026-05-05
> Scope: automate test coverage for all issue and PR lifecycle transitions in the repository state machine

---

## Goal

Build a test system that can verify every lifecycle transition in one of three ways:

1. Real automation test: trigger the repository workflow and assert its result.
2. GitHub-native/manual contract test: assert the required human or platform action occurred.
3. Model-only transition test: keep the transition in the documented path matrix, but mark it as simulated until real automation exists.

The immediate target is not to force every state-machine edge into a GitHub Action. The target is to make every transition explicitly classified, testable, and reported.

---

## Current Constraint Summary

The current repository has two separate testing modes:

- `workflow-path-test` issues: synthetic path replay driven by `scripts/drive-path-test.js`
- `[TI]` test issues: real issue events routed into the Workflow Testing project

That split is useful, but incomplete:

- The synthetic path driver verifies labels, project status, and terminal state, but it does not verify that production workflows fired.
- The `[TI]` flow can exercise real issue automation, but only for transitions that are backed by actual repository triggers.
- Several state-machine transitions are abstractions, manual gates, or GitHub-native side effects rather than first-class repository automations.

---

## Transition Classes

Every transition in the state machine should be assigned to exactly one class.

### Class A: Real Repository Automation

Definition: the transition is caused by a workflow or script that already exists in this repository.

Examples:

- issue opened or edited -> intake re-runs
- issue closed -> rebalance workflow runs
- pull request opened or synchronized -> AI review workflow runs
- pull request review approved -> auto-merge workflow runs

### Class B: Manual or GitHub-Native Transition

Definition: the transition is real, but the repository does not own the execution engine.

Testing rule: these transitions should be documented in the test issue, then simulated by the harness using the same observable artifacts a human or GitHub would create.

Examples:

- maintainer approves or rejects a PR review
- developer pushes commits after review feedback
- GitHub closes linked issues after merge
- a user edits an issue body to satisfy `needs-details`

Required simulation behavior:

- Maintainer actions must be written into the test issue as expected decision points and simulated when the path reaches them.
- Issue submitter actions must also be simulated rather than assumed.
- Any issue that may reach `At_Bat` must contain an implementation prompt that can be executed when work begins.
- The implementation prompt may be minimal, such as creating a file with specific content, but it must be concrete enough to produce a test PR.
- Paths that include `needs-details` must start with an intentionally incomplete issue body and later simulate the submitter updating the issue with the missing details.

### Class C: Diagram-Only or Simulated Transition

Definition: the transition is modeled in the state machine, but there is no distinct executable workflow or platform event implementing it yet.

Testing rule: these transitions should be simulated deliberately and leave explicit repository evidence showing what was simulated and why.

Examples:

- AI auto-fix attempt rounds
- explicit escalation decision node as a separate executable unit
- lane monitor states like `Bench_Check`, `Hole_Check`, `Deck_Check`
- manual close check as a distinct gate

Required simulation behavior:

- If a path requires additional changes after code review, the harness should add a PR comment after the review result to force another change cycle when the repository automation does not create that cycle itself.
- Manual operations inside Class C paths must also be simulated and recorded.
- Simulated transitions must emit comments, labels, or report entries that distinguish them from real workflow executions.

---

## Target Architecture

The finished testing system should have three coordinated layers.

### Layer 1: Transition Catalog

Create a machine-readable catalog of every transition with these fields:

- transition id
- from state
- to state
- trigger type
- transition class (`A`, `B`, or `C`)
- owning workflow or script, if any
- test strategy
- required fixture type
- expected observable effects
- implementation prompt reference, when the path can reach `At_Bat`

Recommended file:

- `docs/transition-catalog.json`
- `docs/path-test-issue-schema.md`

This becomes the single source of truth for what is actually testable and how.

Implementation prompt storage rule:

- The human-readable implementation prompt must appear in the test issue body so a reviewer can understand what work should occur at `At_Bat`.
- The same prompt must also exist in a machine-readable field in the path issue schema or transition catalog so the harness can execute it deterministically.
- The machine-readable form is the execution source of truth; the issue body is the audit-friendly rendering of that same data.

### Layer 2: Real Automation Harness

Use `[TI]` issues and test PRs to trigger actual repository workflows for all Class A transitions.

Core components:

- issue/PR fixture creator
- workflow-run observer
- state verifier
- result recorder

Recommended scripts:

- `scripts/transition-test-runner.js`
- `scripts/lib/workflow-run-observer.js`
- `scripts/lib/transition-verifier.js`
- `scripts/lib/test-fixtures.js`

### Layer 3: Contract and Simulation Harness

For Class B and Class C transitions, add explicit test adapters that record how the transition is verified.

- Class B: simulate maintainer or submitter actions, then verify comments, labels, assignments, merge state, linked issue closure, review state, or issue edits
- Class C: replay transition in simulation mode, force additional change cycles where needed, and clearly mark the result as `simulated`

This preserves full path coverage without pretending every state is currently automated.

Each generated test issue should include:

- the expected path steps
- the simulated maintainer and submitter actions for that path
- the implementation prompt to execute if the issue reaches `At_Bat`
- the verification mode for each step
- the machine-readable execution metadata required for the harness to replay the path without re-parsing prose

---

## Implementation Phases

## Phase 1 - Build the Transition Inventory

Outcome: a definitive map of all transitions and their implementation status.

Tasks:

1. Extract every edge from `.github/workflows/ISSUE_LIFECYCLE_STATE_DIAGRAM.md`.
2. Classify each edge as Class A, B, or C.
3. Record the owning implementation for Class A edges.
4. Record the observable artifact for Class B edges.
5. Mark unsupported Class C edges as simulated.

Deliverables:

- `docs/transition-catalog.json`
- `docs/transition-catalog.md`
- `docs/path-test-issue-schema.md`

Exit criteria:

- Every path-test step maps to a catalog entry.
- No transition remains unclassified.

## Phase 2 - Add Workflow Run Observation

Outcome: the test harness can prove whether a workflow actually ran and how it concluded.

Tasks:

1. Add a workflow-run observer that queries Actions runs by workflow name, event, branch, issue or PR reference, and start time.
2. Capture a pre-trigger timestamp before mutating an issue or PR.
3. Wait for the expected workflow run to appear.
4. Fail the test if no matching run appears within the timeout.
5. Fail the test if the run conclusion is not `success`.

Transitions covered first:

- `Issue_Created -> Auto_Validation`
- `Needs_Details -> Auto_Validation`
- `Closed issue -> rebalance`
- `PR_Created -> Stage_1_PR_Format`
- `Approved review -> Stage_6_Merge`

Deliverables:

- `scripts/lib/workflow-run-observer.js`
- reusable polling utilities and timeout config

Exit criteria:

- A test can reliably prove that intake, rebalance, AI review, and auto-merge workflows actually ran.

## Phase 3 - Replace Synthetic Checks for Class A Transitions

Outcome: real automations are tested through actual repository events instead of direct state mutation.

Tasks:

1. Create a new transition runner for Class A edges using `[TI]` issues and test PRs.
2. Keep `scripts/drive-path-test.js` only for synthetic or simulated transitions.
3. For each real transition, trigger the actual event instead of directly applying labels or closing issues.
4. Verify both workflow success and side effects.

Examples:

- Instead of adding `needs-details` directly, create an incomplete `[TI]` issue and wait for intake.
- Instead of setting final closed state directly, merge an approved PR and verify linked issue closure.
- Instead of changing lane labels directly, close a qualifying issue and verify the rebalance workflow changed project status or lane labels.

Deliverables:

- `scripts/transition-test-runner.js`
- `scripts/lib/issue-fixtures.js`
- `scripts/lib/pr-fixtures.js`

Exit criteria:

- Every Class A transition has at least one real automation test.

## Phase 4 - Add Contract Tests for Class B Transitions

Outcome: manual and GitHub-native transitions are tested through observable contracts.

Tasks:

1. Define the required artifacts for each manual transition.
2. Extend the path-issue schema so each Class B path contains simulated maintainer actions, simulated submitter actions, and an implementation prompt for the `At_Bat` phase.
3. Add harness actions that perform those simulations by editing issues, posting comments, creating reviews, or updating PRs.
4. Add assertions for review state, assignment, merge status, linked issue closure, issue edits, and label movement.
5. Record these tests separately from fully automated runs.

Examples:

- Maintainer approval exists as a submitted PR review with `APPROVED`
- Requested changes exists as a PR review with `CHANGES_REQUESTED`
- Linked issue closure occurs after merge because the PR body contains `Closes #NNN`
- A `needs-details` path starts with a deficient issue and later simulates the submitter updating the issue body with the missing fields
- An `At_Bat` path executes the issue's implementation prompt to create a concrete repository change and PR

Deliverables:

- `docs/manual-transition-contracts.md`
- `docs/path-test-issue-schema.md`
- contract verifiers in `scripts/lib/transition-verifier.js`
- path issue schema updates in the generated seed consumed by `scripts/create-path-issues.ps1`

Exit criteria:

- Every Class B transition has a documented assertion strategy.
- Every Class B path defines who acts, what they do, and how the simulation is performed.

## Phase 5 - Mark and Report Simulated Transitions

Outcome: diagram-only transitions remain visible without being misrepresented as automated.

Tasks:

1. Update the path-test generator to tag simulated transitions in issue bodies.
2. For review-loop paths, add harness support for posting a follow-up PR comment that forces an additional code change when the repository does not create that change request itself.
3. Make the path runner report `real`, `manual`, or `simulated` per step.
4. Separate pass totals by transition class.
5. Fail only on real or manual contract regressions unless simulation data is malformed.

Recommended body annotation:

- `Verification: real workflow`
- `Verification: manual contract`
- `Verification: simulated`
- `Actor: submitter|maintainer|harness`
- `Implementation prompt: <prompt text>`

Exit criteria:

- Test reports no longer imply that simulated transitions were automated.
- Simulated review-loop and manual-operation paths leave explicit repository evidence explaining the simulated action.

## Phase 6 - Unify Reporting

Outcome: one report shows transition coverage, test mode, and verification depth.

Tasks:

1. Emit a run report with totals by transition class.
2. Emit coverage by path and by transition.
3. Show missing automations as backlog items.
4. Publish the report as an artifact from a dedicated workflow.

Recommended workflow:

- `.github/workflows/test-transitions.yml`

Recommended report outputs:

- `automation-results/transition-test-report-<timestamp>.md`
- `automation-results/transition-test-report-<timestamp>.json`

---

## Initial Transition Coverage Target

These transitions should be automated first because they already map to real repository events.

### Priority 1

- `Issue_Created -> Auto_Validation`
- `Auto_Validation -> Needs_Details`
- `Needs_Details -> Auto_Validation`
- `Needs_Details -> Auto_Abandoned`
- `Issue closed -> rebalance`
- `PR_Created -> Stage_1_PR_Format`
- `Stage_1_PR_Format -> Stage_2_AI_Review`
- `Stage_2_AI_Review -> escalated label or approval-ready labels`
- `pull_request_review approved -> merge`

### Priority 2

- `PM_Triage -> lane assignment`
- `Stage_3_Acceptance -> ac-verified or ac-not-met`
- `Stage_4_CI_CD -> success or failure signals`
- `Stage_5_Human -> awaiting-approval removed or merge triggered`
- submitter update paths for `needs-details`
- maintainer decision paths for approval, rejection, and changes requested

### Priority 3

- synthetic coverage cleanup for round-by-round AI states
- implementation-prompt execution for `At_Bat` paths
- simulated PR comment loops to force additional changes after review
- explicit reporting for simulated lane-monitor states
- unified path and transition dashboard

---

## Required Refactors

These refactors should happen before broad rollout.

1. Make all workflow-testing scripts project-aware by target project number or project id.
2. Stop using `workflow-path-test` issues as the source for real automation verification.
3. Separate issue fixtures from assertions so one fixture can drive multiple transitions.
4. Add stable naming for workflow runs and emitted comments where possible.
5. Standardize labels used as test observables.
6. Extend path issues to carry actor instructions and implementation prompts.
7. Add harness support for simulating issue edits, PR reviews, and forced follow-up code changes.
8. Store execution instructions in both rendered issue text and machine-readable metadata.

---

## Verification Strategy

Each tested transition should verify three things when applicable:

1. The triggering event was emitted.
2. The expected workflow ran and completed successfully.
3. The expected repository state changed.

Example assertion set for intake:

- create incomplete `[TI]` issue
- observe `issue-intake.yml` run after creation time
- assert run conclusion is `success`
- assert issue has `needs-details`
- assert Workflow Testing project assignment remains correct
- simulate the submitter updating the issue with the missing details
- observe the next intake run and assert `needs-details` is removed

Example assertion set for auto-merge:

- create test PR with linked issue
- wait for AI review and acceptance checks to succeed
- submit approval review
- observe `auto-merge.yml` run
- assert PR is merged
- assert linked issue is closed

Example assertion set for simulated review-loop path:

- create test PR from the issue's implementation prompt
- wait for review output that requires another change
- post a harness comment describing the required follow-up change
- apply the follow-up repository change and push
- observe the next review cycle or simulated transition record
- assert the report marks the extra loop as `simulated` when no first-class automation owns it

---

## Success Criteria

This initiative is complete when all of the following are true:

1. Every state-machine transition is classified as real, manual, or simulated.
2. Every real transition has an executable automated test.
3. Every manual transition has a contract-based verification rule.
4. Every simulated transition is clearly marked in reports.
5. Every path issue includes actor instructions and an implementation prompt when the path can reach `At_Bat`.
6. The Workflow Testing guide points to a real implementation plan and matching runner.

---

## Recommended Execution Order

1. Build the transition catalog.
2. Add workflow-run observation.
3. Convert intake and rebalance tests first.
4. Add PR-path verification next.
5. Reclassify remaining synthetic transitions.
6. Publish unified reports.
