/**
 * String similarity utilities for fuzzy matching.
 * Uses Levenshtein distance normalized to a 0-1 similarity score.
 */

/**
 * Calculate Levenshtein distance between two strings.
 * Uses Wagner-Fischer algorithm with O(min(m,n)) space.
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  // Ensure we iterate over the shorter string for space efficiency
  if (aLen > bLen) {
    return levenshteinDistance(b, a);
  }

  let prev = Array.from({ length: aLen + 1 }, (_, i) => i);
  let curr = new Array(aLen + 1);

  for (let j = 1; j <= bLen; j++) {
    curr[0] = j;
    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[i] = Math.min(
        prev[i] + 1,       // deletion
        curr[i - 1] + 1,   // insertion
        prev[i - 1] + cost  // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[aLen];
}

/**
 * Calculate similarity score between two strings (0 to 1).
 * 1 = identical, 0 = completely different.
 */
export function similarityScore(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();

  if (aLower === bLower) return 1;
  
  const maxLen = Math.max(aLower.length, bLower.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(aLower, bLower);
  return 1 - distance / maxLen;
}

/**
 * Find the best match from a list of candidates.
 * Returns null if no candidate meets the minimum threshold.
 * 
 * @param query - The search string
 * @param candidates - Array of { label, value } candidates
 * @param minScore - Minimum similarity score to accept (default 0.4)
 */
export function findBestMatch<T>(
  query: string,
  candidates: { label: string; value: T }[],
  minScore: number = 0.4
): { value: T; label: string; score: number } | null {
  if (!query || candidates.length === 0) return null;

  const queryLower = query.toLowerCase().trim();
  let best: { value: T; label: string; score: number } | null = null;

  for (const candidate of candidates) {
    const candidateLower = candidate.label.toLowerCase().trim();

    // Bonus: exact substring match gets a boost
    let score = similarityScore(queryLower, candidateLower);
    if (candidateLower.includes(queryLower) || queryLower.includes(candidateLower)) {
      score = Math.max(score, 0.7); // Substring match is at least 0.7
    }

    if (score >= minScore && (!best || score > best.score)) {
      best = { value: candidate.value, label: candidate.label, score };
    }
  }

  return best;
}
