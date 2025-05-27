export function findChangesInObject(target, updates) {
    let changes = [];
    
    for (let key in updates) {
      if (target[key] !== updates[key]) {
        changes.push(`${key}: ${target[key]} -> ${updates[key]}`);
      }
    }
    // Return the changes as a string
    return changes.join("\n");
}

export function deepEqualObject(obj1, obj2, ignoreKeys = []) {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' || obj1 === null ||
    typeof obj2 !== 'object' || obj2 === null
  ) {
    return false;
  }

  const keys1 = Object.keys(obj1).filter(key => !ignoreKeys.includes(key));
  const keys2 = Object.keys(obj2).filter(key => !ignoreKeys.includes(key));

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (!keys2.includes(key)) return false;

    const val1 = obj1[key];
    const val2 = obj2[key];

    // Recursively compare arrays or objects
    const areObjects = typeof val1 === 'object' && typeof val2 === 'object';

    if (areObjects && !deepEqualObject(val1, val2, ignoreKeys)) {
      return false;
    } else if (!areObjects && val1 !== val2) {
      return false;
    }
  }

  return true;
}