import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('db initialization', () => {
  const testDbName = 'runbox.db.spec.db';
  const dbPath = path.join(__dirname, '..', testDbName);
  const testPlaybookPath = path.join(__dirname, '..', 'test.yml');

  beforeEach(() => {
    process.env.TEST_DB_NAME = testDbName;
    // Ensure clean state before each test
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    if (fs.existsSync(testPlaybookPath)) {
      fs.unlinkSync(testPlaybookPath);
    }
    
    // Clear require cache to force db.js to execute again
    delete require.cache[require.resolve('../db.js')];
    vi.resetModules();
  });

  afterEach(() => {
    // Cleanup after test
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    if (fs.existsSync(testPlaybookPath)) {
      fs.unlinkSync(testPlaybookPath);
    }
  });

  it('should initialize database and seed admin user and test playbook', () => {
    // Importing db.js will run the initialization
    const db = require('../db.js');

    // Check if user was created
    const userStmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = userStmt.get('administrator');
    expect(user).toBeDefined();
    expect(user.role).toBe('admin');

    // Check if playbook was created
    const playbookStmt = db.prepare('SELECT * FROM playbooks WHERE name = ?');
    const playbook = playbookStmt.get('Dummy Playbook (Test)');
    expect(playbook).toBeDefined();
    expect(playbook.path).toBe(testPlaybookPath);

    // Check if test.yml file was generated
    expect(fs.existsSync(testPlaybookPath)).toBe(true);

    // Check if dummy organization was created
    const orgStmt = db.prepare('SELECT * FROM organizations WHERE name = ?');
    const org = orgStmt.get('Organización de Pruebas (Dummy)');
    expect(org).toBeDefined();

    // Check if dummy inventory was created
    const invStmt = db.prepare('SELECT * FROM inventories WHERE name = ?');
    const inv = invStmt.get('Inventario Principal (Dummy)');
    expect(inv).toBeDefined();
    expect(inv.organization_id).toBe(org.id);

    // Check if dummy group was created
    const groupStmt = db.prepare('SELECT * FROM groups WHERE name = ?');
    const group = groupStmt.get('web_servers_dummy');
    expect(group).toBeDefined();
    expect(group.inventory_id).toBe(inv.id);

    // Check if dummy host was created
    const hostStmt = db.prepare('SELECT * FROM hosts WHERE name = ?');
    const host = hostStmt.get('web-01-dummy.local');
    expect(host).toBeDefined();
    expect(host.inventory_id).toBe(inv.id);
  });
});
