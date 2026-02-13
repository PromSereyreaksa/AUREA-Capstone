/**
 * Unit Tests: String Matching Utilities
 *
 * Tests the Levenshtein distance, similarity scoring, and fuzzy matching logic.
 * Pure functions — no I/O.
 *
 * @jest-environment node
 */

import {
  levenshteinDistance,
  similarityScore,
  findBestMatch
} from '../../../src/shared/utils/stringMatch';

describe('levenshteinDistance', () => {
  it('should return 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('should return length of the other string when one is empty', () => {
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', '')).toBe(3);
  });

  it('should return 0 for two empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('should count single-character substitution', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
  });

  it('should count single-character insertion', () => {
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
  });

  it('should count single-character deletion', () => {
    expect(levenshteinDistance('cats', 'cat')).toBe(1);
  });

  it('should handle completely different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBe(3);
  });

  it('should be symmetric', () => {
    const d1 = levenshteinDistance('kitten', 'sitting');
    const d2 = levenshteinDistance('sitting', 'kitten');
    expect(d1).toBe(d2);
    expect(d1).toBe(3);
  });

  it('should handle single character strings', () => {
    expect(levenshteinDistance('a', 'b')).toBe(1);
    expect(levenshteinDistance('a', 'a')).toBe(0);
  });
});

describe('similarityScore', () => {
  it('should return 1 for identical strings', () => {
    expect(similarityScore('hello', 'hello')).toBe(1);
  });

  it('should return 1 for case-insensitive identical strings', () => {
    expect(similarityScore('Hello', 'hello')).toBe(1);
  });

  it('should return 1 for identical strings with leading/trailing whitespace', () => {
    expect(similarityScore('  hello  ', 'hello')).toBe(1);
  });

  it('should return 0 for completely different equal-length strings', () => {
    // 'abc' vs 'xyz' → distance 3, maxLen 3 → 0
    expect(similarityScore('abc', 'xyz')).toBe(0);
  });

  it('should return a value between 0 and 1', () => {
    const score = similarityScore('kitten', 'sitting');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it('should return 1 for two empty strings', () => {
    expect(similarityScore('', '')).toBe(1);
  });
});

describe('findBestMatch', () => {
  const candidates = [
    { label: 'Logo Design', value: 1 },
    { label: 'Brand Guideline', value: 2 },
    { label: 'Web Development', value: 3 },
    { label: 'UI/UX Design', value: 4 },
    { label: 'Mobile App Design', value: 5 },
  ];

  it('should return exact match with score 1', () => {
    const result = findBestMatch('Logo Design', candidates);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(1);
    expect(result!.score).toBe(1);
  });

  it('should match case-insensitively', () => {
    const result = findBestMatch('logo design', candidates);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(1);
  });

  it('should find substring matches with at least 0.7 score', () => {
    const result = findBestMatch('Logo', candidates);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(1);
    expect(result!.score).toBeGreaterThanOrEqual(0.7);
  });

  it('should find best fuzzy match for typos', () => {
    const result = findBestMatch('Logu Desing', candidates);
    expect(result).not.toBeNull();
    expect(result!.value).toBe(1);
  });

  it('should return null when no candidate meets threshold', () => {
    const result = findBestMatch('quantum physics', candidates);
    expect(result).toBeNull();
  });

  it('should return null for empty query', () => {
    const result = findBestMatch('', candidates);
    expect(result).toBeNull();
  });

  it('should return null for empty candidates', () => {
    const result = findBestMatch('Logo', []);
    expect(result).toBeNull();
  });

  it('should respect custom minScore', () => {
    // With high threshold, fuzzy matches should fail
    const result = findBestMatch('Logu Desing', candidates, 0.95);
    expect(result).toBeNull();
  });

  it('should boost substring matches of candidate inside query', () => {
    // "Web" is a substring of "Web Development" — boost kicks in
    const result = findBestMatch('Web', candidates);
    expect(result).not.toBeNull();
    expect(result!.label).toBe('Web Development');
    expect(result!.score).toBeGreaterThanOrEqual(0.7);
  });
});
