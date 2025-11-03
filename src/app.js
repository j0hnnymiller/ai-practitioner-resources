/**
 * Main application module
 * Coordinates all components and manages application state
 */

import { GIST_CONFIG } from "./utils/constants.js";
import { fetchResources, validateResourceData } from "./services/api.js";
import { hideElement, showElement, setHTML } from "./utils/dom.js";
import { renderStats } from "./components/stats.js";
import { renderFilters } from "./components/filter-panel.js";
import { renderResourceCards } from "./components/resource-card.js";
import { renderIntroduction } from "./components/introduction.js";
import { renderLegend } from "./components/legend.js";
import { renderAnalysis } from "./components/analysis.js";
import { setupMethodologyModal } from "./components/modal.js";
import { filterByType } from "./core/filters.js";
import { sortByHighestScore } from "./core/data-processor.js";

// Application state
let allResources = [];
let currentFilter = "All";

/**
 * Render resources based on current filter
 */
function renderResources() {
  const filteredResources = filterByType(allResources, currentFilter);
  const sortedResources = sortByHighestScore(filteredResources);
  const resourcesHtml = renderResourceCards(sortedResources);

  setHTML("resources", resourcesHtml);
}

/**
 * Handle filter change event
 * @param {string} filter - Selected filter value
 */
function handleFilterChange(filter) {
  currentFilter = filter;
  renderResources();
}

/**
 * Load and display resources
 */
async function loadResources() {
  try {
    // Fetch resource data
    const resourceData = await fetchResources(GIST_CONFIG);

    // Validate data
    validateResourceData(resourceData);

    // Store resources in state
    allResources = resourceData.resources || [];

    // Hide loading, show content
    hideElement("loading");
    showElement("content");

    // Render all components
    renderIntroduction(resourceData.introduction);
    renderStats(allResources);
    renderFilters(allResources, handleFilterChange);
    renderResources();
    renderLegend(resourceData.legend);
    renderAnalysis(resourceData.analysis);
    setupMethodologyModal();
  } catch (error) {
    console.error("Error loading resources:", error);
    hideElement("loading");
    showElement("error");
    setHTML(
      "error",
      `
      <h3>Failed to load resources</h3>
      <p>Error: ${error.message}</p>
    `
    );
  }
}

/**
 * Initialize application when DOM is ready
 */
export function init() {
  document.addEventListener("DOMContentLoaded", loadResources);
}
