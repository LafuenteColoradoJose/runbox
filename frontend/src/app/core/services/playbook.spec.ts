import { TestBed } from '@angular/core/testing';
import { PlaybookService, Playbook, Job } from './playbook';
import { vi } from 'vitest';

describe('PlaybookService', () => {
  let service: PlaybookService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlaybookService);
    
    // Reset fetch mock before each test
    window.fetch = vi.fn();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch playbooks', async () => {
    const mockPlaybooks: Playbook[] = [{
      id: 1, name: 'Test Playbook', path: '/test', description: 'desc', created_at: 'now'
    }];
    
    (window.fetch as any).mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockPlaybooks)
    });

    const playbooks = await service.getPlaybooks();
    expect(playbooks).toEqual(mockPlaybooks);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/playbooks'));
  });

  it('should run a playbook', async () => {
    const mockJob: Job = {
      id: 1, playbook_id: 1, status: 'running', log_output: '', created_at: 'now', updated_at: 'now'
    };
    
    (window.fetch as any).mockResolvedValue({
      json: vi.fn().mockResolvedValue({ job: mockJob })
    });

    const job = await service.runPlaybook(1);
    expect(job).toEqual(mockJob);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/playbooks/run'), expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ id: 1 })
    }));
  });

  it('should get a job by id', async () => {
    const mockJob: Job = {
      id: 1, playbook_id: 1, status: 'running', log_output: '', created_at: 'now', updated_at: 'now'
    };
    
    (window.fetch as any).mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockJob)
    });

    const job = await service.getJob(1);
    expect(job).toEqual(mockJob);
    expect(window.fetch).toHaveBeenCalledWith(expect.stringContaining('/jobs/1'));
  });
});
