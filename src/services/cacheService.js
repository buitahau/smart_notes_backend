import NodeCache from 'node-cache';

/**
 * CacheService provides a simple in-memory caching layer.
 * Uses node-cache internally with TTL (Time To Live) support.
 */
class CacheService {
    constructor() {
        // Initialize cache with default TTL of 5 minutes (300 seconds)
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
     * @param {string} key - Cache key
     * @returns {any|undefined} - Cached value or undefined if not found/expired
     */
    get(key) {
        return this.cache.get(key);
    }

    /**
     * Set a value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} [ttl] - Optional TTL in seconds (overrides default)
     * @returns {boolean} - True if successful
     */
    set(key, value, ttl) {
        if (ttl !== undefined) {
            return this.cache.set(key, value, ttl);
        }
        return this.cache.set(key, value);
    }

    /**
     * Delete a key from cache
     * @param {string} key - Cache key to delete
     * @returns {number} - Number of deleted entries (0 or 1)
     */
    del(key) {
        return this.cache.del(key);
    }

    /**
     * Delete multiple keys from cache
     * @param {string[]} keys - Array of cache keys to delete
     * @returns {number} - Number of deleted entries
     */
    delMultiple(keys) {
        return this.cache.del(keys);
    }

    /**
     * Flush all cache entries
     */
    flush() {
        this.cache.flushAll();
    }

    /**
     * Get cache statistics
     * @returns {object} - Cache stats (hits, misses, keys, etc.)
     */
    getStats() {
        return this.cache.getStats();
    }

    /**
     * Check if a key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean} - True if key exists
     */
    has(key) {
        return this.cache.has(key);
    }
}

// Export singleton instance
const cacheService = new CacheService();
export default cacheService;
