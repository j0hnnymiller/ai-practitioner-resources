#!/usr/bin/env node

/**
 * Merge new resources with current resources and update weeks_on_list
 * 
 * This script:
 * 1. Reads current resources from /tmp/current-resources.json
 * 2. Reads new resources from /tmp/new-resources.json
 * 3. Matches resources by title and source
 * 4. Increments weeks_on_list for matching resources
 * 5. Sets weeks_on_list to 1 for new resources
 * 6. Writes merged result to /tmp/merged-resources.json
 */

const fs = require('fs');
const path = require('path');

// File paths
const CURRENT_RESOURCES_PATH = path.join('/tmp', 'current-resources.json');
const NEW_RESOURCES_PATH = path.join('/tmp', 'new-resources.json');
const MERGED_RESOURCES_PATH = path.join('/tmp', 'merged-resources.json');

/**
 * Merge and update resources
 */
function mergeAndUpdateResources() {
  console.log('🔄 Merging resources and updating weeks_on_list...');

  // Read files
  if (!fs.existsSync(CURRENT_RESOURCES_PATH)) {
    console.error('❌ Error: Current resources file not found at:', CURRENT_RESOURCES_PATH);
    process.exit(1);
  }

  if (!fs.existsSync(NEW_RESOURCES_PATH)) {
    console.error('❌ Error: New resources file not found at:', NEW_RESOURCES_PATH);
    process.exit(1);
  }

  const currentResources = JSON.parse(fs.readFileSync(CURRENT_RESOURCES_PATH, 'utf8'));
  const newResources = JSON.parse(fs.readFileSync(NEW_RESOURCES_PATH, 'utf8'));

  console.log(`   Current resources: ${currentResources.resources?.length || 0}`);
  console.log(`   New resources: ${newResources.resources?.length || 0}`);

  // Create a map of current resources by title and source for matching
  const currentResourcesMap = new Map();

  if (currentResources.resources && Array.isArray(currentResources.resources)) {
    currentResources.resources.forEach(resource => {
      // Use title and source as composite key for matching
      const key = `${resource.title}||${resource.source}`;
      currentResourcesMap.set(key, resource);
    });
  }

  console.log(`   Resources in map: ${currentResourcesMap.size}`);

  // Update weeks_on_list for matching resources
  let matched = 0;
  let newCount = 0;

  if (newResources.resources && Array.isArray(newResources.resources)) {
    newResources.resources.forEach(newResource => {
      const key = `${newResource.title}||${newResource.source}`;
      const existingResource = currentResourcesMap.get(key);

      if (existingResource) {
        // Resource exists, increment weeks_on_list
        newResource.weeks_on_list = (existingResource.weeks_on_list || 1) + 1;
        matched++;
      } else {
        // New resource, set to 1
        newResource.weeks_on_list = 1;
        newCount++;
      }
    });
  }

  console.log(`   Matched resources: ${matched}`);
  console.log(`   New resources: ${newCount}`);

  // Create /tmp directory if it doesn't exist
  const tmpDir = '/tmp';
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Write merged result
  fs.writeFileSync(
    MERGED_RESOURCES_PATH,
    JSON.stringify(newResources, null, 2)
  );

  console.log('✅ Resources merged successfully');
  console.log(`   Output: ${MERGED_RESOURCES_PATH}`);

  return newResources;
}

// Main execution
function main() {
  console.log('🚀 Merge and Update Resources Script\n');
  mergeAndUpdateResources();
  console.log('\n✨ Done!\n');
}

main();
