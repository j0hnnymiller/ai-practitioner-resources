#!/usr/bin/env node

/**
 * Script to create GitHub issues from issue templates
 * 
 * This script reads all markdown files from .github/ISSUE_TEMPLATE/
 * and creates GitHub issues using the GitHub API.
 * 
 * Usage:
 *   GITHUB_TOKEN=your_token node scripts/create-issues-from-templates.js
 * 
 * Required environment variables:
 *   - GITHUB_TOKEN: Personal access token with 'repo' scope
 *   - GITHUB_REPOSITORY: Repository in format 'owner/repo' (optional, auto-detected in CI)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const TEMPLATES_DIR = path.join(__dirname, '..', '.github', 'ISSUE_TEMPLATE');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY || 'j0hnnymiller/ai-practitioner-resources';
const [REPO_OWNER, REPO_NAME] = GITHUB_REPOSITORY.split('/');

// Validate configuration
if (!GITHUB_TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN environment variable is required');
  console.error('Please provide a GitHub personal access token with "repo" scope');
  console.error('Usage: GITHUB_TOKEN=your_token node scripts/create-issues-from-templates.js');
  process.exit(1);
}

if (!REPO_OWNER || !REPO_NAME) {
  console.error('❌ Error: Invalid GITHUB_REPOSITORY format');
  console.error('Expected format: owner/repo');
  process.exit(1);
}

/**
 * Parse YAML frontmatter from markdown file
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { frontmatter: {}, body: content };
  }
  
  const [, frontmatterText, body] = match;
  const frontmatter = {};
  
  // Parse YAML-like frontmatter
  frontmatterText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Remove quotes
      value = value.replace(/^["']|["']$/g, '');
      
      // Parse arrays (labels)
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, '')).filter(v => v);
      }
      
      frontmatter[key] = value;
    }
  });
  
  return { frontmatter, body: body.trim() };
}

/**
 * Read all issue templates
 */
function readTemplates() {
  console.log('📂 Reading issue templates from:', TEMPLATES_DIR);
  
  const files = fs.readdirSync(TEMPLATES_DIR).filter(file => file.endsWith('.md'));
  
  console.log(`Found ${files.length} template files:`);
  files.forEach(file => console.log(`  - ${file}`));
  
  return files.map(file => {
    const filePath = path.join(TEMPLATES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    
    return {
      filename: file,
      title: frontmatter.title || file.replace('.md', ''),
      labels: Array.isArray(frontmatter.labels) ? frontmatter.labels : [],
      assignees: Array.isArray(frontmatter.assignees) ? frontmatter.assignees :
                 (frontmatter.assignees ? frontmatter.assignees.split(',').map(a => a.trim()).filter(a => a) : []),
      body: body
    };
  });
}

/**
 * Make GitHub API request
 */
function makeGitHubRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'User-Agent': 'create-issues-script',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} - ${responseData}`));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Check if an issue with the same title already exists
 */
async function checkExistingIssue(title) {
  try {
    const encodedTitle = encodeURIComponent(title);
    const searchPath = `/search/issues?q=${encodedTitle}+in:title+repo:${REPO_OWNER}/${REPO_NAME}+type:issue`;
    const result = await makeGitHubRequest(searchPath, 'GET');
    
    // Check if any of the results match the exact title
    const exactMatch = result.items?.find(issue => issue.title === title);
    return exactMatch || null;
  } catch (error) {
    console.warn(`⚠️  Warning: Could not check for existing issue: ${error.message}`);
    return null;
  }
}

/**
 * Create a GitHub issue
 */
async function createIssue(template) {
  console.log(`\n📝 Processing: ${template.title}`);
  
  // Check if issue already exists
  const existingIssue = await checkExistingIssue(template.title);
  if (existingIssue) {
    console.log(`⏭️  Skipped: Issue already exists (#${existingIssue.number})`);
    console.log(`   URL: ${existingIssue.html_url}`);
    return { skipped: true, issue: existingIssue };
  }
  
  const issueData = {
    title: template.title,
    body: template.body,
    labels: template.labels,
  };
  
  // Only add assignees if they are valid
  if (template.assignees && template.assignees.length > 0) {
    issueData.assignees = template.assignees;
  }
  
  try {
    const issue = await makeGitHubRequest(
      `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
      'POST',
      issueData
    );
    
    console.log(`✅ Created: Issue #${issue.number}`);
    console.log(`   URL: ${issue.html_url}`);
    
    return { created: true, issue };
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return { failed: true, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 GitHub Issue Creator from Templates\n');
  console.log(`Repository: ${REPO_OWNER}/${REPO_NAME}`);
  console.log('='.repeat(60));
  
  // Read templates
  const templates = readTemplates();
  
  console.log('\n' + '='.repeat(60));
  console.log('Creating issues...\n');
  
  // Create issues
  const results = {
    created: [],
    skipped: [],
    failed: []
  };
  
  for (const template of templates) {
    const result = await createIssue(template);
    
    if (result.created) {
      results.created.push(result.issue);
    } else if (result.skipped) {
      results.skipped.push(result.issue);
    } else if (result.failed) {
      results.failed.push({ template: template.title, error: result.error });
    }
    
    // Rate limiting: wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary\n');
  console.log(`✅ Created: ${results.created.length} issue(s)`);
  console.log(`⏭️  Skipped: ${results.skipped.length} issue(s) (already exist)`);
  console.log(`❌ Failed:  ${results.failed.length} issue(s)`);
  
  if (results.created.length > 0) {
    console.log('\n📝 Created Issues:');
    results.created.forEach(issue => {
      console.log(`   - #${issue.number}: ${issue.title}`);
      console.log(`     ${issue.html_url}`);
    });
  }
  
  if (results.skipped.length > 0) {
    console.log('\n⏭️  Skipped Issues (Already Exist):');
    results.skipped.forEach(issue => {
      console.log(`   - #${issue.number}: ${issue.title}`);
      console.log(`     ${issue.html_url}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed Issues:');
    results.failed.forEach(item => {
      console.log(`   - ${item.template}: ${item.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Done!\n');
  
  // Exit with error code if any failed
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
