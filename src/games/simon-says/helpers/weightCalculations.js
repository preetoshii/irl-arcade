/**
 * Weight calculation utilities for Simon Says
 * 
 * The weightCalculations helper module provides the mathematical foundation for all probability-based decisions in Simon Says. These pure functions handle the complex calculations needed for weighted random selection, ensuring that items with higher weights are more likely to be chosen while maintaining true randomness. Think of it as a lottery system where some tickets have better odds, but every ticket has a chance. This module abstracts away the mathematical complexity, providing clean interfaces that other systems can use without understanding the underlying probability theory.
 * 
 * The elegance of these utilities lies in their composability and predictability. Each function does one thing well, has no side effects, and always produces the same output for the same input. This makes them easy to test, debug, and reason about. Whether selecting a single player from weighted options, choosing multiple items without replacement, or balancing weights to ensure variety, these functions provide reliable, mathematically-sound solutions that form the backbone of Simon Says' fair and engaging selection systems.
 */

/**
 * Calculate weighted random selection
 * 
 * This function is the workhorse of random selection throughout Simon Says, implementing a standard weighted random algorithm that's both efficient and fair. The algorithm works by imagining all weights laid end-to-end on a number line, then throwing a dart at a random position. Whichever weight segment the dart lands in determines the selection. Items with larger weights take up more space on the line, making them more likely to be hit. This creates natural probability distributions - an item with weight 60 is three times more likely to be selected than one with weight 20.
 * 
 * The implementation handles edge cases gracefully. Empty arrays return null rather than erroring. Single-item arrays skip randomization entirely. When all weights are zero (which might happen if variety enforcement has suppressed everything), it falls back to uniform random selection. This robustness ensures the game never crashes due to selection errors, maintaining smooth gameplay even in unusual circumstances. The algorithm's O(n) complexity is acceptable for Simon Says' small selection sets, though the binary search variant could be used for larger sets.
 */
export function weightedRandom(items) {
  if (!items || items.length === 0) return null;
  if (items.length === 1) return items[0];
  
  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
  
  if (totalWeight === 0) {
    // Equal selection if all weights are 0
    return items[Math.floor(Math.random() * items.length)];
  }
  
  // Random selection
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight || 0;
    if (random <= 0) {
      return item;
    }
  }
  
  // Fallback to last item
  return items[items.length - 1];
}

/**
 * Normalize weights to sum to 100
 * @param {Object} weights - Object with weight values
 * @returns {Object} Normalized weights
 */
export function normalizeWeights(weights) {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  if (total === 0) {
    // Equal weights if all are 0
    const equalWeight = 100 / Object.keys(weights).length;
    const normalized = {};
    Object.keys(weights).forEach(key => {
      normalized[key] = equalWeight;
    });
    return normalized;
  }
  
  const normalized = {};
  Object.entries(weights).forEach(([key, weight]) => {
    normalized[key] = (weight / total) * 100;
  });
  
  return normalized;
}

/**
 * Apply multiple weight modifiers
 * 
 * Weight modification is how various systems influence selection probability without directly manipulating weights. Each modifier represents a multiplicative factor with an associated reason - for example, {factor: 0.5, reason: "recently_used"} halves the weight because an item was recently selected. Multiple modifiers stack multiplicatively, so an item that's both recently used (0.5x) and overused (0.7x) would have its weight multiplied by 0.35. This creates nuanced probability adjustments where multiple factors can influence selection without any single factor dominating.
 * 
 * The function returns a detailed result object that aids in debugging and transparency. It tracks the base weight, final weight, each applied modifier with its reason, and the total modifier effect. This audit trail is invaluable during development and testing - you can see exactly why a particular item's weight was adjusted. The minimum weight of 0.1 ensures nothing becomes impossible to select, preventing the system from painting itself into corners where all options are suppressed. This thoughtful design balances variety enforcement with gameplay reliability.
 */
export function applyWeightModifiers(baseWeight, modifiers) {
  let finalWeight = baseWeight;
  const applied = [];
  
  modifiers.forEach(modifier => {
    if (modifier.factor !== 1.0) {
      finalWeight *= modifier.factor;
      applied.push({
        factor: modifier.factor,
        reason: modifier.reason,
        resultingWeight: finalWeight
      });
    }
  });
  
  return {
    baseWeight,
    finalWeight: Math.max(0.1, finalWeight), // Minimum weight
    applied,
    totalModifier: finalWeight / baseWeight
  };
}

