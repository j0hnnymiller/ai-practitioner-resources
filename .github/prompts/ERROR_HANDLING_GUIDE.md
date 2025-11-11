# Error Handling and Recovery Guide

This document outlines error handling strategies for the PM system, with a focus on Anthropic API failures and recovery options.

## Anthropic API Error Handling

### Retry Logic Implementation

The `pm-review.js` script now includes automatic retry logic for Anthropic API failures with exponential backoff.

#### Retry Strategy

```javascript
// Exponential backoff: 1s, 2s, 4s, max 10s
const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
```

**Default Configuration:**
- **Max Retries:** 3 attempts
- **Backoff:** Exponential with jitter (1s → 2s → 4s, capped at 10s)
- **Total Max Time:** ~17 seconds for all retries

#### Error Classification

**Retriable Errors (will retry automatically):**
- `429 Too Many Requests` - Rate limiting
- `500 Internal Server Error` - Anthropic service issue
- `502 Bad Gateway` - Temporary proxy/gateway issue
- `503 Service Unavailable` - Temporary overload
- `504 Gateway Timeout` - Request timeout
- Network timeouts and connection resets

**Non-Retriable Errors (fail immediately):**
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Invalid API key
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Invalid endpoint
- `ENOTFOUND` - DNS resolution failure
- `ECONNREFUSED` - Connection refused

### Recovery Options

When Anthropic API calls fail after all retries, the system provides several recovery mechanisms:

#### 1. Graceful Degradation

If `ANTHROPIC_API_KEY` is not set or API fails permanently, the workflow continues without AI review:

```javascript
if (!apiKey) {
  return {
    skipped: true,
    content: "Copilot PM review skipped: ANTHROPIC_API_KEY is not configured..."
  };
}
```

**Fallback Behavior:**
- Issue intake still proceeds
- Project board is updated
- Manual review comment is posted
- Labels are NOT automatically applied
- Human PM must manually triage

#### 2. Manual Override

**If automated review fails, humans can:**

```bash
# Add labels manually using gh CLI
gh issue edit <number> \
  --add-label "size:medium" \
  --add-label "priority:65" \
  --add-label "independence:high" \
  --add-label "risk:low" \
  --add-label "feature" \
  --add-label "needs-clarification"

# Or use the GitHub web interface
# Go to issue → Labels → Select appropriate labels
```

#### 3. Local Script Retry

Run the PM review script locally with full error context:

```bash
# Set up environment
export ANTHROPIC_API_KEY="your-key"
export GITHUB_TOKEN="your-token"
export GITHUB_REPOSITORY="owner/repo"

# Create event payload JSON
echo '{"issue":{"number":123}}' > /tmp/event.json
export GITHUB_EVENT_PATH=/tmp/event.json

# Run review locally
node scripts/pm-review.js
```

This provides:
- Detailed error messages
- Ability to debug API issues
- Manual retry with different parameters

#### 4. Alternative Model Fallback

If the primary model fails consistently, configure a fallback:

**Environment Variable:**
```bash
export PM_MODEL="claude-sonnet-3-5-20241022"  # Older, more stable version
```

**Or in workflow:**
```yaml
env:
  PM_MODEL: claude-sonnet-3-5-20241022  # Fallback to earlier version
```

#### 5. Scheduled Retry Workflow

For critical issues that must be reviewed, create a retry workflow:

```yaml
name: Retry Failed PM Reviews

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:

jobs:
  retry-reviews:
    runs-on: ubuntu-latest
    steps:
      - name: Find issues without required labels
        run: |
          # Find issues missing size/priority/independence labels
          gh issue list --state open --json number,labels \
            --jq '.[] | select(.labels | map(.name) | 
                 (contains(["size:small","size:medium","size:large"]) | not))' \
            > needs_review.json
      
      - name: Retry PM review for each
        run: |
          # Re-trigger intake workflow for each issue
          cat needs_review.json | jq -r '.number' | while read num; do
            gh workflow run issue-intake.yml -f issue_number=$num
          done
```

## Error Monitoring and Alerts

### Logging Best Practices

The retry logic includes informative logging:

```javascript
console.warn(
  `Anthropic API error (attempt ${attempt}/${maxRetries}), retrying in ${backoffMs}ms...`
);
```

**What to monitor:**
- Retry frequency (high frequency = service degradation)
- Final failure rate (high rate = configuration issue)
- Specific error codes (patterns indicate root cause)

### Setting Up Alerts

**GitHub Actions:**
- Review workflow run logs for `Anthropic API error` warnings
- Set up notifications for failed workflow runs

