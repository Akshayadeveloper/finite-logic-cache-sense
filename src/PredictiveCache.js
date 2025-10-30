/**
 * FINITE LOGIC - CacheSense: Predictive Eviction Layer
 * Uses a heuristic 'Usefulness Score' for advanced cache eviction.
 */

class PredictiveCache {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map(); // Key -> { value, score, lastAccess, accessCount }
        console.log(`[CacheSense] Initialized with max size: ${maxSize}`);
    }

    /**
     * Calculates a composite "Usefulness Score" for eviction.
     * Lower score means more useful (less likely to be evicted).
     * The formula prioritizes recency and frequency, penalizing volatility.
     */
    _calculateUsefulnessScore(item) {
        const now = Date.now();
        const recencyScore = (now - item.lastAccess) / 1000; // Time since last access (seconds)
        const frequencyScore = 1 / (item.accessCount + 1); // Inverse of frequency
        
        // Final Score: Combine Recency and Frequency.
        // Lower scores (recent, frequent) are preferred.
        // NOTE: In a true ML model, this would be a regression prediction.
        return (recencyScore * 0.5) + (frequencyScore * 10);
    }

    put(key, value) {
        if (this.cache.has(key)) {
            // Update existing item
            const item = this.cache.get(key);
            item.value = value;
            item.lastAccess = Date.now();
            item.accessCount++;
        } else {
            // New item
            if (this.cache.size >= this.maxSize) {
                this._evict(); // Evict the least useful item first
            }
            this.cache.set(key, { value, score: Infinity, lastAccess: Date.now(), accessCount: 1 });
        }
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        
        const item = this.cache.get(key);
        item.lastAccess = Date.now();
        item.accessCount++; // Update usage metrics
        
        return item.value;
    }

    /**
     * Finds and removes the least useful item based on the score.
     */
    _evict() {
        let maxEvictionScore = -Infinity;
        let itemToEvict = null;
        let evictKey = null;

        // Iterate and find the item with the highest (worst) usefulness score
        for (const [key, item] of this.cache.entries()) {
            const score = this._calculateUsefulnessScore(item);
            if (score > maxEvictionScore) {
                maxEvictionScore = score;
                itemToEvict = item;
                evictKey = key;
            }
        }

        if (evictKey) {
            this.cache.delete(evictKey);
            console.log(`[CacheSense] 🗑️ Evicted: ${evictKey} (Score: ${maxEvictionScore.toFixed(2)})`);
        }
    }
}

// --- Demonstration ---
const cache = new PredictiveCache(3);

// Initial items
cache.put('user:a', { data: 1 }); // Access 1
cache.put('user:b', { data: 2 }); // Access 1
cache.put('user:c', { data: 3 }); // Access 1

// Simulate heavy access to 'user:a' and 'user:c'
cache.get('user:a'); 
cache.get('user:a'); 
cache.get('user:c'); 

// Put a new item (will trigger eviction)
console.log('\nAttempting to add user:d (triggers eviction)...');
cache.put('user:d', { data: 4 }); 
// Expected: 'user:b' is evicted because it was accessed least recently and only once.

module.exports = { PredictiveCache };
