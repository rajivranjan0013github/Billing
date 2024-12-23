let user = { name: "rajiv", age: 4, home: "patna" };
let value = { name: "ranjan", age: 23 };

function assignWithChanges(target, updates) {
  let changes = [];
  
  for (let key in updates) {
    if (target[key] !== updates[key]) {
      changes.push(`${key}: ${target[key]} -> ${updates[key]}`);
    }
  }

  // Update the target object
  Object.assign(target, updates);

  // Return the changes as a string
  return changes.join("\n");
}

let changeLog = assignWithChanges(user, value);
console.log(changeLog);

// Output:
// name: rajiv -> ranjan
// age: 4 -> 23

console.log(user);
// Updated `user` object: { name: "ranjan", age: 23, home: "patna" }
