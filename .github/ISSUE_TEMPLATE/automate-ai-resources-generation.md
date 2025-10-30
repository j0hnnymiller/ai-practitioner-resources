---
name: Automate AI Resources Generation and Management
about: Create GitHub Action to automatically run the AI prompt weekly, manage resource aging, and update the gist
title: "Automation: Weekly AI Resources Generation with Gist Management"
labels: ["automation", "github-actions", "enhancement", "ai-integration"]
assignees: ""
---

## 🎯 Problem Statement

Currently, the AI Practitioner Resources list requires manual maintenance:

- **Manual AI Prompt Execution**: Someone must manually run the AI prompt from `ai-practitioner-resources-json.prompt.md`
- **Manual Week Management**: `weeks_on_list` values must be manually incremented each week
- **Manual Gist Updates**: Results must be manually posted to GitHub Gist
- **No Historical Tracking**: No automated backup of weekly versions
- **Inconsistent Updates**: Depends on manual intervention for regular updates

## 💡 Proposed Solution

Create a **GitHub Action workflow** that runs weekly to:

1. **Execute AI Prompt**: Use AI API to run the resource generation prompt
2. **Manage Resource Aging**: Automatically match and increment `weeks_on_list` values
3. **Update Gist**: Post updated results to GitHub Gist automatically
4. **Archive Versions**: Maintain historical versions with timestamps
5. **Validate Results**: Ensure generated JSON conforms to schema

## 🛠️ Technical Implementation

### 1. GitHub Action Workflow Structure

```yaml
name: Weekly AI Resources Update

on:
  schedule:
    # Run every Monday at 9:00 AM UTC
    - cron: "0 9 * * 1"
  workflow_dispatch: # Allow manual triggering

env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  GIST_TOKEN: ${{ secrets_GIST_TOKEN }}
  GIST_ID: ${{ secrets.GIST_ID }}

jobs:
  update-resources:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install Dependencies
        run: npm install

      - name: Fetch Current Resources
        id: fetch-current
        run: node scripts/fetch-current-resources.js

      - name: Generate New Resources
        id: generate-new
        run: node scripts/generate-resources.js

      - name: Merge and Update Weeks
        id: merge-resources
        run: node scripts/merge-and-update.js

      - name: Validate Schema
        run: node scripts/validate-schema.js

      - name: Update Gist
        run: node scripts/update-gist.js

      - name: Create Summary
        run: node scripts/create-summary.js
```

### 2. Required Scripts Implementation

#### `scripts/fetch-current-resources.js`

