#!/usr/bin/env node

/**
 * PM Review Script for Issue #49
 * Applies the PM review rubric to issue #49 locally
 */

const issue = {
  number: 49,
  title: 'Bug: Double icons in browser title bar',
  body: 'Two robot icons are shown in the browser/tab title bar caused by both favicon and emoji in HTML title.',
  labels: ['needs-approval'],
  acceptanceCriteria: [
    'Only one icon appears in browser/tab title across Chrome, Edge, Firefox, Safari',
    'No regression in header styling or branding inside page UI',
    'Lighthouse/HTML validation still passes for head metadata'
  ],
  proposedFix: [
    'Change <title>🤖 AI Practitioner Resources</title> to <title>AI Practitioner Resources</title>',
    'Keep one rel="icon" that works across browsers'
  ]
};

// Decision Rubric Analysis
const rubricAnalysis = {
  scopeAndAcceptance: {
    status: 'Pass',
    evidence: 'Clear bug report with reproduction steps, root cause identified, three measurable acceptance criteria, and specific proposed fix.'
  },
  independence: {
    status: 'Pass',
    evidence: 'No blocking dependencies; isolated to HTML title and favicon metadata. Can proceed without coordination.'
  },
  size: {
    status: 'Pass',
    evidence: 'Single file change (index.html). Minimal scope: remove emoji from title, verify favicon works correctly. Estimated: 15 min.'
  },
  priority: {
    score: 70,
    evidence: 'Visual bug affecting UX/branding; straightforward fix with low risk; not blocking but affects user perception.'
  },
  risks: {
    level: 'low',
    evidence: 'HTML metadata change only. No logic changes, no data impact, no external APIs. Low risk of side effects.'
  },
  parallelSafety: {
    status: 'safe',
    evidence: 'Index.html is generally stable; no typical concurrent work conflicts. Safe to run in parallel with other issues.'
  }
};

// PM Decision Output - STRICT JSON FIRST
const pmDecision = {
  ready: true,
  independence: 'high',
  size: 'small',
  priorityScore: 70,
  riskLevel: 'low',
  parallelSafety: 'safe',
  labels: {
    add: ['size:small', 'priority:70', 'independent', 'implementation ready'],
    remove: []
  }
};

// Output Phase 1: Strict JSON
console.log('========================================');
console.log('PHASE 1: STRICT JSON OUTPUT');
console.log('========================================\n');
console.log(JSON.stringify(pmDecision, null, 2));

// Output Phase 2: Concise Review Comments
console.log('\n========================================');
console.log('PHASE 2: REVIEW COMMENTS FOR AUTHOR');
console.log('========================================\n');

console.log('### PM Review for Issue #49\n');

console.log('#### Findings Checklist\n');
console.log('| Item | Status | Evidence |');
console.log('|------|--------|----------|');
console.log('| Scope & Acceptance | Pass | Clear bug with 3 measurable acceptance criteria and specific fix proposed |');
console.log('| Independence | Pass | No dependencies; isolated HTML metadata change |');
console.log('| Size | Pass | Single file, minimal scope (~15 min) |');
console.log('| Priority Score | 70/100 | Visual bug affecting branding; straightforward fix |');
console.log('| Risk Level | Low | HTML metadata only; no logic/data impact |');
console.log('| Parallel Safety | Safe | No typical concurrent conflicts |');

console.log('\n#### Follow-ups\n');
console.log('- All acceptance criteria are well-defined and testable.');
console.log('- Root cause analysis is thorough (favicon + emoji duplication).');
console.log('- No clarifications needed; implementation can proceed immediately.\n');

console.log('#### Verdict\n');
console.log('✅ **READY FOR IMPLEMENTATION**\n');

console.log('This issue is approved for implementation. Moving to "implementation ready" status.\n');

// Output Phase 3: Suggested GitHub Actions
console.log('========================================');
console.log('PHASE 3: SUGGESTED GITHUB COMMAND');
console.log('========================================\n');

const reviewComment = `### PM Review (Automated)

#### Evaluation
- **Ready**: Yes ✅
- **Independence**: High
- **Size**: Small
- **Priority Score**: 70/100
- **Risk Level**: Low
- **Parallel Safety**: Safe

#### Findings

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Scope & Acceptance | Pass | Clear bug with 3 measurable acceptance criteria |
| Independence | Pass | No dependencies; isolated change |
| Size | Pass | Single file modification (~15 min) |
| Risk | Pass | HTML metadata only; low risk |

#### Verdict
✅ **Ready for implementation**. Clear scope, no blockers, minimal risk.`;

console.log('To post this review as a GitHub comment, run:\n');
console.log(`gh issue comment 49 --body "${reviewComment.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`);

// Output Phase 4: Label Application
console.log('========================================');
console.log('PHASE 4: LABEL CHANGES');
console.log('========================================\n');
console.log('Labels to ADD:');
pmDecision.labels.add.forEach(label => console.log(`  - ${label}`));
console.log('\nLabels to REMOVE:');
if (pmDecision.labels.remove.length === 0) {
  console.log('  (none)');
} else {
  pmDecision.labels.remove.forEach(label => console.log(`  - ${label}`));
}

console.log('\n✅ PM Review Complete for Issue #49');
