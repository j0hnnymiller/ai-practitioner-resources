/**
 * Legend section component
 */

import { setHTML } from "../utils/dom.js";
import { DEFAULT_LEGEND } from "../utils/constants.js";

/**
 * Render legend section
 * @param {string} legend - Legend HTML content
 * @param {string} targetElementId - ID of target element (default: 'legend')
 */
export function renderLegend(legend, targetElementId = "legend") {
  const legendContent = legend || DEFAULT_LEGEND;
  setHTML(targetElementId, legendContent);
}
