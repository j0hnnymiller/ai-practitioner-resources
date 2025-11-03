/**
 * DOM manipulation utilities
 */

/**
 * Show an element
 * @param {string} elementId - ID of element to show
 */
export function showElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = "block";
  }
}

/**
 * Hide an element
 * @param {string} elementId - ID of element to hide
 */
export function hideElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = "none";
  }
}

/**
 * Set HTML content for an element
 * @param {string} elementId - ID of target element
 * @param {string} html - HTML content to set
 */
export function setHTML(elementId, html) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = html;
  }
}

/**
 * Get element by ID
 * @param {string} elementId - ID of element
 * @returns {HTMLElement|null} Element or null if not found
 */
export function getElement(elementId) {
  return document.getElementById(elementId);
}

/**
 * Add event listener to element
 * @param {string} elementId - ID of element
 * @param {string} eventType - Type of event (e.g., 'click')
 * @param {Function} handler - Event handler function
 */
export function addEventListener(elementId, eventType, handler) {
  const element = document.getElementById(elementId);
  if (element) {
    element.addEventListener(eventType, handler);
  }
}

/**
 * Remove all child nodes from an element
 * @param {string} elementId - ID of element to clear
 */
export function clearElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = "";
  }
}

/**
 * Toggle element visibility
 * @param {string} elementId - ID of element to toggle
 */
export function toggleElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = element.style.display === "none" ? "block" : "none";
  }
}
