// Demo script to show how weeks increment works when resources match
const fs = require("fs");

// Sample current resources (simulating week 1)
const currentResources = [
  {
    title: "GitHub Copilot: The Complete Guide",
    type: "Book",
    weeks_on_list: 1,
    quality_score: 88,
  },
  {
    title: "Prompt Engineering for Developers",
    type: "Article",
    weeks_on_list: 1,
    quality_score: 93,
  },
];

// Sample new resources (simulating week 2 generation)
const newResources = [
  {
    title: "GitHub Copilot: The Complete Guide", // MATCH!
    type: "Book",
    weeks_on_list: 1,
    quality_score: 90,
  },
  {
    title: "Advanced AI Coding Techniques",
    type: "Article",
    weeks_on_list: 1,
    quality_score: 85,
  },
  {
    title: "Prompt Engineering for Developers", // MATCH!
    type: "Article",
    weeks_on_list: 1,
    quality_score: 94,
  },
];

console.log("🔍 Demo: How Weeks Increment When Resources Match\n");

console.log("📊 Current Resources (Week 1):");
currentResources.forEach((resource, i) => {
  console.log(
    `   ${i + 1}. "${resource.title}" - Week ${resource.weeks_on_list}`
  );
});

console.log("\n🆕 Newly Generated Resources (Week 2):");
newResources.forEach((resource, i) => {
  console.log(
    `   ${i + 1}. "${resource.title}" - Generated with score ${
      resource.quality_score
    }`
  );
});

// Simulate the merge logic
const mergedResources = [];
const processedTitles = new Set();

// First, handle matches (increment weeks)
newResources.forEach((newResource) => {
  const existingResource = currentResources.find(
    (current) => current.title.toLowerCase() === newResource.title.toLowerCase()
  );

  if (existingResource && !processedTitles.has(newResource.title)) {
    mergedResources.push({
      ...existingResource,
      weeks_on_list: existingResource.weeks_on_list + 1,
      quality_score: Math.max(
        existingResource.quality_score,
        newResource.quality_score
      ),
    });
    processedTitles.add(newResource.title);
    console.log(
      `\n✅ MATCH FOUND: "${newResource.title}" -> Week ${
        existingResource.weeks_on_list + 1
      }`
    );
  }
});

// Then add new resources
newResources.forEach((newResource) => {
  if (!processedTitles.has(newResource.title)) {
    mergedResources.push(newResource);
    processedTitles.add(newResource.title);
    console.log(`\n🆕 NEW: "${newResource.title}" -> Week 1`);
  }
});

// Add remaining current resources that didn't match
currentResources.forEach((currentResource) => {
  if (!processedTitles.has(currentResource.title)) {
    mergedResources.push(currentResource);
    processedTitles.add(currentResource.title);
    console.log(
      `\n⏭️ CONTINUING: "${currentResource.title}" -> Week ${currentResource.weeks_on_list}`
    );
  }
});

console.log("\n🎯 Final Merged Results:");
mergedResources
  .sort((a, b) => b.quality_score - a.quality_score)
  .forEach((resource, i) => {
    const badge = resource.weeks_on_list > 1 ? "🔥 POPULAR" : "🆕 NEW";
    console.log(
      `   ${i + 1}. "${resource.title}" - Week ${
        resource.weeks_on_list
      } ${badge}`
    );
  });

console.log("\n💡 Key Points:");
console.log("   • Matching titles increment weeks_on_list");
console.log("   • Popular resources (weeks > 1) get highlighted");
console.log("   • Quality scores are updated to the highest value");
console.log("   • In real usage, popular resources naturally recur over time");
