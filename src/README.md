# Modular Architecture Documentation

This document describes the modular architecture of the AI Practitioner Resources application after refactoring from a monolithic HTML file.

## Architecture Overview

The application follows a clean, modular architecture with clear separation of concerns:

```
src/
├── core/          # Business logic and data processing
├── services/      # External integrations (API, storage)
├── components/    # UI rendering components
├── utils/         # Shared utilities and constants
└── app.js        # Main application coordinator
```

## Module Descriptions

### Core Modules (`src/core/`)

Pure business logic modules with no side effects or dependencies on DOM or external services.

#### `colors.js`
Color calculation utilities for score-based visualization.

**Functions:**
- `getScoreColor(score)` - Convert score (60-100) to RGB gradient color
- `getWeeksBadgeColor(weeks)` - Get badge color based on weeks on list

**Example:**
```javascript
import { getScoreColor } from './core/colors.js';
const color = getScoreColor(85); // Returns "rgb(127, 200, 3)"
```

#### `filters.js`
Resource filtering logic.

**Functions:**
- `filterByType(resources, type)` - Filter resources by type
- `filterBySearch(resources, searchTerm)` - Filter by search term
- `filterResources(resources, criteria)` - Filter by multiple criteria

**Example:**
```javascript
import { filterByType } from './core/filters.js';
const articles = filterByType(allResources, 'Article');
```

#### `data-processor.js`
Data transformation and calculation utilities.

**Functions:**
- `sortByHighestScore(resources)` - Sort resources by score (descending)
- `getUniqueTypes(resources)` - Extract unique resource types
- `calculateAverageScore(resources)` - Calculate average score
- `getHighestScore(resources)` - Get highest score
- `countByType(resources, types)` - Count resources by type
- `getMainScore(resource)` - Extract main score from resource

**Example:**
```javascript
import { sortByHighestScore, calculateAverageScore } from './core/data-processor.js';
const sorted = sortByHighestScore(resources);
const avgScore = calculateAverageScore(resources);
```

### Service Modules (`src/services/`)

Abstractions for external integrations, designed for easy mocking in tests.

#### `api.js`
GitHub Gist API interactions.

**Functions:**
- `fetchResources(config)` - Fetch resources from Gist
- `validateResourceData(data)` - Validate resource data structure

**Example:**
```javascript
import { fetchResources } from './services/api.js';
const data = await fetchResources({
  url: 'https://gist.githubusercontent.com/.../resources.json'
});
```

#### `storage.js`
LocalStorage abstraction layer.

**Functions:**
- `getItem(key, defaultValue)` - Get item from storage
- `setItem(key, value)` - Set item in storage
- `removeItem(key)` - Remove item from storage
- `clear()` - Clear all items
- `isAvailable()` - Check if localStorage is available

**Example:**
```javascript
import * as storage from './services/storage.js';
storage.setItem('preferences', { theme: 'dark' });
const prefs = storage.getItem('preferences', {});
```

### Component Modules (`src/components/`)

UI rendering components that handle presentation logic.

#### `resource-card.js`
Individual resource card rendering.

**Functions:**
- `renderResourceCard(resource)` - Render single resource card HTML
- `renderResourceCards(resources)` - Render multiple resource cards

**Example:**
```javascript
import { renderResourceCards } from './components/resource-card.js';
const html = renderResourceCards(filteredResources);
document.getElementById('resources').innerHTML = html;
```

#### `filter-panel.js`
Filter button panel with event handling.

**Functions:**
- `renderFilters(resources, onFilterChange, targetElementId)` - Render filter buttons

**Example:**
```javascript
import { renderFilters } from './components/filter-panel.js';
renderFilters(resources, (filter) => {
  // Handle filter change
  console.log('Filter changed to:', filter);
});
```

#### `stats.js`
Statistics display component.

**Functions:**
- `renderStats(resources, targetElementId)` - Render statistics cards

#### `introduction.js`
Introduction section with expand/collapse.

**Functions:**
- `renderIntroduction(introduction, previewId, fullId, toggleLinkId)` - Render introduction with expand/collapse

#### `legend.js`
Legend/methodology section.

**Functions:**
- `renderLegend(legend, targetElementId)` - Render legend content

#### `analysis.js`
Weekly analysis section with formatting.

**Functions:**
- `renderAnalysis(analysis, sectionId, contentId)` - Render and format analysis

#### `modal.js`
Modal dialog setup.

**Functions:**
- `setupMethodologyModal(modalId, linkSelector, closeSelector)` - Setup modal open/close handlers

### Utility Modules (`src/utils/`)

Shared utilities and configuration.

#### `dom.js`
DOM manipulation helpers.

**Functions:**
- `showElement(elementId)` - Show an element
- `hideElement(elementId)` - Hide an element
- `setHTML(elementId, html)` - Set innerHTML
- `getElement(elementId)` - Get element by ID
- `addEventListener(elementId, eventType, handler)` - Add event listener
- `clearElement(elementId)` - Clear element content
- `toggleElement(elementId)` - Toggle visibility

#### `constants.js`
Application constants and configuration.

