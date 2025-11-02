// src/data/inMemoryDB.js

let sweets = []; // In-memory array acting as database
let nextId = 1;

export const SweetRepository = {
  // Create
  create(sweetDto) {
    const newSweet = {
      id: String(nextId++),
      ...sweetDto
    };
    sweets.push(newSweet);
    return newSweet;
  },

  // Read all
  findAll() {
    return sweets;
  },

  // Read one
  findById(id) {
    return sweets.find(sweet => sweet.id === id);
  },

  // Update
  update(id, updateDto) {
    const index = sweets.findIndex(s => s.id === id);
    if (index === -1) return undefined;

    sweets[index] = { ...sweets[index], ...updateDto };
    return sweets[index];
  },

  // Delete
  delete(id) {
    const index = sweets.findIndex(s => s.id === id);
    if (index === -1) return false;

    sweets.splice(index, 1);
    return true;
  }
};
export const db = { sweets };