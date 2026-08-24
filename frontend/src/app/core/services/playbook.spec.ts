import { TestBed } from '@angular/core/testing';
import { PlaybookService, Playbook, Job } from './playbook';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';

describe('PlaybookService', () => {
  let service: PlaybookService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(PlaybookService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch playbooks', () => {
    const mockPlaybooks: Playbook[] = [{
      id: 1, name: 'Test Playbook', path: '/test', description: 'desc', created_at: 'now'
    }];
    
    service.getPlaybooks().subscribe(playbooks => {
      expect(playbooks).toEqual(mockPlaybooks);
    });

    const req = httpMock.expectOne(req => req.url.includes('/playbooks'));
    expect(req.request.method).toBe('GET');
    req.flush(mockPlaybooks);
  });

  it('should run a playbook', () => {
    const mockJob: Job = {
      id: 1, playbook_id: 1, status: 'running', log_output: '', created_at: 'now', updated_at: 'now'
    };
    
    service.runPlaybook(1).subscribe(res => {
      expect(res.job).toEqual(mockJob);
    });

    const req = httpMock.expectOne(req => req.url.includes('/playbooks/run'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ id: 1 });
    req.flush({ message: 'Playbook iniciado', job: mockJob });
  });

  it('should get a job by id', () => {
    const mockJob: Job = {
      id: 1, playbook_id: 1, status: 'running', log_output: '', created_at: 'now', updated_at: 'now'
    };
    
    service.getJob(1).subscribe(job => {
      expect(job).toEqual(mockJob);
    });

    const req = httpMock.expectOne(req => req.url.includes('/jobs/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockJob);
  });

  it('should create a playbook', () => {
    const newPlaybook = { name: 'New pb', path: '/path' };
    const mockRes = { id: 2, ...newPlaybook, description: '', created_at: 'now' };
    
    service.createPlaybook(newPlaybook).subscribe(pb => {
      expect(pb).toEqual(mockRes);
    });

    const req = httpMock.expectOne(req => req.url.includes('/playbooks') && req.method === 'POST');
    expect(req.request.body).toEqual(newPlaybook);
    req.flush(mockRes);
  });

  it('should update a playbook', () => {
    const update = { name: 'Updated pb' };
    
    service.updatePlaybook(1, update).subscribe(res => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne(req => req.url.includes('/playbooks/1'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(update);
    req.flush({ success: true });
  });

  it('should delete a playbook', () => {
    service.deletePlaybook(1).subscribe(res => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne(req => req.url.includes('/playbooks/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  it('should run a playbook with inventoryId', () => {
    const mockJob: Job = {
      id: 2, playbook_id: 1, status: 'running', log_output: '', created_at: 'now', updated_at: 'now'
    };
    
    service.runPlaybook(1, 5).subscribe(res => {
      expect(res.job).toEqual(mockJob);
    });

    const req = httpMock.expectOne(req => req.url.includes('/playbooks/run'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ id: 1, inventoryId: 5 });
    req.flush({ message: 'Playbook iniciado', job: mockJob });
  });
});
