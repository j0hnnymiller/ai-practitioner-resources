/**
 * Statistics rendering component
 */

import {
  getUniqueTypes,
  calculateAverageScore,
  getHighestScore,
} from "../core/data-processor.js";
import { setHTML } from "../utils/dom.js";

/**
 * Render statistics section
 * @param {Array} resources - Array of resource objects
 * @param {string} targetElementId - ID of target element (default: 'stats')
 */
export function renderStats(resources, targetElementId = "stats") {
  const types = getUniqueTypes(resources);
  const avgScore = calculateAverageScore(resources);
  const topScore = getHighestScore(resources);

  const statsHtml = `
    <div class="stat-card">
      <div class="stat-number">${resources.length}</div>
      <div class="stat-label">Total Resources</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${types.length}</div>
      <div class="stat-label">Resource Types</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${avgScore}</div>
      <div class="stat-label">Average Score</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${topScore}</div>
      <div class="stat-label">Highest Score</div>
    </div>
  `;

  setHTML(targetElementId, statsHtml);
}
