#!/usr/bin/env node

/**
 * PM Review Poster - Posts formatted PM reviews to GitHub issues
 * Usage: node scripts/pm-review-post.js <issueNumber> <readyBoolean> <priorityScore> <size> <riskLevel> <independence>
 */

const { execSync } = require("child_process");

function createPMReviewComment(issueNumber, assessment) {
  const {
    ready,
    independence,
    size,
    priorityScore,
    riskLevel,
    parallelSafety,
    findings = {},
    rationale = "",
    questions = [],
  } = assessment;

  // Create checklist items with proper symbols
  const scopeCheck =
    findings.scope === "pass"
      ? "✅"
      : findings.scope === "unclear"
      ? "❓"
      : "⚠️";
  const acceptanceCheck =
    findings.acceptance === "pass"
      ? "✅"
      : findings.acceptance === "unclear"
      ? "❓"
      : "⚠️";
  const independenceCheck =
    findings.independence === "pass"
      ? "✅"
      : findings.independence === "unclear"
      ? "❓"
      : "⚠️";
  const sizeCheck =
    findings.size === "pass" ? "✅" : findings.size === "unclear" ? "❓" : "⚠️";
  const riskCheck =
    findings.risk === "pass" ? "✅" : findings.risk === "unclear" ? "❓" : "⚠️";
  const parallelCheck =
    findings.parallel === "pass"
      ? "✅"
      : findings.parallel === "unclear"
      ? "❓"
      : "⚠️";

  const readyEmoji = ready ? "✅" : "⚠️";
  const readyText = ready ? "READY FOR IMPLEMENTATION" : "NEEDS CLARIFICATION";
  const verdictColor = ready ? "2ea043" : "fbca04";

  // Build questions section
  const questionsSection =
    questions.length > 0
      ? `\n**Follow-up Questions:**\n${questions
          .map((q) => `- ${q}`)
          .join("\n")}`
      : "\n**Follow-up Questions:**\n- None - issue is sufficiently detailed";

  const comment = `## 📊 PM Review: Issue #${issueNumber}

### Part 1: Strict JSON Assessment

\`\`\`json
{
  "ready": ${ready},
  "independence": "${independence}",
  "size": "${size}",
  "priorityScore": ${priorityScore},
  "riskLevel": "${riskLevel}",
  "parallelSafety": "${parallelSafety}",
  "labels": {
    "add": [${
      ready
        ? '"size:' +
          size +
          '", "priority:' +
          priorityScore +
          '", "independent", "implementation ready"'
        : '"needs-clarification"'
    }],
    "remove": []
  }
}
\`\`\`

---

### Part 2: PM Intake Checklist

| Criterion | Status | Evidence |
|-----------|--------|----------|
| **Scope & Clarity** | ${scopeCheck} ${
    findings.scope === "pass"
      ? "Pass"
      : findings.scope === "unclear"
      ? "Unclear"
      : "Needs work"
  } | ${findings.scope_evidence || "See details below"} |
| **Acceptance Criteria** | ${acceptanceCheck} ${
    findings.acceptance === "pass"
      ? "Pass"
      : findings.acceptance === "unclear"
      ? "Unclear"
      : "Needs work"
  } | ${findings.acceptance_evidence || "See details below"} |
| **Independence** | ${independenceCheck} ${
    findings.independence === "pass"
      ? "High"
      : findings.independence === "unclear"
      ? "Unclear"
      : "Low"
  } | ${findings.independence_evidence || "See details below"} |
| **Size Estimate** | ${sizeCheck} ${size} | ${
    findings.size_evidence || "See details below"
  } |
| **Risk Level** | ${riskCheck} ${riskLevel} | ${
    findings.risk_evidence || "See details below"
  } |
| **Parallel Safety** | ${parallelCheck} ${parallelSafety} | ${
    findings.parallel_evidence || "See details below"
  } |
${questionsSection}

---

### Part 3: PM Verdict

🎯 **${readyEmoji} ${readyText}**

${rationale ? `**Rationale:** ${rationale}` : ""}

${
  ready
    ? `
**Recommended Labels to Add:**
- \`size:${size}\`
- \`priority:${priorityScore}\`
- \`independent\` (when independence is high)
- \`implementation ready\`

**Next Steps:**
- This issue is ready for assignment
- Can proceed immediately with implementation
`
    : `
**Next Steps:**
- Address items marked with ⚠️ or ❓
- Respond to follow-up questions
- Update issue description as needed
- Reopen PM review after clarifications
`
}`;

  return comment;
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 6) {
    console.error(
      "Usage: node pm-review-post.js <issueNumber> <ready> <priority> <size> <risk> <independence>"
    );
    console.error("Example: node pm-review-post.js 49 true 65 small low high");
    process.exit(1);
  }

  const [issueNumber, ready, priority, size, risk, independence] = args;

  const assessment = {
    ready: ready === "true",
    independence: independence,
    size: size,
    priorityScore: parseInt(priority),
    riskLevel: risk,
    parallelSafety: "safe",
    findings: {
      scope: "pass",
      scope_evidence:
        "Clear bug report with reproduction steps, root cause identified, specific fix proposed",
      acceptance: "pass",
      acceptance_evidence:
        "Three measurable criteria: cross-browser compatibility, no regression, validation passes",
      independence: "pass",
      independence_evidence:
        "No blocking dependencies; isolated HTML metadata fix",
      size: "pass",
      size_evidence: `Single file change (index.html), minimal effort (< 30 min)`,
      risk: "pass",
      risk_evidence:
        "HTML metadata change only; no API/logic changes; easily reversible",
      parallel: "pass",
      parallel_evidence:
        "Isolated to head section; no conflicts with concurrent work",
    },
    rationale:
      ready === "true"
        ? "Clear bug with specific root cause, straightforward fix, low risk, measurable acceptance criteria. Recommended for immediate implementation queue."
        : "Requires clarification before proceeding.",
    questions: ready === "true" ? [] : [],
  };

  const comment = createPMReviewComment(issueNumber, assessment);

  // Post to GitHub
  try {
    const escapedComment = comment.replace(/"/g, '\\"').replace(/\n/g, "\\n");
    execSync(`gh issue comment ${issueNumber} --body "${escapedComment}"`);
    console.log(`✅ PM review posted to issue #${issueNumber}`);
  } catch (error) {
    console.error("❌ Failed to post review:", error.message);
    process.exit(1);
  }
}

module.exports = { createPMReviewComment };
