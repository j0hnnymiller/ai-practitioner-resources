/**
 * Analysis section component
 */

import { setHTML, showElement, hideElement } from "../utils/dom.js";

/**
 * Format analysis HTML by converting middle paragraphs to bullet points
 * @param {string} analysis - Raw analysis HTML
 * @returns {string} Formatted analysis HTML
 */
function formatAnalysis(analysis) {
  // Parse the analysis HTML to extract paragraphs
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = analysis;
  const paragraphs = Array.from(tempDiv.querySelectorAll("p"));

  if (paragraphs.length <= 2) {
    // If 2 or fewer paragraphs, just display as is
    return analysis;
  }

  // Keep first paragraph as is
  let formattedAnalysis = paragraphs[0].outerHTML;

  // Add extra whitespace before bullet list
  formattedAnalysis += '<div style="margin: 20px 0;"></div>';

  // Convert middle paragraphs to bullet points
  formattedAnalysis += '<ul style="margin-left: 20px; line-height: 1.8;">';
  for (let i = 1; i < paragraphs.length - 1; i++) {
    formattedAnalysis += `<li style="margin-bottom: 12px;">${paragraphs[i].innerHTML}</li>`;
  }
  formattedAnalysis += "</ul>";

  // Add extra whitespace after bullet list
  formattedAnalysis += '<div style="margin: 20px 0;"></div>';

  // Keep last paragraph as is
  formattedAnalysis += paragraphs[paragraphs.length - 1].outerHTML;

  return formattedAnalysis;
}

/**
 * Render analysis section
 * @param {string} analysis - Analysis HTML content
 * @param {string} sectionElementId - ID of section element (default: 'analysis-section')
 * @param {string} contentElementId - ID of content element (default: 'analysis')
 */
export function renderAnalysis(
  analysis,
  sectionElementId = "analysis-section",
  contentElementId = "analysis"
) {
  if (!analysis) {
    hideElement(sectionElementId);
    return;
  }

  showElement(sectionElementId);
  const formattedAnalysis = formatAnalysis(analysis);
  setHTML(contentElementId, formattedAnalysis);
}
