import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

process.env.TEST_DB_NAME = 'runbox.db.spec.db';
import db from '../db.js';

describe('db initialization', () => {
  const testDbName = 'runbox.db.spec.db';
  const dbPath = path.join(__dirname, '..', testDbName);
  const testPlaybookPath = path.join(__dirname, '..', 'test.yml');

  beforeEach(() => {
    // We don't delete the DB or testPlaybook here anymore 
    // because db.js evaluated at the top level already created them!
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
    // Force playbook and user creation to test it properly
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DELETE FROM jobs');
    db.exec('DELETE FROM playbooks');
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM user_organizations');
    db.exec('DELETE FROM organizations');
    db.exec('DELETE FROM inventories');
    db.exec('DELETE FROM groups');
    db.exec('DELETE FROM hosts');
    db.exec('DELETE FROM host_groups');
    db.exec('PRAGMA foreign_keys = ON');
    if (fs.existsSync(testPlaybookPath)) {
      fs.unlinkSync(testPlaybookPath);
    }
    
    // Run initialization manually
    db.init();

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
    expect(playbook.tags).toBeDefined();
    expect(JSON.parse(playbook.tags)).toContain('Test');

    // Check if test.yml file was generated
    expect(fs.existsSync(testPlaybookPath)).toBe(true);

    // Check if dummy organization was created
    const orgStmt = db.prepare('SELECT * FROM organizations WHERE name = ?');
    const org = orgStmt.get('TechNova Global (Demo)');
    expect(org).toBeDefined();

    // Check if dummy inventory was created
    const invStmt = db.prepare('SELECT * FROM inventories WHERE name = ?');
    const inv = invStmt.get('Datacenter Principal');
    expect(inv).toBeDefined();
    expect(inv.organization_id).toBe(org.id);

    // Check if dummy group was created
    const groupStmt = db.prepare('SELECT * FROM groups WHERE name = ?');
    const group = groupStmt.get('ventas_servers');
    expect(group).toBeDefined();
    expect(group.inventory_id).toBe(inv.id);

    // Check if dummy host was created
    const hostStmt = db.prepare('SELECT * FROM hosts WHERE name = ?');
    const host = hostStmt.get('crm-app-01');
    expect(host).toBeDefined();
    expect(host.inventory_id).toBe(inv.id);
  });

  it('should not seed data if already exists', () => {
    // Get counts before second init
    const usersCount = db.prepare('SELECT count(*) as c FROM users').get().c;
    const playbooksCount = db.prepare('SELECT count(*) as c FROM playbooks').get().c;
    const orgsCount = db.prepare('SELECT count(*) as c FROM organizations').get().c;

    // Run init again
    db.init();

    // Counts should be the same
    expect(db.prepare('SELECT count(*) as c FROM users').get().c).toBe(usersCount);
    expect(db.prepare('SELECT count(*) as c FROM playbooks').get().c).toBe(playbooksCount);
    expect(db.prepare('SELECT count(*) as c FROM organizations').get().c).toBe(orgsCount);
  });

  it('should add missing columns and recreate dummy data if missing', () => {
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DROP TABLE IF EXISTS jobs');
    db.exec('DROP TABLE IF EXISTS playbooks');
    db.exec('DROP TABLE IF EXISTS users');
    
    // Create old version of playbooks without the new columns
    db.exec(`
      CREATE TABLE playbooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT,
        content TEXT
      )
    `);

    // Create old version of jobs
    db.exec(`
      CREATE TABLE jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playbook_id INTEGER,
        status TEXT
      )
    `);

    db.exec('PRAGMA foreign_keys = ON');
    
    if (fs.existsSync(testPlaybookPath)) {
      fs.unlinkSync(testPlaybookPath);
    }
    
    // Run init - this should trigger the ALTER TABLE statements
    db.init();
    
    // Check columns
    const playbooksCols = db.prepare("PRAGMA table_info(playbooks)").all();
    expect(playbooksCols.find(c => c.name === 'organization_id')).toBeDefined();
    expect(playbooksCols.find(c => c.name === 'source_type')).toBeDefined();
    expect(playbooksCols.find(c => c.name === 'git_repo_url')).toBeDefined();
    expect(playbooksCols.find(c => c.name === 'tags')).toBeDefined();
    
    const jobsCols = db.prepare("PRAGMA table_info(jobs)").all();
    expect(jobsCols.find(c => c.name === 'user_id')).toBeDefined();
  });

  it('should initialize successfully from an empty state (all tables dropped)', () => {
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec('DROP TABLE IF EXISTS jobs');
    db.exec('DROP TABLE IF EXISTS playbooks');
    db.exec('DROP TABLE IF EXISTS user_organizations');
    db.exec('DROP TABLE IF EXISTS users');
    db.exec('DROP TABLE IF EXISTS host_groups');
    db.exec('DROP TABLE IF EXISTS hosts');
    db.exec('DROP TABLE IF EXISTS groups');
    db.exec('DROP TABLE IF EXISTS inventories');
    db.exec('DROP TABLE IF EXISTS organizations');
    db.exec('PRAGMA foreign_keys = ON');

    if (fs.existsSync(testPlaybookPath)) {
      fs.unlinkSync(testPlaybookPath);
    }

    db.init();

    // Verify
    const orgsCount = db.prepare('SELECT count(*) as c FROM organizations').get().c;
    expect(orgsCount).toBeGreaterThan(0);
  });
});
