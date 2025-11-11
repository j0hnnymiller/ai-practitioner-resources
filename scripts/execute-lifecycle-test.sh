#!/bin/bash

# Issue Lifecycle Test - Execution Wrapper
# This script checks for authentication and executes the test appropriately

set -e

REPO_DIR="/home/runner/work/ai-practitioner-resources/ai-practitioner-resources"
cd "$REPO_DIR"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   Issue Lifecycle Test - Automated Execution                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check for GITHUB_TOKEN
if [ -n "$GITHUB_TOKEN" ]; then
    echo "✓ GITHUB_TOKEN detected"
    echo "  Executing live test with real issue creation..."
    echo ""
    exec npm run test-lifecycle
elif gh auth status >/dev/null 2>&1; then
    echo "✓ GitHub CLI authenticated"
    echo "  Executing test with gh CLI..."
    echo ""
    exec ./scripts/test-issue-lifecycle.sh
else
    echo "❌ No authentication found"
    echo ""
    echo "To execute the live test, choose one of:"
    echo ""
    echo "1. Set GITHUB_TOKEN environment variable:"
    echo "   export GITHUB_TOKEN=\"ghp_your_token_here\""
    echo "   npm run test-lifecycle"
    echo ""
    echo "2. Authenticate GitHub CLI:"
    echo "   gh auth login"
    echo "   ./scripts/test-issue-lifecycle.sh"
    echo ""
    echo "3. Use GitHub Actions workflow:"
    echo "   Go to Actions tab → Test Issue Lifecycle → Run workflow"
    echo ""
    echo "For now, running dry-run validation..."
    echo ""
    exec npm run test-lifecycle-dry
fi
