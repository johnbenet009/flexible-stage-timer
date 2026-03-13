const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'public', 'kjv.sqlite');
const db = new Database(dbPath, { readonly: true });
console.log('tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
console.log('verses schema:', db.prepare('PRAGMA table_info(verses)').all());
