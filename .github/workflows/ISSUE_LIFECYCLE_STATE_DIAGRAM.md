---
description: Complete state machine diagram of issue lifecycle with all paths, gates, and transitions
---

# Issue Lifecycle State Machine Diagram

## 🎯 Overview

This document provides a comprehensive Mermaid state machine diagram showing the complete lifecycle of an issue from creation through closure, including all possible paths, automated gates, manual gates, and transition criteria.

---

## 📊 Complete State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> Issue_Created: User creates issue\nwith template

    %% Initial State
    Issue_Created: Issue Created

    %% First Gate: Triage
    Issue_Created --> Auto_Validation: Issue created
    Auto_Validation: Auto Validation - Gate

    Auto_Validation --> Validation_Failed: Validation fails
    Validation_Failed: Validation Failed
    Validation_Failed --> Needs_Details: Request details
    Needs_Details: Needs Details
    Needs_Details --> Auto_Validation: User updates
    Needs_Details --> Auto_Abandoned: No response - 30d
    Auto_Abandoned: Auto Abandoned
    Auto_Abandoned --> [*]

    Auto_Validation --> Backlog: Pass validation
    Backlog: Backlog

    %% Triage Stage
    Backlog --> PM_Triage: To triage
    PM_Triage: PM Review - Manual

    PM_Triage --> Triage_Rejected: Reject
    Triage_Rejected: Triage Rejected - Out of Scope
    Triage_Rejected --> Closed_Rejected: Close
    Closed_Rejected: Issue Rejected
    Closed_Rejected --> [*]

    PM_Triage --> Assigned_Lane: Assign lane
    Assigned_Lane: Lane Assigned

    %% Lane Assignment Logic
    Assigned_Lane --> On_Bench: Low priority
    On_Bench: On The Bench

    Assigned_Lane --> In_Hole: With dependencies
    In_Hole: In The Hole

    Assigned_Lane --> On_Deck: Next in line
    On_Deck: On The Deck

    Assigned_Lane --> At_Bat: Ready now
    At_Bat: At Bat

    %% Bench Lane Flow
    On_Bench --> Bench_Check: Monitor
    Bench_Check: Bench - Waiting
    Bench_Check --> Rebalance_Bench: Rebalance trigger
    Rebalance_Bench: Rebalance
    Rebalance_Bench --> In_Hole

    %% In The Hole Flow
    In_Hole --> Hole_Check: Monitor
    Hole_Check: Hole - Waiting
    Hole_Check --> Rebalance_Hole: Rebalance trigger
    Rebalance_Hole: Rebalance
    Rebalance_Hole --> On_Deck

    %% On The Deck Flow
    On_Deck --> Deck_Check: Monitor
    Deck_Check: Deck - Waiting
    Deck_Check --> Rebalance_Deck: Rebalance trigger
    Rebalance_Deck: Rebalance
    Rebalance_Deck --> At_Bat

    %% At Bat Implementation
    At_Bat --> AC_Check: Verify AC
    AC_Check: At Bat - AC Check
    AC_Check --> Dev_Assigned: AC Ready
    AC_Check --> Needs_Prep: AC Needed
    Needs_Prep: Needs Preparation
    Needs_Prep --> AC_Check
    Dev_Assigned: Development Started

    %% Implementation Flow
    Dev_Assigned --> Dev_In_Progress: Create branch
    Dev_In_Progress: In Development

    Dev_In_Progress --> PR_Created: Create PR
    PR_Created: PR Created

    PR_Created --> Stage_1_PR_Format: Validate format
    Stage_1_PR_Format: Stage 1 - PR Format Check

    Stage_1_PR_Format --> Stage_1_Fail: Invalid
    Stage_1_Fail: PR Format Failed
    Stage_1_Fail --> Needs_PR_Update: Update PR
    Needs_PR_Update: Needs PR Update
    Needs_PR_Update --> Stage_1_PR_Format

    Stage_1_PR_Format --> Stage_2_AI_Review: Valid - Start review
    Stage_2_AI_Review: Stage 2 - Copilot Code Review

    %% Multi-Round Review
    Stage_2_AI_Review --> Review_R1: Begin review
    Review_R1: AI Review - Round 1
    Review_R1 --> Check_R1: Evaluate
    Check_R1: Review Decision R1
    Check_R1 --> AI_Comments_R1: Issues found
    Check_R1 --> AI_Approved_R1: No issues
    AI_Comments_R1: AI Review - Issues Found
    AI_Comments_R1 --> Auto_Fix_Attempt: Auto fix
    Auto_Fix_Attempt: Auto-Fix Attempt - R1 of 3
    Auto_Fix_Attempt --> Re_Review_R1: Re-review
    Re_Review_R1: Stage 2 - Code Review - R2 of 3
    Re_Review_R1 --> Check_R2: Evaluate
    Check_R2: Review Decision R2
    Check_R2 --> AI_Comments_R2: Issues found
    Check_R2 --> AI_Approved_R2: No issues

    AI_Comments_R2: AI Review - Issues Found
    AI_Comments_R2 --> Auto_Fix_Attempt_2: Auto fix
    Auto_Fix_Attempt_2: Auto-Fix Attempt - R2 of 3
    Auto_Fix_Attempt_2 --> Re_Review_R2: Re-review
    Re_Review_R2: Stage 2 - Code Review - R3 of 3
    Re_Review_R2 --> Check_R3: Evaluate
    Check_R3: Review Decision R3
    Check_R3 --> AI_Comments_R3: Issues remain
    Check_R3 --> AI_Approved_R3: No issues

    AI_Comments_R3: AI Review - Issues Found
    AI_Comments_R3 --> Escalation_Decision: Escalate after R3
    Escalation_Decision: Escalation Logic
    Escalation_Decision --> Auto_Assign_Maintainer: Assign to human
    Auto_Assign_Maintainer: Assigned to Maintainer
    Auto_Assign_Maintainer --> Stage_5_Escalated

    AI_Approved_R2 --> Stage_3_Acceptance
    AI_Approved_R1 --> Stage_3_Acceptance
    AI_Approved_R3 --> Stage_3_Acceptance

    %% Stage 3: Acceptance Criteria
    Stage_3_Acceptance: Stage 3 - Acceptance Criteria
    Stage_3_Acceptance --> AC_Check: Verify
    AC_Check: AC Check
    AC_Check --> AC_Failed: Not met
    AC_Check --> Stage_4_CI_CD: Met
    AC_Failed: AC Failed
    AC_Failed --> AC_Needs_Update: Update
    AC_Needs_Update: Needs AC Update
    AC_Needs_Update --> AC_Check

    %% Stage 4: CI/CD
    Stage_4_CI_CD: Stage 4 - CI/CD Checks
    Stage_4_CI_CD --> CI_Check: Run tests
    CI_Check: CI Check
    CI_Check --> CI_Failed: Failed
    CI_Check --> Stage_5_Human: Passed
    CI_Failed: CI/CD Failed
    CI_Failed --> CI_Needs_Fix: Fix
    CI_Needs_Fix: Needs CI/CD Fix
    CI_Needs_Fix --> CI_Check

    %% Stage 5: Human Approval
    Stage_5_Human: Stage 5 - Human Approval - Manual
    Stage_5_Escalated: Stage 5 - Human Approval - Escalated

    Stage_5_Human --> Maintainer_Review: Begin review
    Maintainer_Review: Maintainer Review
    Maintainer_Review --> Review_Decision: Decide
    Review_Decision: Approval Decision
    Review_Decision --> Approval_Rejected: Request changes
    Review_Decision --> Stage_6_Merge: Approve

    Stage_5_Escalated --> Maintainer_Review_Esc: Review escalated
    Maintainer_Review_Esc: Maintainer Review - Escalated
    Maintainer_Review_Esc --> Review_Decision_Esc: Decide
    Review_Decision_Esc: Escalation Approval Decision
    Review_Decision_Esc --> Approval_Rejected_Esc: Reject
    Review_Decision_Esc --> Stage_6_Merge: Approve

    Approval_Rejected: Changes Requested
    Approval_Rejected --> Dev_Updates: Developer updates
    Dev_Updates: Awaiting Updates
    Dev_Updates --> Maintainer_Review

    Approval_Rejected_Esc: Rejected by Maintainer
    Approval_Rejected_Esc --> PR_Closed_Rejected: Close PR
    PR_Closed_Rejected: PR Rejected
    PR_Closed_Rejected --> Closed_Failed: Redesign needed
    Closed_Failed: Issue Rejected - Design
    Closed_Failed --> [*]

    %% Stage 6: Merge
    Stage_6_Merge: Stage 6 - Merge to Main
    Stage_6_Merge --> Auto_Merge: Merge
    Auto_Merge: Merging...
    Auto_Merge --> Merged_Success: Merged
    Merged_Success: PR Merged
    Merged_Success --> Issue_Complete: Complete
    Issue_Complete: Issue Complete

    %% Close Issue
    Issue_Complete --> Close_Issue: Close
    Close_Issue: Issue Closed - Completed
    Close_Issue --> [*]

    %% Alternative: Manual Close
    At_Bat --> Manual_Close_Check: Manual close?
    Manual_Close_Check: Manual Close Check
    Manual_Close_Check --> Manual_Completed: Close manually
    Manual_Completed: Issue Closed - Manual
    Manual_Completed --> [*]
