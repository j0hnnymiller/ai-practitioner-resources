/**
 * Filter panel component
 */

import { getUniqueTypes, countByType } from "../core/data-processor.js";
import { setHTML } from "../utils/dom.js";

/**
 * Render filter buttons
 * @param {Array} resources - Array of resource objects
 * @param {Function} onFilterChange - Callback function when filter changes
 * @param {string} targetElementId - ID of target element (default: 'filters')
 */
export function renderFilters(
  resources,
  onFilterChange,
  targetElementId = "filters"
) {
  const types = getUniqueTypes(resources);
  const typeCounts = countByType(resources, types);

  const filtersHtml = `
    <button class="filter-btn active" data-filter="All">All (${
      resources.length
    })</button>
    ${types
      .map(
        (type) => `
      <button class="filter-btn" data-filter="${type}">${type} (${typeCounts[type]})</button>
    `
      )
      .join("")}
  `;

  setHTML(targetElementId, filtersHtml);

  // Add click handlers to filter buttons
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Update active button
      buttons.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");

      // Call callback with selected filter
      const filter = e.target.getAttribute("data-filter");
      if (onFilterChange) {
        onFilterChange(filter);
      }
    });
  });
}
