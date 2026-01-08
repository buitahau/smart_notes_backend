import NodeCache from 'node-cache';

/**
 * CacheService provides a simple in-memory caching layer.
 * Uses node-cache internally with TTL (Time To Live) support.
 */
class CacheService {
    private cache: NodeCache;

    constructor() {
        // Initialize cache with default TTL of 1 day (86400 seconds)
        // stdTTL: standard time to live for each cache entry
        // checkperiod: automatic check for expired keys every 60 seconds
        this.cache = new NodeCache({
            stdTTL: 86400,
            checkperiod: 60,
            useClones: false, // For better performance, don't clone objects
        });
    }

    /**
     * Get a value from cache
     */
    get<T>(key: string): T | undefined {
        return this.cache.get<T>(key);
    }

    /**
     * Set a value in cache
     */
    set<T>(key: string, value: T, ttl?: number): boolean {
        if (ttl !== undefined) {
            return this.cache.set(key, value, ttl);
        }
        return this.cache.set(key, value);
    }

    /**
     * Delete a key from cache
     */
    del(key: string): number {
        return this.cache.del(key);
    }

    /**
     * Delete multiple keys from cache
     */
    delMultiple(keys: string[]): number {
        return this.cache.del(keys);
    }

    /**
     * Flush all cache entries
     */
    flush(): void {
        this.cache.flushAll();
    }

    /**
     * Get cache statistics
     */
    getStats(): NodeCache.Stats {
        return this.cache.getStats();
    }

    /**
     * Check if a key exists in cache
     */
    has(key: string): boolean {
        return this.cache.has(key);
    }
}

// Export singleton instance
const cacheService = new CacheService();
export default cacheService;