```

---

## 📋 State Definitions

### Initial States

| State               | Label | Type  | Trigger            | Next                         |
| ------------------- | ----- | ----- | ------------------ | ---------------------------- |
| **Issue_Created**   | 🆕    | Entry | User creates issue | Auto_Validation              |
| **Auto_Validation** | ⚠️    | Gate  | Issue submitted    | Validation_Failed or Backlog |

### Validation States

| State                 | Label | Type         | Meaning                   | Exit Criteria                                         |
| --------------------- | ----- | ------------ | ------------------------- | ----------------------------------------------------- |
| **Validation_Failed** | ⚠️    | Intermediate | Missing required fields   | Needs_Details                                         |
| **Needs_Details**     | 📝    | Waiting      | Awaiting user updates     | Auto_Validation (updated) or Auto_Abandoned (30 days) |
| **Auto_Abandoned**    | ❌    | Terminal     | Auto-closed (no response) | End                                                   |

### Backlog & Triage States

| State               | Label | Type         | Meaning                        | Exit Criteria                         |
| ------------------- | ----- | ------------ | ------------------------------ | ------------------------------------- |
| **Backlog**         | 📦    | Intermediate | Validated, awaiting PM review  | PM_Triage                             |
| **PM_Triage**       | 👤    | Manual Gate  | PM reviews for scope/viability | Triage_Rejected or Assigned_Lane      |
| **Triage_Rejected** | ❌    | Terminal     | PM rejected issue              | Closed_Rejected                       |
| **Assigned_Lane**   | 🏷️    | Routing      | PM assigns to lane             | On_Bench, In_Hole, On_Deck, or At_Bat |

### Lane States

| State        | Label | Type   | Meaning                            | Rebalance Trigger            |
| ------------ | ----- | ------ | ---------------------------------- | ---------------------------- |
| **On_Bench** | Queue | Queue  | Low priority, future consideration | PM rebalance (manual)        |
| **In_Hole**  | Queue | Queue  | Next in pipeline                   | Dependencies resolved (auto) |
| **On_Deck**  | Queue | Queue  | Ready next                         | Previous issue closes (auto) |
| **At_Bat**   | ⚾    | Active | Currently being worked             | Implementation starts        |

### Development States

| State               | Label | Type   | Meaning                         | Duration   |
| ------------------- | ----- | ------ | ------------------------------- | ---------- |
| **Dev_Assigned**    | 💻    | Active | Developer assigned, preparation | Variable   |
| **Dev_In_Progress** | ⏳    | Active | Branch created, coding          | Variable   |
| **PR_Created**      | 🔀    | Active | Pull request opened             | Continuous |

### PR Validation States

| State                 | Label | Type         | Criteria                       | Decision                     |
| --------------------- | ----- | ------------ | ------------------------------ | ---------------------------- |
| **Stage_1_PR_Format** | 📋    | Auto Gate    | Format check, field validation | Pass or Fail                 |
| **Stage_1_Fail**      | ⚠️    | Intermediate | Invalid format, missing info   | Needs_PR_Update              |
| **Needs_PR_Update**   | 📝    | Waiting      | Developer fixes PR             | Stage_1_PR_Format (re-check) |

### AI Code Review States

| State                    | Label | Type         | Round                       | Max Rounds           |
| ------------------------ | ----- | ------------ | --------------------------- | -------------------- |
| **Stage_2_AI_Review**    | 🤖    | Auto Gate    | Round 1 of 3                | 3                    |
| **AI_Comments_R1/R2/R3** | 📌    | Intermediate | AI found issues             | Auto fix or escalate |
| **Auto_Fix_Attempt**     | 🔧    | Intermediate | Implementing model fixes    | Re-review            |
| **Re_Review_R1/R2/R3**   | 🔄    | Auto Gate    | Re-review after fixes       | Decision             |
| **AI_Approved_R1/R2/R3** | ✅    | Intermediate | AI approved                 | Stage_3              |
| **Escalation_Decision**  | ⚠️    | Decision     | After Round 3 issues remain | Assign to maintainer |

### Acceptance Criteria States

| State                  | Label | Type         | Validation        | Decision           |
| ---------------------- | ----- | ------------ | ----------------- | ------------------ |
| **Stage_3_Acceptance** | 📋    | Auto Gate    | AC verification   | Pass or Fail       |
| **AC_Failed**          | ❌    | Intermediate | AC not met        | Needs_AC_Update    |
| **AC_Needs_Update**    | 📋    | Waiting      | Developer updates | Stage_3_Acceptance |

### CI/CD States

| State             | Label | Type         | Checks                | Decision      |
| ----------------- | ----- | ------------ | --------------------- | ------------- |
| **Stage_4_CI_CD** | 🧪    | Auto Gate    | Tests, linting, build | Pass or Fail  |
| **CI_Failed**     | ❌    | Intermediate | CI/CD failed          | Needs_CI_Fix  |
| **CI_Needs_Fix**  | 🔧    | Waiting      | Developer fixes       | Stage_4_CI_CD |

### Human Approval States

| State                 | Label | Type         | Review Scope         | Decision                       |
| --------------------- | ----- | ------------ | -------------------- | ------------------------------ |
| **Stage_5_Human**     | 👤    | Manual Gate  | Architecture, design | Approve or Reject              |
| **Stage_5_Escalated** | 👤    | Manual Gate  | Escalated AI issues  | Approve or Reject              |
| **Maintainer_Review** | 👀    | Active       | Detailed review      | Approve/Reject/Request Changes |
| **Approval_Rejected** | 📝    | Intermediate | Changes requested    | Dev_Updates                    |
| **Dev_Updates**       | ⏳    | Waiting      | Developer updates    | Maintainer_Review              |

### Merge & Completion States

| State                | Label | Type        | Action        | Result          |
| -------------------- | ----- | ----------- | ------------- | --------------- |
| **Stage_6_Merge**    | 🎉    | Auto Action | Merge to main | Success or Fail |
| **Merged_Success**   | 🎉    | Success     | PR merged     | Issue_Complete  |
| **Issue_Complete**   | ✅    | Completion  | Link closed   | [*] End         |
| **Closed_Completed** | 🏁    | Terminal    | Issue closed  | End             |

### Rejection/Alternative End States

| State                  | Label | Type     | Reason               | Result |
| ---------------------- | ----- | -------- | -------------------- | ------ |
| **Closed_Rejected**    | 🚫    | Terminal | Failed triage        | End    |
| **Closed_Failed**      | 🚫    | Terminal | Failed design review | End    |
| **PR_Closed_Rejected** | ❌    | Terminal | Maintainer rejected  | End    |
| **Manual_Completed**   | 🏁    | Terminal | Manual completion    | End    |

---

## 🚪 Gates & Decision Points

### Automated Gates (5 Total)

```
Gate 1: Auto Validation
├─ Type: Automated
├─ Input: New issue
├─ Checks:
│  ├─ All required fields present
│  ├─ Format valid
│  ├─ Description quality threshold
│  └─ No obvious spam
└─ Outcomes: Pass → Backlog OR Fail → Needs_Details