**Exports:**
- `GIST_CONFIG` - Gist configuration object
- `RISK_AREAS` - Risk area definitions array
- `DEFAULT_INTRODUCTION` - Default introduction text
- `DEFAULT_LEGEND` - Default legend HTML

**Example:**
```javascript
import { GIST_CONFIG, RISK_AREAS } from './utils/constants.js';
console.log('Fetching from:', GIST_CONFIG.url);
console.log('Risk areas:', RISK_AREAS.length);
```

### Main Application (`src/app.js`)

Application coordinator that manages state and orchestrates all modules.

**Functions:**
- `init()` - Initialize the application (call this on page load)

**Example:**
```javascript
import { init } from './src/app.js';
init(); // Starts the application
```

## Testing Guide

The modular architecture enables comprehensive unit testing:

### Testing Core Modules

Core modules contain pure functions with no side effects, making them ideal for unit testing:

```javascript
// Example test for colors.js
import { getScoreColor } from './src/core/colors.js';

test('getScoreColor returns correct color for high score', () => {
  const color = getScoreColor(95);
  expect(color).toBe('rgb(27, 200, 0)');
});

test('getScoreColor clamps scores to range', () => {
  const low = getScoreColor(50);
  const high = getScoreColor(110);
  expect(low).toBe(getScoreColor(60)); // Clamped to min
  expect(high).toBe(getScoreColor(100)); // Clamped to max
});
```

### Testing with Mocks

Service modules can be mocked for isolated testing:

```javascript
// Mock API service
jest.mock('./src/services/api.js', () => ({
  fetchResources: jest.fn().mockResolvedValue({
    resources: [{ title: 'Test Resource', score: 90 }],
    introduction: 'Test intro'
  }),
  validateResourceData: jest.fn().mockReturnValue(true)
}));

// Test component that uses API
import { fetchResources } from './src/services/api.js';
// fetchResources is now mocked
```

### Testing Components

Components can be tested with mock data and DOM manipulation:

```javascript
import { renderResourceCard } from './src/components/resource-card.js';

test('renderResourceCard creates correct HTML', () => {
  const resource = {
    type: 'Article',
    title: 'Test Article',
    source: 'https://example.com',
    blurb: 'Test description',
    highest_score: 90,
    weeks_on_list: 1
  };
  
  const html = renderResourceCard(resource);
  expect(html).toContain('Test Article');
  expect(html).toContain('NEW');
  expect(html).toContain('90');
});
```

## Development Workflow

### Running Locally

1. Start a local HTTP server:
```bash
python3 -m http.server 8080
# or
npx http-server -p 8080
```

2. Open http://localhost:8080 in your browser

### Using Test Data

To use local test data during development, update `src/utils/constants.js`:

```javascript
export const GIST_CONFIG = {
  url: "./test-local.json",  // Use local test file
};
```

### Adding New Features

1. **Core Logic**: Add to appropriate core module (e.g., new filter in `filters.js`)
2. **Service Integration**: Add to or create service module
3. **UI Component**: Create component in `components/`
4. **Wire Up**: Import and use in `app.js`

Example - Adding search functionality:

```javascript
// 1. Add to core/filters.js
export function filterBySearch(resources, searchTerm) {
  // Implementation
}

// 2. Create component/search-bar.js
export function renderSearchBar(onSearch) {
  // Implementation
}

// 3. Update app.js
import { filterBySearch } from './core/filters.js';
import { renderSearchBar } from './components/search-bar.js';

function handleSearch(searchTerm) {
  const filtered = filterBySearch(allResources, searchTerm);
  renderResources(filtered);
}

renderSearchBar(handleSearch);
```

## Code Quality Guidelines

### Function Size
- Keep functions under 20 lines
- Each function should do one thing well
- Use helper functions for complex logic

### Cyclomatic Complexity
- Keep cyclomatic complexity under 10
- Simplify nested conditions
- Extract complex boolean logic to named variables

### Module Boundaries
- Core modules: Pure functions only, no side effects
- Services: Single responsibility, mockable interfaces
- Components: Presentation logic, minimal state
- Utils: Shared, reusable helpers

### Error Handling
- Always handle errors in async functions
- Validate inputs at service boundaries
- Provide meaningful error messages

## Migration from Legacy Code

The original monolithic `index.html` has been backed up to `index-backup.html`. To revert:

```bash
mv index.html index-new.html
mv index-backup.html index.html
```

## Browser Compatibility

The modular architecture uses ES6 modules which require:
- Modern browsers (Chrome 61+, Firefox 60+, Safari 11+, Edge 16+)
- Or a build step for older browsers (Webpack, Rollup, etc.)

For older browser support, add a build step:

```bash
npm install --save-dev webpack webpack-cli
# Configure webpack to bundle modules
```

## Performance Considerations

- ES6 modules enable tree-shaking for smaller bundles
- Components render only when needed
- Pure functions can be memoized if needed
- Service layer enables caching strategies

## Future Enhancements

The modular architecture supports:
- [ ] Unit test suite with Jest or Vitest
- [ ] Integration tests with Playwright
- [ ] CSS modules or CSS-in-JS
- [ ] TypeScript for type safety
- [ ] Build optimization with Webpack/Vite
- [ ] Progressive Web App (PWA) features
- [ ] State management (if complexity grows)
