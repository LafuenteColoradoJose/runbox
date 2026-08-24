const Database = require('better-sqlite3');
const db = new Database('./runbox.db');

try {
  db.exec(`
    PRAGMA foreign_keys=off;
    BEGIN TRANSACTION;

    CREATE TABLE playbooks_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT,
      content TEXT,
      source_type TEXT DEFAULT 'local_path',
      organization_id INTEGER,
      FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE SET NULL
    );

    INSERT INTO playbooks_new (id, name, path, organization_id)
    SELECT id, name, path, organization_id FROM playbooks;

    DROP TABLE playbooks;
    ALTER TABLE playbooks_new RENAME TO playbooks;

    COMMIT;
    PRAGMA foreign_keys=on;
  `);
  console.log("Migration successful.");
} catch (e) {
  console.error("Migration failed:", e.message);
}
