const Database = require('better-sqlite3');
const db = new Database('./kjv.sqlite');

// Get table info
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

// If there are tables, get their schemas
tables.forEach(table => {
  console.log(`\nSchema for ${table.name}:`);
  const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
  console.log(schema);

  // Get a sample row
  try {
    const sample = db.prepare(`SELECT * FROM ${table.name} LIMIT 1`).get();
    console.log('Sample row:', sample);
  } catch (e) {
    console.log('Error getting sample:', e.message);
  }

  // Get count
  try {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
    console.log('Total rows:', count.count);
  } catch (e) {
    console.log('Error getting count:', e.message);
  }
});

db.close();