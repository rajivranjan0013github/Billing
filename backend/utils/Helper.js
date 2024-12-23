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