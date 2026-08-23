const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbName = 'runbox.db';
if (process.env.NODE_ENV === 'test') {
  const workerId = process.env.VITEST_WORKER_ID || process.env.VITEST_POOL_ID || '1';
  dbName = `runbox.test.${workerId}.db`;
}
if (process.env.TEST_DB_NAME) {
  dbName = process.env.TEST_DB_NAME;
}

const dbPath = path.join(__dirname, dbName);
const db = new Database(dbPath);

db.init = function() {
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

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS inventories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER,
      name TEXT NOT NULL,
      FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER,
      name TEXT NOT NULL,
      variables TEXT,
      FOREIGN KEY(inventory_id) REFERENCES inventories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER,
      name TEXT NOT NULL,
      ip_address TEXT,
      variables TEXT,
      FOREIGN KEY(inventory_id) REFERENCES inventories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS host_groups (
      host_id INTEGER,
      group_id INTEGER,
      PRIMARY KEY (host_id, group_id),
      FOREIGN KEY(host_id) REFERENCES hosts(id) ON DELETE CASCADE,
      FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE
    );
  `);

  // Sembrar el usuario administrador por defecto
  const userCountStmt = db.prepare('SELECT count(*) as count FROM users');
  const { count: userCount } = userCountStmt.get();
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Usuario1.', salt);
    const insertUser = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')");
    insertUser.run('administrator', hash);
  }

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

  // Sembrar datos de prueba (Dummy Data) para el Inventario
  const orgCountStmt = db.prepare('SELECT count(*) as count FROM organizations');
  const { count: orgCount } = orgCountStmt.get();
  if (orgCount === 0) {
    console.log('Seeding dummy inventory data...');
    // Organización
    const insertOrg = db.prepare('INSERT INTO organizations (name) VALUES (?)');
    const orgResult = insertOrg.run('Organización de Pruebas (Dummy)');
    const orgId = orgResult.lastInsertRowid;

    // Inventario
    const insertInv = db.prepare('INSERT INTO inventories (organization_id, name) VALUES (?, ?)');
    const invResult = insertInv.run(orgId, 'Inventario Principal (Dummy)');
    const invId = invResult.lastInsertRowid;

    // Grupos
    const insertGroup = db.prepare('INSERT INTO groups (inventory_id, name, variables) VALUES (?, ?, ?)');
    const webGroupResult = insertGroup.run(invId, 'web_servers_dummy', JSON.stringify({ http_port: 80, env: 'test' }));
    const dbGroupResult = insertGroup.run(invId, 'db_servers_dummy', JSON.stringify({ db_port: 5432 }));
    const webGroupId = webGroupResult.lastInsertRowid;
    const dbGroupId = dbGroupResult.lastInsertRowid;

    // Hosts
    const insertHost = db.prepare('INSERT INTO hosts (inventory_id, name, ip_address, variables) VALUES (?, ?, ?, ?)');
    const host1 = insertHost.run(invId, 'web-01-dummy.local', '192.168.1.101', JSON.stringify({ ansible_user: 'admin' }));
    const host2 = insertHost.run(invId, 'web-02-dummy.local', '192.168.1.102', JSON.stringify({ ansible_user: 'admin' }));
    const host3 = insertHost.run(invId, 'db-01-dummy.local', '192.168.1.201', JSON.stringify({ max_connections: 500 }));

    // Relaciones Host-Grupo
    const insertHostGroup = db.prepare('INSERT INTO host_groups (host_id, group_id) VALUES (?, ?)');
    insertHostGroup.run(host1.lastInsertRowid, webGroupId);
    insertHostGroup.run(host2.lastInsertRowid, webGroupId);
    insertHostGroup.run(host3.lastInsertRowid, dbGroupId);
  }
};

db.init();

module.exports = db;
