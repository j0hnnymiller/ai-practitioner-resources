/**
 * Filtering logic for resources
 */

/**
 * Filter resources by type
 * @param {Array} resources - Array of resource objects
 * @param {string} type - Type to filter by, or "All" for all resources
 * @returns {Array} Filtered array of resources
 */
export function filterByType(resources, type) {
  if (type === "All") {
    return resources;
  }
  return resources.filter((r) => r.type === type);
}

/**
 * Filter resources by search term
 * @param {Array} resources - Array of resource objects
 * @param {string} searchTerm - Search term to match
 * @returns {Array} Filtered array of resources
 */
export function filterBySearch(resources, searchTerm) {
  if (!searchTerm) return resources;
  
  const term = searchTerm.toLowerCase();
  return resources.filter(
    (r) =>
      r.title?.toLowerCase().includes(term) ||
      r.blurb?.toLowerCase().includes(term) ||
      r.type?.toLowerCase().includes(term)
  );
}

/**
 * Filter resources by multiple criteria
 * @param {Array} resources - Array of resource objects
 * @param {Object} criteria - Filter criteria object
 * @param {string} criteria.type - Type to filter by
 * @param {string} criteria.search - Search term
 * @returns {Array} Filtered array of resources
 */
export function filterResources(resources, criteria = {}) {
  let filtered = resources;
  
  if (criteria.type) {
    filtered = filterByType(filtered, criteria.type);
  }
  
  if (criteria.search) {
    filtered = filterBySearch(filtered, criteria.search);
  }
  
  return filtered;
}
