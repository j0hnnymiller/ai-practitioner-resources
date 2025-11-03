/**
 * Color calculation utilities for score-based coloring
 */

/**
 * Get RGB color for a score value (1-100 scale)
 * Gradient: 60=red -> 80=yellow -> 100=green
 * @param {number} score - Score value (1-100)
 * @returns {string} RGB color string
 */
export function getScoreColor(score) {
  // Clamp score to 60-100 range for color calculation
  const clampedScore = Math.max(60, Math.min(100, score));

  if (clampedScore >= 80) {
    // 80-100: Yellow to Green gradient
    const ratio = (clampedScore - 80) / 20; // 0 to 1
    const red = Math.round(255 * (1 - ratio));
    const green = 200; // Keep green high
    const blue = Math.round(7 * (1 - ratio));
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    // 60-80: Red to Yellow gradient
    const ratio = (clampedScore - 60) / 20; // 0 to 1
    const red = Math.round(220 + 35 * ratio); // 220 to 255
    const green = Math.round(53 + 140 * ratio); // 53 to 193
    const blue = Math.round(69 - 62 * ratio); // 69 to 7
    return `rgb(${red}, ${green}, ${blue})`;
  }
}

/**
 * Get badge color based on weeks on list
 * @param {number} weeks - Number of weeks resource has been on list
 * @returns {string} RGB color string
 */
export function getWeeksBadgeColor(weeks) {
  if (weeks >= 6) {
    // 6+ weeks: Red
    return `rgb(220, 53, 69)`;
  } else if (weeks >= 2) {
    // 2-5 weeks: Yellow
    return `rgb(255, 193, 7)`;
  } else {
    // 1-2 weeks: Green
    return `rgb(40, 167, 69)`;
  }
}
