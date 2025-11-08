### Description

Add retry logic to the PM review process to handle transient API failures when communicating with the Anthropic Claude API.

### Problem

Currently, if the Anthropic API call fails due to network issues, rate limiting, or temporary service interruptions, the PM review fails completely and leaves the issue in an inconsistent state. This requires manual intervention to re-trigger the review.

### Proposed Solution

Implement exponential backoff retry logic in `scripts/pm-review.js`:

- Retry failed API calls up to 3 times
- Use exponential backoff (1s, 2s, 4s delays)
- Distinguish between retryable errors (503, 429, network timeout) and non-retryable errors (401, 400)
- Log retry attempts for monitoring

### Acceptance Criteria

- [ ] Transient API failures are automatically retried up to 3 times
- [ ] Exponential backoff delays are implemented between retries
- [ ] Non-retryable errors (authentication, invalid request) fail immediately without retries
- [ ] All retry attempts are logged with clear messaging
- [ ] Final failure after all retries results in a helpful error message posted to the issue
- [ ] Success after retry is logged for monitoring purposes

### Technical Notes

Consider using a generic retry wrapper function that can be reused across other API-dependent scripts (issue-intake.js, rebalance-lanes.js).

### Dependencies

None - this is an enhancement to existing functionality.

### Risk Level

Low - additive change that improves reliability without changing core behavior.

### Size Estimate

Small - approximately 50-100 lines of code for retry logic and error classification.
