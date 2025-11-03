/**
 * API service for fetching resources from GitHub Gist
 */

/**
 * Fetch resources from a Gist URL
 * @param {Object} config - Configuration object
 * @param {string} config.url - Direct URL to JSON file
 * @param {string} config.apiUrl - GitHub API URL for gist
 * @param {string} config.filename - Filename in gist (if using apiUrl)
 * @returns {Promise<Object>} Resource data object
 * @throws {Error} If fetch fails or configuration is invalid
 */
export async function fetchResources(config) {
  try {
    let resourceData;

    if (config.url) {
      const response = await fetch(config.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      resourceData = await response.json();
    } else if (config.apiUrl) {
      const response = await fetch(config.apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const gistData = await response.json();
      const fileContent = gistData.files[config.filename].content;
      resourceData = JSON.parse(fileContent);
    } else {
      throw new Error(
        "No valid configuration found. Please set either config.url or config.apiUrl"
      );
    }

    return resourceData;
  } catch (error) {
    console.error("Error fetching resources:", error);
    throw error;
  }
}

/**
 * Validate resource data structure
 * @param {Object} data - Resource data to validate
 * @returns {boolean} True if valid
 * @throws {Error} If data is invalid
 */
export function validateResourceData(data) {
  if (!data) {
    throw new Error("Resource data is null or undefined");
  }

  if (!data.resources || !Array.isArray(data.resources)) {
    throw new Error("Invalid resource data: missing or invalid resources array");
  }

  if (data.resources.length === 0) {
    throw new Error("No resources found in the data");
  }

  return true;
}
