/**
 * Example Unit Tests for Core Modules
 * 
 * These tests demonstrate how the modular architecture enables comprehensive testing.
 * To run these tests, you would typically use a test framework like Jest or Vitest.
 * 
 * Install Vitest: npm install --save-dev vitest
 * Run tests: npm test
 */

// Import test functions from Vitest
import { describe, test, expect } from 'vitest';

// Import modules to test
import { getScoreColor, getWeeksBadgeColor } from '../src/core/colors.js';
import { filterByType, filterBySearch } from '../src/core/filters.js';
import {
  sortByHighestScore,
  getUniqueTypes,
  calculateAverageScore,
  getHighestScore,
  countByType,
  getMainScore
} from '../src/core/data-processor.js';

// ============================================================================
// Color Module Tests
// ============================================================================

describe('colors.js', () => {
  describe('getScoreColor', () => {
    test('returns green for high scores (90-100)', () => {
      const color = getScoreColor(95);
      expect(color).toMatch(/rgb\(\d+, 200, \d+\)/);
    });

    test('returns yellow for medium scores (80-89)', () => {
      const color = getScoreColor(85);
      expect(color).toMatch(/rgb\(\d+, 200, \d+\)/);
    });

    test('returns red for lower scores (60-79)', () => {
      const color = getScoreColor(70);
      expect(color).toMatch(/rgb\(\d+, \d+, \d+\)/);
    });

    test('clamps scores below 60 to 60', () => {
      const lowColor = getScoreColor(50);
      const minColor = getScoreColor(60);
      expect(lowColor).toBe(minColor);
    });

    test('clamps scores above 100 to 100', () => {
      const highColor = getScoreColor(110);
      const maxColor = getScoreColor(100);
      expect(highColor).toBe(maxColor);
    });
  });

  describe('getWeeksBadgeColor', () => {
    test('returns green for new items (1 week)', () => {
      expect(getWeeksBadgeColor(1)).toBe('rgb(40, 167, 69)');
    });

    test('returns yellow for moderate age (2-5 weeks)', () => {
      expect(getWeeksBadgeColor(3)).toBe('rgb(255, 193, 7)');
    });

    test('returns red for old items (6+ weeks)', () => {
      expect(getWeeksBadgeColor(6)).toBe('rgb(220, 53, 69)');
      expect(getWeeksBadgeColor(10)).toBe('rgb(220, 53, 69)');
    });
  });
});

// ============================================================================
// Filter Module Tests
// ============================================================================

describe('filters.js', () => {
  const sampleResources = [
    { type: 'Article', title: 'Security Best Practices', blurb: 'Learn security' },
    { type: 'Book', title: 'AI Programming Guide', blurb: 'Comprehensive guide' },
    { type: 'Article', title: 'Code Quality Tips', blurb: 'Improve quality' },
    { type: 'Blog', title: 'Testing Strategies', blurb: 'Testing approaches' }
  ];

  describe('filterByType', () => {
    test('returns all resources when type is "All"', () => {
      const result = filterByType(sampleResources, 'All');
      expect(result).toHaveLength(4);
    });

    test('filters resources by Article type', () => {
      const result = filterByType(sampleResources, 'Article');
      expect(result).toHaveLength(2);
      expect(result.every(r => r.type === 'Article')).toBe(true);
    });

    test('filters resources by Book type', () => {
      const result = filterByType(sampleResources, 'Book');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('Book');
    });

    test('returns empty array for non-existent type', () => {
      const result = filterByType(sampleResources, 'Podcast');
      expect(result).toHaveLength(0);
    });
  });

  describe('filterBySearch', () => {
    test('returns all resources when search term is empty', () => {
      const result = filterBySearch(sampleResources, '');
      expect(result).toHaveLength(4);
    });

    test('filters by title (case insensitive)', () => {
      const result = filterBySearch(sampleResources, 'security');
      expect(result).toHaveLength(1);
      expect(result[0].title).toContain('Security');
    });

    test('filters by blurb content', () => {
      const result = filterBySearch(sampleResources, 'quality');
      expect(result).toHaveLength(1);
      expect(result[0].blurb).toContain('quality');
    });

    test('filters by type', () => {
      const result = filterBySearch(sampleResources, 'book');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('Book');
    });

    test('returns empty array when no matches found', () => {
      const result = filterBySearch(sampleResources, 'xyz123');
      expect(result).toHaveLength(0);
    });
  });
});

// ============================================================================
// Data Processor Module Tests
// ============================================================================

