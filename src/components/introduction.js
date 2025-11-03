/**
 * Introduction section component
 */

import { setHTML, addEventListener } from "../utils/dom.js";
import { DEFAULT_INTRODUCTION } from "../utils/constants.js";

/**
 * Render introduction section with expand/collapse functionality
 * @param {string} introduction - Introduction HTML content
 * @param {string} previewElementId - ID of preview element (default: 'introduction-preview')
 * @param {string} fullElementId - ID of full content element (default: 'introduction-full')
 * @param {string} toggleLinkId - ID of toggle link (default: 'toggle-introduction')
 */
export function renderIntroduction(
  introduction,
  previewElementId = "introduction-preview",
  fullElementId = "introduction-full",
  toggleLinkId = "toggle-introduction"
) {
  const fullIntro = introduction || DEFAULT_INTRODUCTION;

  // Extract first sentence
  const sentences = fullIntro.split("</p>");
  const firstSentence = sentences[0] + "</p>";
  const remainingContent = sentences.slice(1).join("</p>");

  setHTML(previewElementId, firstSentence);
  setHTML(fullElementId, remainingContent);

  // Add click handler for expand/collapse
  const toggleLink = document.getElementById(toggleLinkId);
  const fullDiv = document.getElementById(fullElementId);

  if (toggleLink && fullDiv) {
    toggleLink.onclick = function (e) {
      e.preventDefault();

      if (fullDiv.style.display === "none") {
        fullDiv.style.display = "block";
        toggleLink.textContent = "... read less";
      } else {
        fullDiv.style.display = "none";
        toggleLink.textContent = "... read more";
      }
    };
  }
}
