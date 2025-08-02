/**
 * Random selection utilities for Simon Says
 * Pure functions for various random selection needs
 */

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
export function shuffle(array) {
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Select random item from array
 * @param {Array} array - Array to select from
 * @returns {any} Random item
 */
export function randomChoice(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Select multiple random items without replacement
 * @param {Array} array - Array to select from
 * @param {number} count - Number to select
 * @returns {Array} Selected items
 */
export function randomChoiceMultiple(array, count) {
  if (!array || array.length === 0) return [];
  if (count >= array.length) return [...array];
  
  const shuffled = shuffle(array);
  return shuffled.slice(0, count);
}

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random float between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random float
 */
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Random boolean with optional probability
 * @param {number} probability - Probability of true (0-1)
 * @returns {boolean} Random boolean
 */
export function randomBool(probability = 0.5) {
  return Math.random() < probability;
}

/**
 * Select random key from object
 * @param {Object} obj - Object to select from
 * @returns {string} Random key
 */
export function randomKey(obj) {
  const keys = Object.keys(obj);
  return randomChoice(keys);
}

/**
 * Select random value from object
 * @param {Object} obj - Object to select from
 * @returns {any} Random value
 */
export function randomValue(obj) {
  const key = randomKey(obj);
  return key ? obj[key] : null;
}

/**
 * Generate random ID
 * @param {string} prefix - Optional prefix
 * @returns {string} Random ID
 */
export function randomId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Select items with reservoir sampling (for streaming data)
 * @param {Iterable} items - Items to select from
 * @param {number} k - Number to select
 * @returns {Array} Selected items
 */
export function reservoirSample(items, k) {
  const reservoir = [];
  let n = 0;
  
  for (const item of items) {
    if (n < k) {
      reservoir.push(item);
    } else {
      const j = randomInt(0, n);
      if (j < k) {
        reservoir[j] = item;
      }
    }
    n++;
  }
  
  return reservoir;
}

/**
 * Generate random permutation of range
 * @param {number} n - Size of range (0 to n-1)
 * @returns {Array} Random permutation
 */
export function randomPermutation(n) {
  const perm = Array.from({ length: n }, (_, i) => i);
  return shuffle(perm);
}

/**
 * Select with replacement
 * @param {Array} array - Array to select from
 * @param {number} count - Number to select
 * @returns {Array} Selected items (may contain duplicates)
 */
export function randomChoiceWithReplacement(array, count) {
  if (!array || array.length === 0) return [];
  
  const selected = [];
  for (let i = 0; i < count; i++) {
    selected.push(randomChoice(array));
  }
  
  return selected;
}

/**
 * Biased coin flip (weighted random boolean)
 * @param {number} weight - Weight for true (0-100)
 * @returns {boolean} Weighted random boolean
 */
export function biasedCoinFlip(weight) {
  return randomInt(1, 100) <= weight;
}

/**
 * Select based on rarity tiers
 * @param {Object} tiers - Object with tier names and weights
 * @returns {string} Selected tier
 */
export function selectRarity(tiers = {
  common: 50,
  uncommon: 30,
  rare: 15,
  epic: 4,
  legendary: 1
}) {
  const total = Object.values(tiers).reduce((sum, weight) => sum + weight, 0);
  let random = randomFloat(0, total);
  
  for (const [tier, weight] of Object.entries(tiers)) {
    random -= weight;
    if (random <= 0) {
      return tier;
    }
  }
  
  return Object.keys(tiers)[0]; // Fallback
}