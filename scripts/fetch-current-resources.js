#!/usr/bin/env node

/**
 * Fetch current resources from GitHub Gist
 * 
 * This script fetches the existing resources.json from the configured GitHub Gist
 * and saves it to /tmp/current-resources.json for use by merge script.
 * 
 * Required environment variables:
 *   - GITHUB_GIST_TOKEN: Personal access token with gist permissions
 *   - GIST_ID: The ID of the target gist
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const GITHUB_GIST_TOKEN = process.env.GITHUB_GIST_TOKEN;
const GIST_ID = process.env.GIST_ID;

// Validate configuration
if (!GITHUB_GIST_TOKEN) {
  console.error('❌ Error: GITHUB_GIST_TOKEN environment variable is required');
  process.exit(1);
}

if (!GIST_ID) {
  console.error('❌ Error: GIST_ID environment variable is required');
  process.exit(1);
}

/**
 * Fetch current resources from gist
 */
async function fetchCurrentResources() {
  const gistUrl = `https://api.github.com/gists/${GIST_ID}`;

  console.log('📥 Fetching current resources from gist...');
  console.log(`   Gist ID: ${GIST_ID}`);

  try {
    const response = await fetch(gistUrl, {
      headers: {
        'Authorization': `token ${GITHUB_GIST_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'ai-practitioner-resources-automation'
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const gist = await response.json();
    
    // Look for resources.json in the gist files
    if (!gist.files || !gist.files['resources.json']) {
      console.log('⚠️  No existing resources.json found in gist, starting fresh');
      const emptyResources = { resources: [] };
      
      // Create /tmp directory if it doesn't exist
      const tmpDir = '/tmp';
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(tmpDir, 'current-resources.json'),
        JSON.stringify(emptyResources, null, 2)
      );
      
      console.log('✅ Created empty resources file');
      return emptyResources;
    }

    const resourcesContent = gist.files['resources.json'].content;
    const resources = JSON.parse(resourcesContent);

    // Create /tmp directory if it doesn't exist
    const tmpDir = '/tmp';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Write to temporary file
    fs.writeFileSync(
      path.join(tmpDir, 'current-resources.json'),
      JSON.stringify(resources, null, 2)
    );

    console.log('✅ Current resources fetched successfully');
    console.log(`   Resources count: ${resources.resources?.length || 0}`);

    return resources;
  } catch (error) {
    console.error('❌ Failed to fetch current resources:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('🚀 Fetch Current Resources Script\n');
  await fetchCurrentResources();
  console.log('\n✨ Done!\n');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
