/**
 * Recursively extracts all nested objects with an "integrity" key into a map.
 * @param {*} obj - The source object or array to traverse.
 * @param {Map<string, Object>} [map=new Map()] - Map to collect resources => object.
 * @returns {Map<string, Object>} All found resources keyed by their integrity key.
 */
function collectResourceMap(obj, map = new Map()) {
  if (obj && typeof obj === "object") {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        collectResourceMap(item, map);
      }
    } else {
      if (Object.prototype.hasOwnProperty.call(obj, "integrity")) {
        map.set(obj.integrity, obj);
      }
      for (const value of Object.values(obj)) {
        collectResourceMap(value, map);
      }
    }
  }
  return map;
}

/**
 * Recursively replaces objects based on a provided resource map.
 * @param {*} obj - The source to transform.
 * @param {Map<string, Object>} map - Map of resources => replacement object.
 * @returns {*} A new object/array with replacements applied.
 */
function patchResources(obj, map) {
  if (obj && typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map((item) => patchResources(item, map));
    }
    if (
      Object.prototype.hasOwnProperty.call(obj, "integrity") &&
      map.has(obj.integrity)
    ) {
      // Merge shallow copy of original with replacement data
      return { ...obj, ...map.get(obj.integrity) };
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = patchResources(value, map);
    }
    return result;
  }
  return obj;
}

/**
 * Recursively filters out any objects with a specific integrity key.
 * @param {*} obj - The source to filter.
 * @param {string} target - Integrity key to remove.
 * @returns {*|undefined} Filtered object or undefined if the integrity key matches.
 */
function pruneResources(obj, integrity) {
  if (Array.isArray(obj)) {
    const out = [];
    for (const item of obj) {
      const filtered = pruneResources(item, integrity);
      if (filtered !== undefined) {
        out.push(filtered);
      }
    }
    return out;
  }

  if (obj !== null && typeof obj === "object") {
    if (obj.integrity === integrity) {
      return undefined;
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const filtered = pruneResources(value, integrity);
      if (filtered !== undefined) {
        result[key] = filtered;
      }
    }

    return result;
  }
  return obj;
}

module.exports = {
  collectResourceMap,
  patchResources,
  pruneResources,
};
