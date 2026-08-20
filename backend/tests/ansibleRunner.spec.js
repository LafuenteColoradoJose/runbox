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

    // Simulate stdout and stderr
    childMock.stdout.emit('data', 'some output');
    childMock.stderr.emit('data', 'some error');
    
    // Simulate close with code 0
    childMock.emit('close', 0);

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
    const promise = runPlaybook('/fake/path.yml', ioMock, jobId);
    
    childMock.emit('close', 1);

    await expect(promise).rejects.toThrow('Exit code 1');
    expect(ioMock.emit).toHaveBeenCalledWith(`job-${jobId}-status`, { status: 'failed' });
    
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    expect(job.status).toBe('failed');
  });

  it('should handle process errors', async () => {
    const promise = runPlaybook('/fake/path.yml', ioMock, jobId);
    
    childMock.emit('error', new Error('Failed to start'));

    await expect(promise).rejects.toThrow('Failed to start');
    expect(ioMock.emit).toHaveBeenCalledWith(`job-${jobId}-status`, { status: 'error' });
    
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    expect(job.status).toBe('error');
    expect(job.log_output).toContain('Failed to start');
  });
});