Gate 2: PR Format Check (Stage 1)
├─ Type: Automated
├─ Input: Pull request
├─ Checks:
│  ├─ PR format valid
│  ├─ Title follows convention
│  ├─ Description complete
│  ├─ Links to issue
│  └─ No empty sections
└─ Outcomes: Pass → Stage_2 OR Fail → Needs_PR_Update

Gate 3: Copilot Code Review (Stage 2)
├─ Type: Automated (up to 3 rounds)
├─ Input: PR code
├─ Review Dimensions:
│  ├─ Architecture & design
│  ├─ Code quality
│  ├─ Testing adequacy
│  ├─ Error handling
│  ├─ Security
│  ├─ Documentation
│  ├─ Performance
│  └─ Patterns & conventions
├─ Flow:
│  ├─ Round 1: Review → Issues? → Auto-fix
│  ├─ Round 2: Review → Issues? → Auto-fix
│  ├─ Round 3: Review → Issues? → Escalate
│  └─ All rounds: Approval? → Stage 3
└─ Outcomes: Approved → Stage_3 OR Issues Remain → Escalate

Gate 4: Acceptance Criteria (Stage 3)
├─ Type: Automated
├─ Input: PR code + acceptance criteria
├─ Checks:
│  ├─ All AC items met
│  ├─ No regression
│  └─ Expected behavior verified
└─ Outcomes: Pass → Stage_4 OR Fail → Needs_AC_Update

