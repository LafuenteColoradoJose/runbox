import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runPlaybook } from '../ansibleRunner';
import db from '../db';
import { EventEmitter } from 'events';
import cp from 'child_process';

describe('ansibleRunner', () => {
  let ioMock;
  let childMock;
  let jobId;

  beforeEach(() => {
    // Setup socket io mock
    ioMock = {
      emit: vi.fn()
    };

    // Setup child process mock
    childMock = new EventEmitter();
    childMock.stdout = new EventEmitter();
    childMock.stderr = new EventEmitter();
    
    vi.spyOn(cp, 'spawn').mockReturnValue(childMock);

    // Create a dummy job to update
    const insertJob = db.prepare(`INSERT INTO jobs (playbook_id, status) VALUES (1, 'running')`);
    const result = insertJob.run();
    jobId = result.lastInsertRowid;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle stdout and stderr data', async () => {
    const promise = runPlaybook('/fake/path.yml', ioMock, jobId);

    setTimeout(() => {
      // Simulate stdout and stderr
      childMock.stdout.emit('data', 'some output');
      childMock.stderr.emit('data', 'some error');
      // Simulate close with code 0
      childMock.emit('close', 0);
    }, 10);

    await promise;

    // Check if io.emit was called with stdout and stderr
    expect(ioMock.emit).toHaveBeenCalledWith(`job-${jobId}-log`, { type: 'stdout', data: 'some output' });
    expect(ioMock.emit).toHaveBeenCalledWith(`job-${jobId}-log`, { type: 'stderr', data: 'some error' });
    expect(ioMock.emit).toHaveBeenCalledWith(`job-${jobId}-status`, { status: 'success' });
    
    // Check if db was updated
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    expect(job.status).toBe('success');
    expect(job.log_output).toContain('some output');
    expect(job.log_output).toContain('some error');
  });

  it('should handle non-zero exit code', async () => {
    // Insert inventory to ensure cleanup() has a file to delete
    const invId = db.prepare('INSERT INTO inventories (name) VALUES (?)').run('Inv 1').lastInsertRowid;
    const promise = runPlaybook('/fake/path.yml', ioMock, jobId, invId);
    
    setTimeout(() => {
      childMock.emit('close', 1);
    }, 10);

    await expect(promise).rejects.toThrow('Exit code 1');
    expect(ioMock.emit).toHaveBeenCalledWith(`job-${jobId}-status`, { status: 'failed' });
    
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    expect(job.status).toBe('failed');
  });

  it('should handle process errors', async () => {
    // Insert inventory to ensure cleanup() has a file to delete
    const invId = db.prepare('INSERT INTO inventories (name) VALUES (?)').run('Inv 2').lastInsertRowid;
    const promise = runPlaybook('/fake/path.yml', ioMock, jobId, invId);
    
    setTimeout(() => {
      childMock.emit('error', new Error('Failed to start'));
    }, 10);

    await expect(promise).rejects.toThrow('Failed to start');
    expect(ioMock.emit).toHaveBeenCalledWith(`job-${jobId}-status`, { status: 'error' });
    
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    expect(job.status).toBe('error');
    expect(job.log_output).toContain('Failed to start');
  });

  it('should generate inventory and clean it up', async () => {
    // Insert inventory
    const insertInv = db.prepare('INSERT INTO inventories (name) VALUES (?)');
    const invId = insertInv.run('Test Inv').lastInsertRowid;
    
    // Insert host
    const insertHost = db.prepare('INSERT INTO hosts (inventory_id, name, ip_address, variables) VALUES (?, ?, ?, ?)');
    const hostId = insertHost.run(invId, 'testhost', '10.0.0.1', JSON.stringify({ myvar: "value" })).lastInsertRowid;
    
    // Insert group
    const insertGroup = db.prepare('INSERT INTO groups (inventory_id, name, variables) VALUES (?, ?, ?)');
    const groupId = insertGroup.run(invId, 'testgroup', JSON.stringify({ gvar: 123 })).lastInsertRowid;
    
    // Insert host group
    db.prepare('INSERT INTO host_groups (host_id, group_id) VALUES (?, ?)').run(hostId, groupId);
    
    const promise = runPlaybook('/fake/path.yml', ioMock, jobId, invId);
    
    setTimeout(() => {
      // Simulate close with code 0
      childMock.emit('close', 0);
    }, 10);
    
    await promise;
    
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    expect(job.status).toBe('success');
    expect(cp.spawn).toHaveBeenCalled();
    const args = cp.spawn.mock.calls[0][1];
    expect(args).toContain('-i');
  });

  it('should ignore invalid json in variables gracefully', async () => {
    const invId = db.prepare('INSERT INTO inventories (name) VALUES (?)').run('Bad Inv').lastInsertRowid;
    db.prepare('INSERT INTO hosts (inventory_id, name, ip_address, variables) VALUES (?, ?, ?, ?)').run(invId, 'badhost', '10.0.0.2', 'not json');
    db.prepare('INSERT INTO groups (inventory_id, name, variables) VALUES (?, ?, ?)').run(invId, 'badgroup', 'not json');
    
    const promise = runPlaybook('/fake/path.yml', ioMock, jobId, invId);
    
    setTimeout(() => {
      // Simulate close with code 0
      childMock.emit('close', 0);
    }, 10);
    
    await promise;
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    expect(job.status).toBe('success');
  });
});
