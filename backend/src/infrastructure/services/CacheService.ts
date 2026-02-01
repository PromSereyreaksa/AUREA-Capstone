/**
 * Simple In-Memory Cache Service
 * Provides time-based caching for frequently accessed data like market benchmarks.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
  createdAt: number;
}

interface CacheOptions {
  /** Time-to-live in milliseconds. Default: 5 minutes */
  ttl?: number;
  /** Maximum number of entries. Default: 1000 */
  maxSize?: number;
}

export class CacheService<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl ?? 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize ?? 1000;
    
    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a value in cache
   */
  set(key: string, data: T, customTtl?: number): void {
    // Enforce max size by removing oldest entries
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const expiry = Date.now() + (customTtl ?? this.ttl);
    this.cache.set(key, {
      data,
      expiry,
      createdAt: Date.now()
    });
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set: If key exists and is valid, return it. Otherwise, execute the factory and cache the result.
   */
  async getOrSet(key: string, factory: () => Promise<T>, customTtl?: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, customTtl);
    return data;
  }

  /**
   * Invalidate entries matching a pattern (prefix match)
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }

  /**
   * Remove oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldest: { key: string; createdAt: number } | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (!oldest || entry.createdAt < oldest.createdAt) {
        oldest = { key, createdAt: entry.createdAt };
      }
    }

    if (oldest) {
      this.cache.delete(oldest.key);
    }
  }

  /**
   * Periodically clean up expired entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiry) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }
}

// ==================== Pre-configured Cache Instances ====================

/**
 * Cache for market benchmarks (10 minute TTL since they rarely change)
 */
export const marketBenchmarkCache = new CacheService<any>({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 500
});

/**
 * Cache for pricing profiles (5 minute TTL)
 */
export const pricingProfileCache = new CacheService<any>({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000
});

/**
 * Cache for AI-generated estimates (30 minute TTL since they're expensive)
 */
export const aiEstimateCache = new CacheService<any>({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 200
});

/**
 * Generate a cache key from parameters
 */
export const generateCacheKey = (...parts: (string | number | undefined)[]): string => {
  return parts.filter(p => p !== undefined).join(':');
};

export default {
  CacheService,
  marketBenchmarkCache,
  pricingProfileCache,
  aiEstimateCache,
  generateCacheKey
};