Gate 5: CI/CD Checks (Stage 4)
├─ Type: Automated
├─ Input: PR + test suite
├─ Checks:
│  ├─ Unit tests pass
│  ├─ Integration tests pass
│  ├─ Linting passes
│  ├─ Build succeeds
│  └─ Security scans pass
└─ Outcomes: Pass → Stage_5 OR Fail → Needs_CI_Fix
```

### Manual Gates (2 Total)

```
Gate 1: PM Triage
├─ Type: Manual (by PM)
├─ Input: Validated issue
├─ Assessment:
│  ├─ In scope?
│  ├─ Viable?
│  ├─ Duplicate?
│  ├─ Right priority?
│  └─ Appropriate lane?
├─ Outcomes:
│  ├─ Reject (Triage_Rejected)
│  └─ Approve + Assign Lane (On_Bench/In_Hole/On_Deck/At_Bat)
└─ Escalation: If unsure, discuss with team

Gate 2: Human Code Review (Stage 5)
├─ Type: Manual (by maintainer)
├─ Input: PR that passed all automated gates
├─ Assessment:
│  ├─ Architecture alignment?
│  ├─ Design patterns?
│  ├─ Team standards?
│  ├─ Edge cases considered?
│  ├─ Maintainability?
│  └─ Strategic fit?
├─ Outcomes:
│  ├─ Approve → Stage_6 (Merge)
│  └─ Request Changes → Dev_Updates
│     (if escalated PR: Reject → Closed_Failed)
└─ Authority: Final approval or rejection
```

---

## 🔄 Possible Paths

### Path 1: Happy Path (Validation → At Bat → PR → Approved → Merged)

```
Issue_Created
  → Auto_Validation (✅ PASS)
  → Backlog
  → PM_Triage (✅ APPROVE)
  → At_Bat
  → Dev_Assigned
  → Dev_In_Progress
  → PR_Created
  → Stage_1_PR_Format (✅ PASS)
  → Stage_2_AI_Review_R1 (✅ APPROVE R1)
  → Stage_3_Acceptance (✅ PASS)
  → Stage_4_CI_CD (✅ PASS)
  → Stage_5_Human (✅ APPROVE)
  → Stage_6_Merge (✅ MERGE)
  → Issue_Complete
  → Closed_Completed → [*]

