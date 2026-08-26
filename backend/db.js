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
      path TEXT,
      content TEXT,
      source_type TEXT DEFAULT 'local_path',
      git_repo_url TEXT,
      git_branch TEXT,
      git_path TEXT,
      tags TEXT DEFAULT '[]',
      organization_id INTEGER,
      FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE SET NULL
    );
    
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playbook_id INTEGER,
      user_id INTEGER,
      status TEXT,
      log_output TEXT DEFAULT '',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      FOREIGN KEY(playbook_id) REFERENCES playbooks(id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_organizations (
      user_id INTEGER,
      organization_id INTEGER,
      PRIMARY KEY (user_id, organization_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE
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

  // Asegurarnos de que las columnas nuevas existan si la DB ya estaba creada
  const playbooksCols = db.prepare("PRAGMA table_info(playbooks)").all();
  if (!playbooksCols.find(c => c.name === 'organization_id')) {
    db.exec("ALTER TABLE playbooks ADD COLUMN organization_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL");
  }
  if (!playbooksCols.find(c => c.name === 'source_type')) {
    db.exec("ALTER TABLE playbooks ADD COLUMN source_type TEXT DEFAULT 'local_path'");
  }
  if (!playbooksCols.find(c => c.name === 'git_repo_url')) {
    db.exec("ALTER TABLE playbooks ADD COLUMN git_repo_url TEXT");
    db.exec("ALTER TABLE playbooks ADD COLUMN git_branch TEXT");
    db.exec("ALTER TABLE playbooks ADD COLUMN git_path TEXT");
  }
  if (!playbooksCols.find(c => c.name === 'tags')) {
    db.exec("ALTER TABLE playbooks ADD COLUMN tags TEXT DEFAULT '[]'");
  }

  const orgsCols = db.prepare("PRAGMA table_info(organizations)").all();
  if (!orgsCols.find(c => c.name === 'description')) {
    db.exec("ALTER TABLE organizations ADD COLUMN description TEXT");
  }
  if (!orgsCols.find(c => c.name === 'created_at')) {
    db.exec("ALTER TABLE organizations ADD COLUMN created_at DATETIME");
  }

  const jobsCols = db.prepare("PRAGMA table_info(jobs)").all();
  if (!jobsCols.find(c => c.name === 'user_id')) {
    db.exec("ALTER TABLE jobs ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL");
  }

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
    console.log('--- SEEDING TEST PLAYBOOK NOW ---');
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
    const insertStmt = db.prepare('INSERT INTO playbooks (name, path, tags) VALUES (?, ?, ?)');
    insertStmt.run('Dummy Playbook (Test)', testPlaybookPath, JSON.stringify(['Sistema', 'Test']));
  }

  // Sembrar datos de prueba más completos (TechNova Global)
  const checkDemoOrg = db.prepare('SELECT id FROM organizations WHERE name = ?');
  const demoOrg = checkDemoOrg.get('TechNova Global (Demo)');
  
  if (!demoOrg) {
    console.log('--- SEEDING EXTENDED DUMMY DATA (TechNova Global) ---');
    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('DemoUser123.', salt);
    
    // Organización
    const insertOrg = db.prepare('INSERT INTO organizations (name) VALUES (?)');
    const orgResult = insertOrg.run('TechNova Global (Demo)');
    const orgId = orgResult.lastInsertRowid;

    // Usuarios
    const insertUser = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
    const insertUserOrg = db.prepare('INSERT INTO user_organizations (user_id, organization_id) VALUES (?, ?)');
    
    const u1 = insertUser.run('ana.ventas', hash, 'user');
    const u2 = insertUser.run('carlos.admin', hash, 'admin');
    const u3 = insertUser.run('lucia.devops', hash, 'admin');
    const u4 = insertUser.run('david.rrhh', hash, 'user');
    
    insertUserOrg.run(u1.lastInsertRowid, orgId);
    insertUserOrg.run(u2.lastInsertRowid, orgId);
    insertUserOrg.run(u3.lastInsertRowid, orgId);
    insertUserOrg.run(u4.lastInsertRowid, orgId);
    
    // Añadimos el admin principal a esta org también
    const mainAdmin = db.prepare("SELECT id FROM users WHERE username = 'administrator'").get();
    if (mainAdmin) {
      try { insertUserOrg.run(mainAdmin.id, orgId); } catch(e) {}
    }

    // Inventario
    const insertInv = db.prepare('INSERT INTO inventories (organization_id, name) VALUES (?, ?)');
    const invResult = insertInv.run(orgId, 'Datacenter Principal');
    const invId = invResult.lastInsertRowid;

    // Grupos
    const insertGroup = db.prepare('INSERT INTO groups (inventory_id, name, variables) VALUES (?, ?, ?)');
    const grpVentas = insertGroup.run(invId, 'ventas_servers', JSON.stringify({ env: 'produccion', priority: 'high' }));
    const grpAdmin = insertGroup.run(invId, 'admin_erp', JSON.stringify({ env: 'produccion', backup: 'daily' }));
    const grpIT = insertGroup.run(invId, 'it_produccion', JSON.stringify({ env: 'produccion', os: 'ubuntu-22.04' }));
    const grpDev = insertGroup.run(invId, 'desarrollo', JSON.stringify({ env: 'dev', os: 'centos-stream' }));
    
    // Hosts
    const insertHost = db.prepare('INSERT INTO hosts (inventory_id, name, ip_address, variables) VALUES (?, ?, ?, ?)');
    
    // Hosts Ventas
    const hV1 = insertHost.run(invId, 'crm-app-01', '10.0.1.10', JSON.stringify({ ram: '8GB', cpu: 4 }));
    const hV2 = insertHost.run(invId, 'crm-app-02', '10.0.1.11', JSON.stringify({ ram: '8GB', cpu: 4 }));
    const hV3 = insertHost.run(invId, 'crm-db-primary', '10.0.1.20', JSON.stringify({ db_engine: 'postgres', port: 5432 }));
    
    // Hosts Admin
    const hA1 = insertHost.run(invId, 'erp-server-01', '10.0.2.10', JSON.stringify({ application: 'odoo' }));
    const hA2 = insertHost.run(invId, 'finanzas-db', '10.0.2.20', JSON.stringify({ db_engine: 'oracle' }));
    
    // Hosts IT
    const hI1 = insertHost.run(invId, 'bastion-01', '10.0.99.5', JSON.stringify({ role: 'bastion', ssh_port: 2222 }));
    const hI2 = insertHost.run(invId, 'monitor-sys', '10.0.99.10', JSON.stringify({ software: 'prometheus' }));
    
    // Hosts Dev
    const hD1 = insertHost.run(invId, 'dev-sandbox-01', '10.1.1.10', JSON.stringify({ owner: 'lucia.devops' }));
    const hD2 = insertHost.run(invId, 'dev-sandbox-02', '10.1.1.11', JSON.stringify({ owner: 'lucia.devops' }));
    const hD3 = insertHost.run(invId, 'qa-db-test', '10.1.1.20', JSON.stringify({ ephemeral: true }));

    // Relaciones Host-Grupo
    const insertHostGroup = db.prepare('INSERT INTO host_groups (host_id, group_id) VALUES (?, ?)');
    
    [hV1, hV2, hV3].forEach(h => insertHostGroup.run(h.lastInsertRowid, grpVentas.lastInsertRowid));
    [hA1, hA2].forEach(h => insertHostGroup.run(h.lastInsertRowid, grpAdmin.lastInsertRowid));
    [hI1, hI2].forEach(h => insertHostGroup.run(h.lastInsertRowid, grpIT.lastInsertRowid));
    [hD1, hD2, hD3].forEach(h => insertHostGroup.run(h.lastInsertRowid, grpDev.lastInsertRowid));
  }
};

db.init();

module.exports = db;