**External Monitoring:**
- Use GitHub webhook to send failure events to monitoring service
- Track API error rates over time
- Alert on consecutive failures (3+ in a row)

### Common Error Scenarios and Solutions

#### Rate Limiting (429)

**Symptom:** `429 Too Many Requests` errors during high activity

**Solutions:**
1. **Immediate:** Automatic retry with backoff handles most cases
2. **Short-term:** Reduce concurrent issue creation
3. **Long-term:** 
   - Implement request queue with rate limiting
   - Upgrade Anthropic API tier if available
   - Use batch review for multiple issues

#### API Key Issues (401/403)

**Symptom:** `401 Unauthorized` or `403 Forbidden` errors

**Solutions:**
1. Verify `ANTHROPIC_API_KEY` secret is set correctly
2. Check API key hasn't expired
3. Ensure key has correct permissions
4. Rotate key if compromised

#### Timeout Issues (504)

**Symptom:** `504 Gateway Timeout` or request hangs

**Solutions:**
1. **Immediate:** Retry automatically handles this
2. **Configuration:** Increase `max_tokens` limit may help
3. **Optimization:** Reduce prompt length if consistently timing out
4. **Diagnosis:** Check Anthropic status page for service issues

#### JSON Parsing Failures

**Symptom:** "Failed to parse PM review JSON" error

**Solutions:**
1. Review prompt to ensure it requests valid JSON
2. Add JSON validation to prompt instructions
3. Implement fallback parser that extracts JSON from markdown fences
4. Log raw response for debugging

#### Network Connectivity Issues

**Symptom:** `ENOTFOUND`, `ECONNREFUSED`, or other network errors

**Solutions:**
1. Check GitHub Actions runner network connectivity
2. Verify Anthropic API endpoint is accessible
3. Check for firewall/proxy restrictions
4. Use `curl` or `wget` to test endpoint manually

## Configuration Options

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...           # API key for Claude access

# Optional tuning
PM_MODEL=claude-sonnet-4-5-20250929    # Model version
MAX_RETRIES=3                           # Number of retry attempts (future)
RETRY_BACKOFF_MS=1000                   # Initial backoff time (future)
REQUEST_TIMEOUT_MS=30000                # Request timeout (future)
```

### Workflow Configuration

**In `.github/workflows/issue-intake.yml`:**

```yaml
- name: Copilot PM review (AI)
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    PM_MODEL: claude-sonnet-4-5-20250929
    # Add future tuning parameters here
  run: node scripts/pm-review.js
  continue-on-error: true  # Don't fail entire workflow on PM error
```

**`continue-on-error: true`** ensures:
- Issue intake completes even if PM review fails
- Project board updates happen regardless
- Manual review is still possible

## Testing Error Handling

### Unit Testing Retry Logic

```bash
# Simulate rate limit error
export ANTHROPIC_API_KEY="invalid-key-for-test"
node scripts/pm-review.js

# Should see retry attempts and eventual failure with helpful message
```

### Integration Testing

```bash
# Test full workflow with retry
gh workflow run issue-intake.yml

# Monitor logs for retry behavior
gh run list --workflow=issue-intake.yml
gh run view <run-id> --log
```

### Load Testing

```bash
# Create multiple issues quickly to trigger rate limits
for i in {1..10}; do
  gh issue create --title "Test issue $i" --body "Testing rate limit handling"
  sleep 2
done

# Review workflow logs to verify retry behavior
```

## Future Enhancements

### Planned Improvements

1. **Configurable Retry Params**
   - Environment variables for `MAX_RETRIES`, `BACKOFF_MS`
   - Per-error-type retry strategies

2. **Circuit Breaker Pattern**
   - Temporarily disable API calls after sustained failures
   - Automatic re-enable after cooldown period

3. **Fallback to Simpler Prompt**
   - If full review fails, try simpler label-only review
   - Progressive degradation of features

4. **Queued Retry Mechanism**
   - Store failed reviews in queue
   - Background job processes queue periodically

5. **Health Check Endpoint**
   - Pre-flight check of Anthropic API availability
   - Skip review if API is down (vs. failing)

6. **Metrics and Dashboards**
   - Track success/failure rates
   - Visualize retry patterns
   - Alert on anomalies

## See Also

- [PM Review Script](../../scripts/pm-review.js)
- [Issue Intake Workflow](../workflows/issue-intake.yml)
- [PM Modes Overview](./modes/PM_MODES_OVERVIEW.md)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference/errors)
