# Weekly AI Resources Automation - Setup Guide

This guide will help you set up the automated weekly AI resources generation system.

## Prerequisites

- A GitHub account
- An OpenAI account with API access (GPT-4)
- A GitHub Gist to store your resources

## Step-by-Step Setup

### 1. Create a GitHub Gist

1. Go to https://gist.github.com/
2. Create a new gist with a file named `resources.json`
3. Add initial content (can be empty JSON: `{"resources":[]}`)
4. Note the Gist ID from the URL (e.g., `https://gist.github.com/username/abc123def456` → ID is `abc123def456`)

### 2. Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name: "AI Resources Automation"
4. Select **only** the `gist` scope (read and write gists)
5. Click "Generate token"
6. **Copy the token immediately** - you won't be able to see it again!

### 3. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Give it a name: "AI Resources Automation"
4. Copy the API key immediately

### 4. Configure Repository Secrets

1. In your GitHub repository, go to Settings → Secrets and variables → Actions
2. Click "New repository secret" and add three secrets:

   - **Name:** `OPENAI_API_KEY`  
     **Value:** Your OpenAI API key from step 3

   - **Name:** `GITHUB_GIST_TOKEN`  
     **Value:** Your GitHub personal access token from step 2

   - **Name:** `GIST_ID`  
     **Value:** Your Gist ID from step 1

### 5. Verify Setup

1. Go to the Actions tab in your repository
2. Select "Weekly AI Resources Update" workflow
3. Click "Run workflow" dropdown
4. Click the "Run workflow" button
5. Wait for the workflow to complete
6. Check your gist - it should be updated with new resources!

## Troubleshooting

### Workflow Fails at "Generate New Resources"

**Problem:** OpenAI API key is invalid or has no credits  
**Solution:** 
- Verify your OpenAI API key is correct
- Check your OpenAI account has available credits
- Ensure you have access to GPT-4 models

### Workflow Fails at "Fetch Current Resources"

**Problem:** GitHub token doesn't have gist permissions or Gist ID is wrong  
**Solution:**
- Verify the Gist ID is correct
- Ensure the GitHub token has the `gist` scope
- Check the gist exists and is accessible

### Workflow Fails at "Update Gist"

**Problem:** GitHub token permissions issue  
**Solution:**
- Regenerate the GitHub token with `gist` scope
- Update the `GITHUB_GIST_TOKEN` secret

### Resources Not Merging Correctly

**Problem:** Resources have the same title but different sources  
**Solution:**
- The merge logic matches on both title AND source
- If you want resources to be treated as the same, ensure both fields match exactly

## Advanced Configuration

### Change the Schedule

Edit `.github/workflows/weekly-ai-resources-update.yml`:

```yaml
on:
  schedule:
    # Change the cron schedule
    - cron: "0 9 * * 1"  # Monday at 9 AM UTC
    # Examples:
    # "0 9 * * 5"  # Friday at 9 AM UTC
    # "0 12 * * 1,4"  # Monday and Thursday at 12 PM UTC
    # "0 9 1 * *"  # First day of every month at 9 AM UTC
```

### Change the AI Model

Edit `scripts/generate-resources.js`:

```javascript
model: 'gpt-4-turbo-preview',  // Change to 'gpt-4', 'gpt-4-1106-preview', etc.
temperature: 0.7,               // Adjust creativity (0.0-2.0)
max_tokens: 4000,               // Adjust response length
```

### Local Testing

Test the automation locally before running in GitHub Actions:

```bash
# Set environment variables
export OPENAI_API_KEY="your-key-here"
export GITHUB_GIST_TOKEN="your-token-here"
export GIST_ID="your-gist-id"

# Install dependencies
npm install

# Run the complete automation
npm run run-automation
```

## Monitoring

### Check Workflow Runs

1. Go to Actions tab
2. Select "Weekly AI Resources Update"
3. View run history and logs

### Review Artifacts

After each run, artifacts are uploaded containing:
- `current-resources.json` - Resources before generation
- `new-resources.json` - Newly generated resources
- `merged-resources.json` - Final merged resources
- `automation-summary.json` - Statistics and summary

Download these to debug issues or review changes.

### GitHub Actions Summary

Each run creates a summary with:
- Resource counts and statistics
- Resource type distribution
- Score ranges and averages
- New vs continuing resources

## Cost Considerations

### OpenAI API Costs

- GPT-4 Turbo pricing: ~$0.01-0.03 per run (depending on prompt size and response length)
- Weekly runs: ~$0.50-1.50 per month
- Manual runs: Additional cost per execution

### GitHub Actions

- GitHub Actions is free for public repositories
- Private repositories have monthly free minutes (check your plan)

## Security Best Practices

1. **Never commit API keys** to the repository
2. **Use repository secrets** for all sensitive data
3. **Limit token permissions** to only what's needed (`gist` scope only)
4. **Rotate tokens regularly** (every 90 days recommended)
5. **Monitor API usage** to detect unauthorized access

## Support

If you encounter issues:

1. Check the workflow logs in the Actions tab
2. Review the troubleshooting section above
3. Download and inspect the artifacts
4. Verify all secrets are correctly configured
5. Test scripts locally with the same environment variables

## Next Steps

After successful setup:

1. Review the first automated generation
2. Adjust the AI prompt in `.github/instructions/ai-practitioner-resources-json.prompt.md` if needed
3. Customize the schedule to your preference
4. Monitor weekly runs to ensure quality
5. Consider implementing Phase 2+ features (see main README)