```javascript
const fetch = require("node-fetch");

async function fetchCurrentResources() {
  const gistUrl = `https://api.github.com/gists/${process.env.GIST_ID}`;

  try {
    const response = await fetch(gistUrl, {
      headers: {
        Authorization: `token ${process.env.GIST_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const gist = await response.json();
    const resourcesContent = gist.files["resources.json"].content;

    return JSON.parse(resourcesContent);
  } catch (error) {
    console.log("No existing resources found, starting fresh");
    return { resources: [] };
  }
}
```

#### `scripts/generate-resources.js`

```javascript
const { OpenAI } = require("openai");
const fs = require("fs");

async function generateResources() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Read the prompt file
  const promptContent = fs.readFileSync(
    ".github/instructions/ai-practitioner-resources-json.prompt.md",
    "utf8"
  );

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant that generates JSON data according to schemas. Return only valid JSON with no additional text.",
      },
      {
        role: "user",
        content: promptContent,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const jsonResponse = completion.choices[0].message.content;

  // Parse and validate JSON
  try {
    const resources = JSON.parse(jsonResponse);

    // Write to temporary file
    fs.writeFileSync(
      "/tmp/new-resources.json",
      JSON.stringify(resources, null, 2)
    );

    return resources;
  } catch (error) {
    throw new Error(`Invalid JSON generated: ${error.message}`);
  }
}
```

#### `scripts/merge-and-update.js`

```javascript
const fs = require("fs");

function mergeAndUpdateResources() {
  const currentResources = JSON.parse(
    fs.readFileSync("/tmp/current-resources.json", "utf8")
  );
  const newResources = JSON.parse(
    fs.readFileSync("/tmp/new-resources.json", "utf8")
  );

  // Create a map of current resources by title and source for matching
  const currentResourcesMap = new Map();

  if (currentResources.resources) {
    currentResources.resources.forEach((resource) => {
      const key = `${resource.title}||${resource.source}`;
      currentResourcesMap.set(key, resource);
    });
  }

  // Update weeks_on_list for matching resources
  newResources.resources.forEach((newResource) => {
    const key = `${newResource.title}||${newResource.source}`;
    const existingResource = currentResourcesMap.get(key);

    if (existingResource) {
      // Resource exists, increment weeks_on_list
      newResource.weeks_on_list = existingResource.weeks_on_list + 1;
    } else {
      // New resource, set to 1
      newResource.weeks_on_list = 1;
    }
  });

  // Write merged result
  fs.writeFileSync(
    "/tmp/merged-resources.json",
    JSON.stringify(newResources, null, 2)
  );

  return newResources;
}
```

#### `scripts/update-gist.js`

```javascript
const fetch = require("node-fetch");
const fs = require("fs");

async function updateGist() {
  const mergedResources = fs.readFileSync("/tmp/merged-resources.json", "utf8");
  const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  const gistUrl = `https://api.github.com/gists/${process.env.GIST_ID}`;

  const updateData = {
    files: {
      "resources.json": {
        content: mergedResources,
      },
      [`resources.${timestamp}.json`]: {
        content: mergedResources,
      },
    },
  };

  const response = await fetch(gistUrl, {
    method: "PATCH",
    headers: {
      Authorization: `token ${process.env.GIST_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to update gist: ${response.status} ${response.statusText}`
    );
  }

  console.log("✅ Gist updated successfully");
  console.log(`📁 Current version: resources.json`);
  console.log(`📁 Archived version: resources.${timestamp}.json`);
}
```

### 3. Package.json Dependencies

```json
{
  "name": "ai-practitioner-resources-automation",
  "private": true,
  "scripts": {
    "fetch-current": "node scripts/fetch-current-resources.js",
    "generate": "node scripts/generate-resources.js",
    "merge": "node scripts/merge-and-update.js",
    "validate": "node scripts/validate-schema.js",
    "update-gist": "node scripts/update-gist.js",
    "run-automation": "npm run fetch-current && npm run generate && npm run merge && npm run validate && npm run update-gist"
  },
  "dependencies": {
    "openai": "^4.20.0",
    "node-fetch": "^2.7.0",
    "ajv": "^8.12.0"
  }
}
```

## 🔐 Required GitHub Secrets

### 1. OpenAI API Integration

- **`OPENAI_API_KEY`**: API key for OpenAI GPT-4 access
- **Alternative**: `ANTHROPIC_API_KEY` for Claude API
- **Alternative**: `AZURE_OPENAI_KEY` + `AZURE_OPENAI_ENDPOINT`

### 2. GitHub Gist Management

- **`GIST_TOKEN`**: Personal Access Token with gist permissions
- **`GIST_ID`**: The ID of the target gist for resource storage

### 3. Configuration Secrets

- **`GIST_URL`** (optional): Full gist raw URL for validation

## ⚙️ Configuration Options

### AI Provider Configuration

```yaml
# Environment variables for different AI providers
AI_PROVIDER: "openai" # openai, anthropic, azure
MODEL_NAME: "gpt-4-turbo-preview"
MAX_TOKENS: 4000
TEMPERATURE: 0.7
```

### Scheduling Configuration

```yaml
# Cron schedules for different update frequencies
WEEKLY_SCHEDULE: "0 9 * * 1" # Monday 9 AM UTC
BIWEEKLY_SCHEDULE: "0 9 * * 1/2" # Every other Monday
MONTHLY_SCHEDULE: "0 9 1 * *" # First of month
```

## 🔄 Workflow Logic

### 1. Resource Matching Algorithm

```
For each new resource:
  - Create matching key: title + source URL
  - Look for existing resource with same key
  - If found: increment weeks_on_list
  - If not found: set weeks_on_list = 1
```

### 2. Quality Assurance

- **Schema Validation**: Ensure JSON matches schema before upload
- **Duplicate Detection**: Identify and handle duplicate resources
- **URL Validation**: Verify all source URLs are accessible
- **Score Validation**: Ensure scores are within 0-100 range

### 3. Error Handling

- **API Failures**: Retry with exponential backoff
- **JSON Parse Errors**: Log and fail gracefully
- **Gist Update Failures**: Preserve current state, send notifications

## ✅ Acceptance Criteria

### Functional Requirements

- [ ] GitHub Action runs automatically every Monday at 9 AM UTC
- [ ] Successfully calls AI API with the current prompt
- [ ] Matches existing resources and increments `weeks_on_list`
- [ ] Updates gist with both `resources.json` and timestamped version
- [ ] Validates generated JSON against schema before upload
- [ ] Handles errors gracefully without breaking the workflow

### Quality Requirements

- [ ] All API calls include proper authentication
- [ ] Generated JSON passes schema validation 100% of the time
- [ ] Resource matching accuracy > 95% for identical resources
- [ ] Workflow completes within 5 minutes under normal conditions
- [ ] Proper logging for debugging and monitoring

### Security Requirements

- [ ] All API keys stored as GitHub secrets
- [ ] No sensitive data logged in workflow output
- [ ] Minimal required permissions for tokens
- [ ] Secure handling of temporary files

## 📊 Monitoring and Alerts

### Success Metrics

- **Completion Rate**: Percentage of successful weekly runs
- **Resource Match Rate**: Accuracy of week increment logic
- **Generation Quality**: AI-generated content quality scores
- **Update Latency**: Time from generation to gist update

### Failure Notifications

```yaml
- name: Notify on Failure
  if: failure()
  uses: actions/create-issue@v1
  with:
    title: "Weekly Resources Update Failed"
    body: "The automated resources update workflow failed. Check logs for details."
    labels: "automation,bug,urgent"
```

## 🔧 Advanced Features

### 1. Multi-AI Provider Support

- Support for OpenAI, Anthropic Claude, and Azure OpenAI
- Fallback providers if primary fails
- A/B testing of different AI models

### 2. Content Enhancement

- Automatic URL validation and cleanup
- Duplicate resource detection and merging
- Quality score normalization across weeks

### 3. Analytics Integration

- Track resource popularity over time
- Generate weekly summary reports
- Monitor list composition changes

### 4. Manual Override

- GitHub issue templates for manual resource additions
- Web interface for resource management
- Emergency stop mechanisms

## 📋 Implementation Phases

### Phase 1: Basic Automation (Week 1-2)

- [ ] Create GitHub Action workflow
- [ ] Implement AI API integration
- [ ] Add basic gist update functionality

### Phase 2: Resource Management (Week 3-4)

- [ ] Implement resource matching logic
- [ ] Add weeks_on_list increment functionality
- [ ] Create timestamped archive system

### Phase 3: Quality & Monitoring (Week 5-6)

- [ ] Add comprehensive error handling
- [ ] Implement schema validation
- [ ] Create monitoring and alerting

### Phase 4: Advanced Features (Week 7-8)

- [ ] Multi-AI provider support
- [ ] Enhanced content processing
- [ ] Analytics and reporting

---

**🚀 This automation will transform the AI Practitioner Resources from a manual curation process to a fully automated, intelligent system that maintains quality while reducing maintenance overhead.**

## 💡 Additional Considerations

- **Cost Management**: Monitor AI API usage and costs
- **Rate Limiting**: Respect API rate limits with proper delays
- **Backup Strategy**: Maintain multiple backup copies of resource data
- **Version Control**: Track changes and allow rollbacks if needed
- **Community Input**: Consider allowing community contributions via issues/PRs