Duration: Hours to days
AI Rounds: 1 (immediate approval)
Manual Gates: 2 (PM triage, human review)
```

### Path 2: AI Finds Issues (2 Rounds of Auto-Fix & Re-Review)

```
[Same as Path 1 up to Stage_2_AI_Review_R1]
Stage_2_AI_Review_R1 (❌ ISSUES FOUND)
  → AI_Comments_R1
  → Auto_Fix_Attempt (Implementing model fixes)
  → Re_Review_R1 (Stage_2_AI_Review_R2)
  → Round_2_Decision (✅ APPROVE R2)
  [Continue to Stage_3 with fixes applied]

Duration: Hours (slightly longer)
AI Rounds: 2 (found issues, auto-fixed, re-approved)
Auto-Fix: 1 successful iteration
Manual Gates: 2 (unchanged)
```

### Path 3: AI Escalation (3 Rounds, Issues Remain)

```
[Same as Path 1-2 up to Stage_2_AI_Review_R3]
Round_3_Decision (❌ ISSUES REMAIN AFTER 3 ROUNDS)
  → Escalation_Decision
  → Auto_Assign_Maintainer
  → Stage_5_Human (ESCALATED)
  → Maintainer_Review_Esc
  → Maintainer_Decision_Esc (✅ APPROVE)
  [Continue to Stage_6]

