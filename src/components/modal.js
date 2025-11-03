/**
 * Methodology modal component
 */

/**
 * Setup methodology modal with open/close functionality
 * @param {string} modalId - ID of modal element (default: 'methodology-modal')
 * @param {string} linkSelector - CSS selector for link that opens modal (default: '.methodology-link')
 * @param {string} closeSelector - CSS selector for close button (default: '.close')
 */
export function setupMethodologyModal(
  modalId = "methodology-modal",
  linkSelector = ".methodology-link",
  closeSelector = ".close"
) {
  const modal = document.getElementById(modalId);
  const link = document.querySelector(linkSelector);
  const closeBtn = document.querySelector(closeSelector);

  if (!modal) return;

  // Open modal when link is clicked
  if (link) {
    link.onclick = function () {
      modal.style.display = "block";
    };
  }

  // Close modal when close button is clicked
  if (closeBtn) {
    closeBtn.onclick = function () {
      modal.style.display = "none";
    };
  }

  // Close modal when clicking outside of it
  window.onclick = function (event) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  };
}
