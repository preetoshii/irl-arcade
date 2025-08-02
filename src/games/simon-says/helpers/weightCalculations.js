/**
 * Weight calculation utilities for Simon Says
 * Pure functions for weight-related math
 */

/**
 * Calculate weighted random selection
 * @param {Array} items - Array of {item, weight} objects
 * @returns {Object} Selected item
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
 * @param {number} baseWeight - Starting weight
 * @param {Array} modifiers - Array of modifier objects {factor, reason}
 * @returns {Object} Result with final weight and applied modifiers
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
 * @param {Object} weights - Weight distribution
 * @returns {number} Entropy value (0 = no variety, 1 = maximum variety)
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
 * @param {Array} cumulative - Cumulative weight array
 * @param {number} random - Random value between 0 and total weight
 * @returns {number} Selected index
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