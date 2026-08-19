const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'runbox.db');
const db = new Database(dbPath);

// Inicializar tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS playbooks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playbook_id INTEGER,
    status TEXT,
    log_output TEXT DEFAULT '',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    FOREIGN KEY(playbook_id) REFERENCES playbooks(id)
  );
`);

// Añadir playbook de prueba si no hay ninguno
const countStmt = db.prepare('SELECT count(*) as count FROM playbooks');
const { count } = countStmt.get();
if (count === 0) {
  const testPlaybookPath = path.join(__dirname, 'test.yml');
  if (!fs.existsSync(testPlaybookPath)) {
    fs.writeFileSync(testPlaybookPath, `---
- name: Dummy Playbook
  hosts: localhost
  connection: local
  tasks:
    - name: Print a message
      debug:
        msg: "Hello from Runbox!"
    - name: Wait for 3 seconds
      pause:
        seconds: 3
    - name: Print another message
      debug:
        msg: "Task finished successfully."
`);
  }
  const insertStmt = db.prepare('INSERT INTO playbooks (name, path) VALUES (?, ?)');
  insertStmt.run('Dummy Playbook (Test)', testPlaybookPath);
}

module.exports = db;
