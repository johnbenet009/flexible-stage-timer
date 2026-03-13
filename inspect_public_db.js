const Database = require('better-sqlite3');
const db = new Database('./public/kjv.sqlite');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('tables:', tables);

tables.forEach(t => {
  const name = t.name;
  const schema = db.prepare(`PRAGMA table_info(${name})`).all();
  console.log('schema for', name, schema);
  const sample = db.prepare(`SELECT * FROM ${name} LIMIT 1`).get();
  console.log('sample row:', sample);
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${name}`).get();
  console.log('count:', count.c);
});

db.close();