Alternative: Maintainer_Decision_Esc (❌ REJECT)
  → Approval_Rejected_Esc
  → PR_Closed_Rejected
  → Closed_Failed → [*]

Duration: Hours to half-day
AI Rounds: 3 (all completed, issues remain)
Escalation: Yes (to human maintainer)
Manual Gates: 3 (PM triage, human escalation review, final decision)
```

### Path 4: Validation Failure → Details Needed → Update

```
Issue_Created
  → Auto_Validation (❌ FAIL - missing fields)
  → Validation_Failed
  → Needs_Details (Request details from submitter)
  [User updates with missing info]
  → Auto_Validation (✅ PASS)
  → Backlog → [Continue happy path]

Duration: Varies (depends on user response time)
Outcome: Same as happy path after details provided
Timeout: 30 days → Auto_Abandoned
```

### Path 5: PM Triage Rejection (Out of Scope)

```
Issue_Created
  → Auto_Validation (✅ PASS)
  → Backlog
  → PM_Triage (❌ REJECT)
  → Triage_Rejected
  → Closed_Rejected → [*]

Duration: Hours (PM review time)
Outcome: Issue closed, not implemented
Message: PM provides explanation in issue
```

### Path 6: PR Format Failure → Developer Updates PR

```
[Same as happy path up to PR_Created]
PR_Created
  → Stage_1_PR_Format (❌ FAIL - missing AC link)
  → Stage_1_Fail
  → Needs_PR_Update (Request PR format fix)
  [Developer updates PR format]
  → Stage_1_PR_Format (✅ PASS)
  → Stage_2_AI_Review → [Continue happy path]

Duration: Hours (developer updates PR)
Outcome: Same as happy path after fix
```

### Path 7: AC Failure → Developer Updates Implementation

```
[Same as happy path up to Stage_3_Acceptance]
Stage_3_Acceptance (❌ FAIL - AC not met)
  → AC_Failed
  → Needs_AC_Update (Developer updates code)
  [Developer pushes new commits]
  → Stage_3_Acceptance (✅ PASS)
  → Stage_4_CI_CD → [Continue happy path]

Duration: Hours to day (developer re-implementation)
Outcome: Same as happy path after AC met
```

### Path 8: CI/CD Failure → Developer Fixes Tests

```
[Same as happy path up to Stage_4_CI_CD]
Stage_4_CI_CD (❌ FAIL - test failure)
  → CI_Failed
  → Needs_CI_Fix (Developer fixes tests)
  [Developer debugs and fixes]
  → Stage_4_CI_CD (✅ PASS)
  → Stage_5_Human → [Continue happy path]

Duration: Hours (debugging time)
Outcome: Same as happy path after CI passes
```

### Path 9: Maintainer Requests Changes

```
[Same as happy path up to Stage_5_Human]
Stage_5_Human (Maintainer Review)
  → Maintainer_Review
  → Maintainer_Decision (REQUEST CHANGES)
  → Approval_Rejected
  → Dev_Updates (Developer makes changes)
  [Developer updates PR]
  → Maintainer_Review (2nd review)
  → Maintainer_Decision (✅ APPROVE)
  → Stage_6_Merge → [Continue to completion]

Duration: Half-day to day (iteration)
Outcome: Same as happy path after changes approved
Iterations: Can repeat multiple times
```

### Path 10: Manual Issue Completion

```
At_Bat
  → Manual_Close_Check (Issue manually marked done)
  → Manual_Completed
  → Closed (Manual) → [*]

Duration: Seconds (no dev work)
Outcome: Issue closed without PR (documentation, discussion, external completion)
Typical: Design decisions, discussions, non-code issues
```

---

## 📊 Decision Tree Logic

### Gate 1: Auto Validation

```
Required fields present?
├─ No  → Validation_Failed → Needs_Details
└─ Yes → Format valid?
        ├─ No  → Validation_Failed → Needs_Details
        └─ Yes → Description quality ≥ threshold?
                ├─ No  → Validation_Failed → Needs_Details
                └─ Yes → Backlog ✅
