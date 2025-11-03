/**
 * Data processing and transformation utilities
 */

/**
 * Sort resources by highest score (descending)
 * @param {Array} resources - Array of resource objects
 * @returns {Array} Sorted array of resources
 */
export function sortByHighestScore(resources) {
  return [...resources].sort(
    (a, b) =>
      (b.highest_score || b.score || 0) - (a.highest_score || a.score || 0)
  );
}

/**
 * Extract unique resource types from resources array
 * @param {Array} resources - Array of resource objects
 * @returns {Array} Array of unique types
 */
export function getUniqueTypes(resources) {
  return [...new Set(resources.map((r) => r.type))];
}

/**
 * Calculate average score from resources
 * @param {Array} resources - Array of resource objects
 * @returns {number} Average score (rounded)
 */
export function calculateAverageScore(resources) {
  if (!resources || resources.length === 0) return 0;
  
  const sum = resources.reduce(
    (sum, r) => sum + (r.overall_score || r.score || 0),
    0
  );
  return Math.round(sum / resources.length);
}

/**
 * Get highest score from resources
 * @param {Array} resources - Array of resource objects
 * @returns {number} Highest score
 */
export function getHighestScore(resources) {
  if (!resources || resources.length === 0) return 0;
  
  return Math.max(
    ...resources.map((r) => r.highest_score || r.score || 0)
  );
}

/**
 * Count resources by type
 * @param {Array} resources - Array of resource objects
 * @param {Array} types - Array of type strings
 * @returns {Object} Object mapping type to count
 */
export function countByType(resources, types) {
  const counts = {};
  types.forEach((type) => {
    counts[type] = resources.filter((r) => r.type === type).length;
  });
  return counts;
}

/**
 * Get main score from resource (handles different score field names)
 * @param {Object} resource - Resource object
 * @returns {number} Main score value
 */
export function getMainScore(resource) {
  return resource.highest_score || resource.score || 0;
}