/**
 * Calculate entropy of weight distribution
 * 
 * Entropy, borrowed from information theory, measures the "randomness" or "variety" in a weight distribution. High entropy (approaching 1) means weights are evenly distributed - every option has similar probability, creating maximum variety. Low entropy (approaching 0) means weights are concentrated on few options - the same things keep getting selected. This metric helps the system understand whether players are experiencing sufficient variety or if intervention is needed. It's like measuring whether a shuffled playlist is truly random or keeps playing the same artists.
 * 
 * The calculation uses the Shannon entropy formula, normalized to a 0-1 range for easy interpretation. The logarithmic nature of entropy captures human perception well - the difference between 2 and 4 equally-likely options feels similar to the difference between 4 and 8 options. This mathematical sophistication enables features like "variety scores" in analytics or automatic weight balancing when entropy drops too low. By quantifying variety mathematically, the system can maintain engaging gameplay without manual tuning.
 */
export function calculateWeightEntropy(weights) {
  const values = Object.values(weights);
  if (values.length <= 1) return 0;
  
  const total = values.reduce((sum, weight) => sum + weight, 0);
  if (total === 0) return 1; // All equal
  
  let entropy = 0;
  values.forEach(weight => {
    if (weight > 0) {
      const probability = weight / total;
      entropy -= probability * Math.log2(probability);
    }
  });
  
  // Normalize to 0-1 range
  const maxEntropy = Math.log2(values.length);
  return entropy / maxEntropy;
}

/**
 * Balance weights to increase variety
 * @param {Object} weights - Current weights
 * @param {number} targetEntropy - Target entropy (0-1)
 * @returns {Object} Adjusted weights
 */
export function balanceWeights(weights, targetEntropy = 0.8) {
  const currentEntropy = calculateWeightEntropy(weights);
  
  if (Math.abs(currentEntropy - targetEntropy) < 0.1) {
    return weights; // Close enough
  }
  
  const balanced = {};
  const avgWeight = Object.values(weights).reduce((a, b) => a + b, 0) / Object.keys(weights).length;
  
  Object.entries(weights).forEach(([key, weight]) => {
    if (currentEntropy < targetEntropy) {
      // Need more variety - move weights toward average
      balanced[key] = weight + (avgWeight - weight) * 0.3;
    } else {
      // Need less variety - amplify differences
      balanced[key] = weight + (weight - avgWeight) * 0.3;
    }
  });
  
  return balanced;
}

/**
 * Select multiple items without replacement
 * @param {Array} items - Array of {item, weight} objects
 * @param {number} count - Number to select
 * @returns {Array} Selected items
 */
export function weightedRandomMultiple(items, count) {
  if (!items || items.length === 0) return [];
  if (count >= items.length) return items;
  
  const selected = [];
  const remaining = [...items];
  
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const selectedItem = weightedRandom(remaining);
    selected.push(selectedItem);
    
    // Remove from remaining
    const index = remaining.indexOf(selectedItem);
    if (index >= 0) {
      remaining.splice(index, 1);
    }
  }
  
  return selected;
}

/**
 * Calculate cumulative weights for efficient selection
 * @param {Array} weights - Array of weight values
 * @returns {Array} Cumulative weights
 */
export function calculateCumulativeWeights(weights) {
  const cumulative = [];
  let sum = 0;
  
  weights.forEach(weight => {
    sum += weight;
    cumulative.push(sum);
  });
  
  return cumulative;
}

/**
 * Binary search selection using cumulative weights
 * 
 * For large selection sets, this binary search approach improves selection from O(n) to O(log n) complexity. The algorithm requires pre-calculated cumulative weights - imagine weight segments stacked vertically rather than laid horizontally. To select, generate a random height and use binary search to find which segment contains that height. This is particularly efficient when the same weight distribution is used multiple times, as the cumulative array can be calculated once and reused. While Simon Says rarely needs this optimization (selection sets are typically small), it's available for future features that might involve hundreds of options.
 * 
 * The implementation follows the standard binary search pattern with one subtlety - when the random value exactly equals a cumulative boundary, it selects the upper segment. This ensures uniform distribution even at boundaries. The algorithm's elegance lies in transforming a linear search problem into a binary search problem through preprocessing. It's a beautiful example of trading a small amount of setup time (calculating cumulative weights) for potentially large runtime savings in repeated selections.
 */
export function binarySearchSelection(cumulative, random) {
  let left = 0;
  let right = cumulative.length - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (cumulative[mid] < random) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  
  return left;
}