```

### Gate 2: PM Triage

```
In scope?
├─ No  → Triage_Rejected → Closed_Rejected
└─ Yes → Viable?
        ├─ No  → Triage_Rejected → Closed_Rejected
        └─ Yes → Not duplicate?
                ├─ No  → Triage_Rejected → Closed_Rejected
                └─ Yes → Assign to lane:
                        ├─ Low priority → On_Bench
                        ├─ With dependencies → In_Hole
                        ├─ Next in line → On_Deck
                        └─ Urgent, independent → At_Bat ✅
```

### Gate 3: AI Code Review (Multi-Round)

```
Round 1:
  Issues found?
  ├─ No  → AI_Approved_R1 → Stage_3 ✅
  └─ Yes → AI_Comments_R1 → Auto_Fix_Attempt → Round 2

Round 2:
  Issues found?
  ├─ No  → AI_Approved_R2 → Stage_3 ✅
  └─ Yes → AI_Comments_R2 → Auto_Fix_Attempt → Round 3

Round 3:
  Issues found?
  ├─ No  → AI_Approved_R3 → Stage_3 ✅
  └─ Yes → Issues remain?
          ├─ Yes → Escalate_to_Maintainer
          └─ No  → AI_Approved_R3 → Stage_3 ✅
```

### Gate 4: Acceptance Criteria

```
All AC items met?
├─ No  → AC_Failed → Needs_AC_Update → Re-check
└─ Yes → No regression?
        ├─ No  → AC_Failed → Needs_AC_Update → Re-check
        └─ Yes → Stage_4 ✅
```

### Gate 5: CI/CD Checks

```
Tests pass?
├─ No  → CI_Failed → Needs_CI_Fix → Re-check
└─ Yes → Linting passes?
        ├─ No  → CI_Failed → Needs_CI_Fix → Re-check
        └─ Yes → Build succeeds?
                ├─ No  → CI_Failed → Needs_CI_Fix → Re-check
                └─ Yes → Security scans pass?
                        ├─ No  → CI_Failed → Needs_CI_Fix → Re-check
                        └─ Yes → Stage_5 ✅
```

### Gate 6: Human Code Review

```
Architecture aligned?
├─ No  → Request_Changes → Dev_Updates
└─ Yes → Design patterns OK?
        ├─ No  → Request_Changes → Dev_Updates
        └─ Yes → Team standards met?
                ├─ No  → Request_Changes → Dev_Updates
                └─ Yes → Edge cases considered?
                        ├─ No  → Request_Changes → Dev_Updates
                        └─ Yes → Maintainability OK?
                                ├─ No  → Request_Changes → Dev_Updates
                                └─ Yes → APPROVE → Stage_6 ✅
