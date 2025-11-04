#!/usr/bin/env node

/**
 * Test script to validate template parsing without making API calls
 * 
 * This script validates that all templates can be properly parsed
 * without requiring a GitHub token.
 */

const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '..', '.github', 'ISSUE_TEMPLATE');

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
 * Read and validate all templates
 */
function validateTemplates() {
  console.log('🔍 Template Validation Test\n');
  console.log('Reading templates from:', TEMPLATES_DIR);
  console.log('='.repeat(70));
  
  const files = fs.readdirSync(TEMPLATES_DIR).filter(file => file.endsWith('.md'));
  
  console.log(`\nFound ${files.length} template files\n`);
  
  const templates = files.map((file, index) => {
    const filePath = path.join(TEMPLATES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    
    const template = {
      filename: file,
      title: frontmatter.title || file.replace('.md', ''),
      labels: Array.isArray(frontmatter.labels) ? frontmatter.labels : [],
      assignees: Array.isArray(frontmatter.assignees) ? frontmatter.assignees : 
                 (frontmatter.assignees ? frontmatter.assignees.split(',').map(a => a.trim()).filter(a => a) : []),
      bodyLength: body.length
    };
    
    console.log(`${index + 1}. ${file}`);
    console.log(`   Title: "${template.title}"`);
    console.log(`   Labels: [${template.labels.join(', ')}]`);
    console.log(`   Assignees: ${template.assignees.length > 0 ? template.assignees.join(', ') : '(none)'}`);
    console.log(`   Body length: ${template.bodyLength} characters`);
    console.log('');
    
    return template;
  });
  
  console.log('='.repeat(70));
  console.log('\n✅ Validation Summary\n');
  console.log(`Total templates: ${templates.length}`);
  console.log(`All templates parsed successfully!`);
  
  const totalLabels = templates.reduce((sum, t) => sum + t.labels.length, 0);
  const uniqueLabels = new Set(templates.flatMap(t => t.labels));
  
  console.log(`\n📊 Statistics:`);
  console.log(`   Total labels: ${totalLabels}`);
  console.log(`   Unique labels: ${uniqueLabels.size}`);
  console.log(`   Label types: ${Array.from(uniqueLabels).join(', ')}`);
  
  console.log(`\n✨ All templates are ready to be converted to issues!\n`);
}

// Run validation
validateTemplates();
