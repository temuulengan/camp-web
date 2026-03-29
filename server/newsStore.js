const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, '..', 'data', 'news.json');

function readAll() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    return [];
  }
}

function writeAll(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function getById(id) {
  const items = readAll();
  return items.find((i) => i.id === id);
}

module.exports = { readAll, writeAll, getById };