```

---

## ⏱️ Transition Criteria

### Automatic Transitions (No Human Intervention)

| From                     | To                         |                Condition |     Time |
| ------------------------ | -------------------------- | -----------------------: | -------: |
| **Issue_Created**        | **Auto_Validation**        |                Immediate |    0 min |
| **Validation_Failed**    | **Needs_Details**          |                Immediate |    0 min |
| **Needs_Details**        | **Auto_Validation**        |      User submits update | Variable |
| **Needs_Details**        | **Auto_Abandoned**         | 30 days with no response |  30 days |
| **Backlog**              | **PM_Triage**              |                PM review |    Hours |
| **Auto_Validation (✅)** | **Backlog**                |          All checks pass |    0 min |
| **Stage_2_AI_Review**    | **AI_Comments**            |             Issues found |  Minutes |
| **AI_Comments**          | **Auto_Fix_Attempt**       | Implementing model fixes |  Minutes |
| **Auto_Fix_Attempt**     | **Re_Review**              |        Auto-fix complete |  Minutes |
| **Stage_3_Acceptance**   | **AC_Failed**              |               AC not met |  Minutes |
| **AC_Failed**            | **Needs_AC_Update**        |                Immediate |    0 min |
| **Stage_4_CI_CD**        | **CI_Failed**              |                 CI fails |  Minutes |
| **CI_Failed**            | **Needs_CI_Fix**           |                Immediate |    0 min |
| **Escalation_Decision**  | **Auto_Assign_Maintainer** |        After 3 AI rounds |    0 min |
| **Stage_6_Merge**        | **Auto_Merge**             |           All gates pass |    0 min |
| **Merged_Success**       | **Issue_Complete**         |           Merge verified |    0 min |
| **Issue_Complete**       | **Close_Issue**            |          Update complete |    0 min |

### Manual Transitions (Require Human Action)

| From                    | To                    | Actor      | Condition          |          Time |
| ----------------------- | --------------------- | ---------- | ------------------ | ------------: |
| **Backlog**             | **PM_Triage**         | PM         | Review submitted   |    Hours-days |
| **PM_Triage**           | **Triage_Rejected**   | PM         | Scope assessment   |    Hours-days |
| **PM_Triage**           | **Assigned_Lane**     | PM         | Lane assignment    |    Hours-days |
| **At_Bat**              | **Dev_Assigned**      | Dev Lead   | Developer assigned | Minutes-hours |
| **Dev_Assigned**        | **Dev_In_Progress**   | Developer  | Branch created     |       Minutes |
| **Dev_In_Progress**     | **PR_Created**        | Developer  | PR submitted       |    Hours-days |
| **Needs_PR_Update**     | **Stage_1_PR_Format** | Developer  | PR format fixed    | Minutes-hours |
| **Dev_Updates**         | **Maintainer_Review** | Developer  | PR updated         | Minutes-hours |
| **Stage_5_Human**       | **Merged_Success**    | Maintainer | PR approved        | Minutes-hours |
| **Maintainer_Decision** | **Approval_Rejected** | Maintainer | Changes requested  | Minutes-hours |
| **Approval_Rejected**   | **Maintainer_Review** | Developer  | Updates submitted  | Minutes-hours |

---

## 🎯 Summary: Key Metrics by Path

| Path                     | Duration       | AI Rounds | Auto-Fix | Escalation | Manual Gates | Success Rate              |
| ------------------------ | -------------- | --------- | -------- | ---------- | ------------ | ------------------------- |
| **Happy Path**           | Hours          | 1         | 0        | No         | 2            | 100%                      |
| **1 Fix Iteration**      | Hours-Half Day | 2         | 1        | No         | 2            | 100%                      |
| **2 Fix Iterations**     | Half Day       | 3         | 2        | No         | 2            | 100%                      |
| **Escalation**           | Half Day-Day   | 3         | 2        | Yes        | 3            | 95%                       |
| **Validation Failure**   | Variable       | 0         | 0        | No         | 1            | 70% (30% abandon)         |
| **PM Rejection**         | Hours          | 0         | 0        | No         | 1            | 0% (terminal)             |
| **Maintainer Rejection** | Day+           | 3         | 2        | Yes        | 3            | 0% (terminal or redesign) |
| **Manual Completion**    | Seconds        | 0         | 0        | No         | 1            | 100%                      |

---

## 🔗 Integration Points

### External Systems

```
Issue Lifecycle
  ├─ GitHub Issues
  │  ├─ Create/update issues
  │  ├─ Add labels
  │  └─ Post comments
  │
  ├─ GitHub PRs
  │  ├─ Create/update PRs
  │  ├─ Add reviews
  │  ├─ Approve/request changes
  │  └─ Merge
  │
  ├─ GitHub Actions
  │  ├─ Run validation
  │  ├─ Run AI review
  │  ├─ Run CI/CD
  │  └─ Auto-merge
  │
  ├─ OpenAI API
  │  ├─ Code review (reviewing model)
  │  └─ Auto-fix (implementing model)
  │
  ├─ Slack/Notifications
  │  ├─ Issue status updates
  │  ├─ PR reviews
  │  └─ Escalations
  │
  └─ Analytics/Metrics
     ├─ Time in each state
     ├─ AI round statistics
     ├─ Escalation tracking
     └─ Success metrics
```

---

## 📝 Notes

- **State names** use underscores (e.g., `Issue_Created`)
- **Emoji labels** provide quick visual identification
- **Notes** on diagram explain gate types and purposes
- **Decision points** are marked with `{condition}` boxes
- **Parallel paths** show all possible transitions from each state
- **Terminal states** end with `→ [*]`
- **Loop-backs** show iteration/feedback cycles (e.g., failing validation → requesting details → re-validation)
