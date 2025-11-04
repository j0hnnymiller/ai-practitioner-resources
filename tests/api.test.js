import { describe, test, expect } from 'vitest';
import { validateResourceData } from '../src/services/api.js';

describe('services/api.validateResourceData', () => {
  test('throws when data is null or undefined', () => {
    expect(() => validateResourceData(null)).toThrow(/null or undefined/);
    expect(() => validateResourceData(undefined)).toThrow(/null or undefined/);
  });

  test('throws when resources field is missing or not an array', () => {
    expect(() => validateResourceData({})).toThrow(/missing or invalid resources array/);
    expect(() => validateResourceData({ resources: {} })).toThrow(/missing or invalid resources array/);
  });

  test('throws when resources array is empty', () => {
    expect(() => validateResourceData({ resources: [] })).toThrow(/No resources found/);
  });

  test('returns true for minimally valid data', () => {
    const minimal = { resources: [{}] };
    expect(validateResourceData(minimal)).toBe(true);
  });
});