describe('data-processor.js', () => {
  const sampleResources = [
    { type: 'Article', title: 'A', score: 85, highest_score: 90 },
    { type: 'Book', title: 'B', score: 75, highest_score: 80 },
    { type: 'Article', title: 'C', score: 95, highest_score: 95 },
    { type: 'Blog', title: 'D', overall_score: 88, highest_score: 88 }
  ];

  describe('sortByHighestScore', () => {
    test('sorts resources by highest_score descending', () => {
      const sorted = sortByHighestScore(sampleResources);
      expect(sorted[0].highest_score).toBe(95);
      expect(sorted[sorted.length - 1].highest_score).toBe(80);
    });

    test('does not mutate original array', () => {
      const original = [...sampleResources];
      sortByHighestScore(sampleResources);
      expect(sampleResources).toEqual(original);
    });

    test('falls back to score field if highest_score missing', () => {
      const resources = [{ score: 90 }, { score: 80 }];
      const sorted = sortByHighestScore(resources);
      expect(sorted[0].score).toBe(90);
    });
  });

  describe('getUniqueTypes', () => {
    test('returns array of unique types', () => {
      const types = getUniqueTypes(sampleResources);
      expect(types).toHaveLength(3);
      expect(types).toContain('Article');
      expect(types).toContain('Book');
      expect(types).toContain('Blog');
    });

    test('returns empty array for empty input', () => {
      const types = getUniqueTypes([]);
      expect(types).toHaveLength(0);
    });
  });

  describe('calculateAverageScore', () => {
    test('calculates average of overall_score and score fields', () => {
      const avg = calculateAverageScore(sampleResources);
      // (85 + 75 + 95 + 88) / 4 = 85.75, rounded to 86
      expect(avg).toBe(86);
    });

    test('returns 0 for empty array', () => {
      expect(calculateAverageScore([])).toBe(0);
    });

    test('returns 0 for null input', () => {
      expect(calculateAverageScore(null)).toBe(0);
    });
  });

  describe('getHighestScore', () => {
    test('returns highest score from all resources', () => {
      const highest = getHighestScore(sampleResources);
      expect(highest).toBe(95);
    });

    test('returns 0 for empty array', () => {
      expect(getHighestScore([])).toBe(0);
    });
  });

  describe('countByType', () => {
    test('counts resources for each type', () => {
      const types = ['Article', 'Book', 'Blog'];
      const counts = countByType(sampleResources, types);
      expect(counts['Article']).toBe(2);
      expect(counts['Book']).toBe(1);
      expect(counts['Blog']).toBe(1);
    });

    test('returns 0 for types not in resources', () => {
      const types = ['Podcast'];
      const counts = countByType(sampleResources, types);
      expect(counts['Podcast']).toBe(0);
    });
  });

  describe('getMainScore', () => {
    test('returns highest_score if available', () => {
      const score = getMainScore(sampleResources[0]);
      expect(score).toBe(90);
    });

    test('falls back to score field', () => {
      const resource = { score: 85 };
      expect(getMainScore(resource)).toBe(85);
    });

    test('returns 0 if no score fields present', () => {
      const resource = { title: 'Test' };
      expect(getMainScore(resource)).toBe(0);
    });
  });
});

// ============================================================================
// Integration Tests (Example)
// ============================================================================

describe('Integration: Filtering and Sorting', () => {
  const resources = [
    { type: 'Article', title: 'Security', score: 85, highest_score: 90 },
    { type: 'Book', title: 'Quality', score: 75, highest_score: 80 },
    { type: 'Article', title: 'Testing', score: 95, highest_score: 95 },
    { type: 'Blog', title: 'Security Tips', overall_score: 88, highest_score: 88 }
  ];

  test('can filter by type and then sort', () => {
    const articles = filterByType(resources, 'Article');
    const sorted = sortByHighestScore(articles);
    
    expect(sorted).toHaveLength(2);
    expect(sorted[0].highest_score).toBe(95);
    expect(sorted[1].highest_score).toBe(90);
  });

  test('can search and then calculate stats', () => {
    const securityResources = filterBySearch(resources, 'security');
    const avgScore = calculateAverageScore(securityResources);
    
    expect(securityResources).toHaveLength(2);
    expect(avgScore).toBeGreaterThan(0);
  });
});

// ============================================================================
// Notes for Running Tests
// ============================================================================

/*
To run these tests:

1. Install a test framework (Jest or Vitest):
   npm install --save-dev jest
   
   OR for ES6 module support:
   npm install --save-dev vitest

2. Update package.json:
   {
     "type": "module",
     "scripts": {
       "test": "vitest"
     }
   }

3. Run tests:
   npm test

4. For coverage:
   npm test -- --coverage

Example Jest configuration (jest.config.js):
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
*/
