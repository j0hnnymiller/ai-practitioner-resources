### Description

Create a comprehensive metrics tracking system for PM review operations to monitor performance, success rates, and identify bottlenecks in the issue triage process.

### Problem

Currently, there's no visibility into:

- PM review success vs failure rates
- Average number of labels applied per issue
- Time to reach "implementation ready" status
- Common reasons for PM review rejection
- Bottlenecks in the issue workflow
- Impact of AI-generated reviews vs manual reviews

Without metrics, it's difficult to:

- Identify problems in the PM review process
- Optimize the review prompt for better results
- Understand workflow efficiency
- Make data-driven improvements

### Proposed Solution

Implement a metrics tracking system with two components:

**1. Instrumentation (`scripts/pm-review-metrics.js`)**

- Log PM review events to structured JSON file
- Track: timestamp, issue number, success/failure, labels applied, time taken, error type
- Append-only log file for historical analysis

**2. Analysis Dashboard (`scripts/analyze-pm-metrics.js`)**

- Parse metrics log file
- Generate summary statistics
- Identify trends and anomalies
- Export reports in JSON/CSV/Markdown

### Acceptance Criteria

**Instrumentation:**

- [ ] PM review script logs all review attempts (success and failure)
- [ ] Log includes: timestamp, issue #, outcome, labels added, labels removed, error (if any), duration
- [ ] Log file format is structured JSON (one event per line for easy parsing)
- [ ] Log file rotation implemented (daily or weekly)
- [ ] Minimal performance impact on PM review execution

**Analysis:**

- [ ] Script can parse metrics log file
- [ ] Generates summary report with key metrics
- [ ] Supports date range filtering
- [ ] Exports to multiple formats (JSON, CSV, Markdown)
- [ ] Can be run manually or via scheduled GitHub Action

**Key Metrics Tracked:**

- [ ] PM review success rate (successful reviews / total attempts)
- [ ] Average labels applied per issue
- [ ] Time to "implementation ready" (issue creation → ready label)
- [ ] Most common label combinations
- [ ] Error frequency by type (API errors, timeouts, validation errors)
- [ ] Issues requiring manual intervention
- [ ] Review processing time distribution

### Example Metrics Output

```markdown
# PM Review Metrics Report

**Period:** 2025-10-01 to 2025-11-07 (37 days)

## Summary

- Total Reviews: 127
- Successful: 119 (93.7%)
- Failed: 8 (6.3%)
- Average Duration: 3.2 seconds

## Success Rate by Week

| Week | Total | Success | Failed | Rate  |
| ---- | ----- | ------- | ------ | ----- |
| W44  | 32    | 31      | 1      | 96.9% |
| W45  | 28    | 27      | 1      | 96.4% |
| W46  | 35    | 32      | 3      | 91.4% |
| W47  | 32    | 29      | 3      | 90.6% |

## Labels Applied

- Average labels per issue: 6.2
- Most common: `size:medium` (48), `independence:high` (42), `feature` (38)
- Least common: `risk:high` (3), `size:large` (5)

## Time to Ready

- Average: 2.3 days
- Median: 1.5 days
- 90th percentile: 5.8 days

## Errors

| Error Type    | Count | %     |
| ------------- | ----- | ----- |
| API Timeout   | 3     | 37.5% |
| Rate Limit    | 2     | 25.0% |
| Invalid JSON  | 2     | 25.0% |
| Network Error | 1     | 12.5% |

## Recommendations

⚠️ Week 47 shows declining success rate - investigate API stability
✓ 94% of issues become ready within 3 days
⚠️ API timeouts increasing - consider retry logic
```

### Technical Implementation

**Log Entry Format:**

```json
{
  "timestamp": "2025-11-07T10:30:15Z",
  "event": "pm_review",
  "issue_number": 123,
  "outcome": "success",
  "duration_ms": 2847,
  "labels_added": [
    "feature",
    "size:medium",
    "priority:75",
    "independence:high",
    "independent",
    "risk:low",
    "implementation ready"
  ],
  "labels_removed": [],
  "ready": true,
  "assigned": true,
  "error": null
}
```

**Storage:**

- Log file: `automation-results/pm-review-metrics.jsonl` (JSON Lines format)
- Rotation: Weekly files with timestamp (pm-review-metrics-2025-W44.jsonl)
- Retention: Keep last 12 weeks

**Analysis Script Features:**

- Date range filtering: `--from 2025-10-01 --to 2025-11-07`
- Output format: `--format json|csv|markdown`
- Metric selection: `--metrics success-rate,labels,time-to-ready`
- Visualization: Generate charts using ASCII art or export data for external tools

### Dependencies

- Requires modification to `scripts/pm-review.js` to add logging
- Consider using a lightweight logging library (winston, pino) or custom JSON logger

### Risk Level

Low - logging is non-blocking and doesn't affect PM review functionality if it fails.

### Size Estimate

Medium - approximately 300-400 lines:

- 100 lines for instrumentation (logging in pm-review.js)
- 200-300 lines for analysis script with reporting
