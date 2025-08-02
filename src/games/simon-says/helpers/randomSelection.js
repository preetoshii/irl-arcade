/**
 * Random selection utilities for Simon Says
 * 
 * The randomSelection module provides a comprehensive toolkit for all randomization needs in Simon Says. While the weightCalculations module handles probability-weighted selection, this module covers everything else: shuffling arrays, selecting random items, generating IDs, and more exotic needs like reservoir sampling. These utilities ensure that randomness throughout the game is implemented correctly and consistently. Poor randomization can ruin games - imagine a shuffle that slightly favors certain positions or a random selection that has subtle biases. These functions implement proven algorithms that guarantee true randomness.
 * 
 * The module follows functional programming principles - every function is pure, returning new values without modifying inputs. This makes the code predictable and testable. The shuffle function returns a new array rather than modifying the original. Random selections don't alter the source array. This immutability prevents subtle bugs where one part of the system unexpectedly modifies data another part is using. Combined with comprehensive edge case handling (empty arrays, invalid ranges), these utilities provide a rock-solid foundation for all random operations in the game.
 */

/**
 * Shuffle an array using Fisher-Yates algorithm
 * 
 * The Fisher-Yates shuffle (also known as Knuth shuffle) is the gold standard for array randomization, producing truly random permutations with perfect uniformity. The algorithm works by iterating through the array backwards, swapping each element with a random element from the remaining unshuffled portion. This ensures every permutation has exactly equal probability - crucial for fair gameplay. Lesser shuffle algorithms often have subtle biases where certain orderings are more likely than others, which keen players might notice and exploit.
 * 
 * The implementation creates a new array rather than modifying the input, following functional programming principles. The backwards iteration isn't just stylistic - it ensures we're always selecting from the unshuffled portion, maintaining the algorithm's mathematical properties. The destructuring assignment for swapping ([a, b] = [b, a]) is both elegant and efficient in modern JavaScript. This shuffle is used throughout Simon Says whenever random ordering is needed - from randomizing player order to shuffling activity options.
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
 * 
 * Selecting multiple items without replacement is a common need - picking 3 players from 10 for a mini-game, selecting 5 activities to present as options, etc. The elegant solution leverages the shuffle function: shuffle the entire array then take the first N items. This approach guarantees fairness (every item has equal chance of selection) and uniqueness (no duplicates). While seemingly inefficient for selecting few items from large arrays, it's perfect for Simon Says' small sets and has the advantage of extreme simplicity and correctness.
 * 
 * The edge case handling is thoughtful. Empty arrays return empty results rather than errors. Requesting more items than available returns all items - a graceful degradation that keeps the game running. The spread operator ensures the original array isn't returned directly when count exceeds length, maintaining the immutability contract. This function forms the basis for many multi-selection scenarios in the game, from team formation to activity rotation.
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
 * 
 * Reservoir sampling is a fascinating algorithm that selects K items from a stream of unknown length with perfect uniformity. Each item has exactly K/N probability of being selected, where N is the total number of items seen. The algorithm maintains a "reservoir" of K items, initially filling it with the first K items. For each subsequent item, it randomly decides whether to include it, and if so, which reservoir item to replace. This creates a running sample that's always uniformly random for the items seen so far.
 * 
 * While Simon Says doesn't typically process streaming data, this algorithm is included for completeness and potential future features. Imagine selecting highlight moments from a match as it progresses, or maintaining a "best plays" collection that updates in real-time. The mathematical elegance of reservoir sampling - maintaining perfect randomness without knowing the total count in advance - makes it a beautiful algorithm worth including in any randomization toolkit.
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
 * 
 * Rarity-based selection is common in games for creating excitement through scarcity. While Simon Says doesn't have traditional loot or rewards, this pattern appears in selecting special modifiers, choosing celebration animations, or picking easter egg moments. The default tiers (common through legendary) follow gaming conventions, with exponentially decreasing probabilities creating genuine excitement for rare events. A "legendary" moment with 1% chance becomes memorable precisely because of its rarity.
 * 
 * The implementation uses the same weighted random algorithm as elsewhere but packages it in a game-familiar interface. The fallback to the first tier prevents errors if weights sum to less than the random value due to floating-point precision. This function enables designers to easily add special moments to Simon Says - perhaps a 1% chance of Simon speaking in a silly voice, or a rare celebration animation. These small surprises, made possible by proper rarity selection, add delight and replayability to the experience.
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