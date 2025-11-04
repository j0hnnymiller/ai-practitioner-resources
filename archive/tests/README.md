# Tests Directory

This directory contains test scripts and test data for the AI Practitioner Resources project.

## Test Scripts

### Analysis Scripts
- **analyze-results.js** - Compare results from different automation runs
- **analyze-workflow.js** - Comprehensive analysis of workflow runs using artifacts
- **compare-chat-automation.js** - Compare chat-generated results with automation results
- **multi-run-analysis.js** - Multi-run analysis to verify matching logic and AI consistency

### Test Scripts
- **test-prompt-consistency.js** - Test script to simulate Claude API calls for consistency testing
- **test-prompt-local.js** - Local testing of the prompt system
- **test-increment-demo.js** - Test for weeks increment functionality
- **test-weeks-increment.js** - Additional weeks increment testing

## Test Data

### JSON Test Files
- **test-current-resources.json** - Sample current resources data for testing
- **test-new-resources.json** - Sample new resources data for testing
- **test-run-1.json**, **test-run-2.json**, **test-run-3.json** - Test run data snapshots

## Test Results

The `results/` subdirectory contains:
- **chat-generated-results.json** - Results from manual chat-based resource generation
- **run1/** through **run5/** - Historical test run artifacts with automation results

These results are excluded from version control via `.gitignore` as they are regenerated during testing.

## Running Tests

Most test scripts can be run directly with Node.js:

```bash
# From the repository root
node tests/test-prompt-consistency.js
node tests/analyze-results.js
node tests/compare-chat-automation.js
```

Some scripts may require environment variables (e.g., `ANTHROPIC_API_KEY`) to be set.
