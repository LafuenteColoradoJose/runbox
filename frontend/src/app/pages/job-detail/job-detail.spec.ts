import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobDetail } from './job-detail';
import { PlaybookService } from '../../core/services/playbook';
import { SocketService } from '../../core/services/socket';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('JobDetail', () => {
  let component: JobDetail;
  let fixture: ComponentFixture<JobDetail>;
  
  let mockPlaybookService: any;
  let mockSocketService: any;

  beforeEach(async () => {
    mockPlaybookService = {
      getJob: vi.fn().mockReturnValue(of({
        id: 1, playbook_id: 1, status: 'running', log_output: 'Starting...', created_at: '', updated_at: ''
      }))
    };

    mockSocketService = {
      listenToJob: vi.fn(),
      listenToJobStatus: vi.fn(),
      stopListening: vi.fn()
    };

    // Mock ResizeObserver and matchMedia for TerminalViewer
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    await TestBed.configureTestingModule({
      imports: [JobDetail],
      providers: [
        { provide: PlaybookService, useValue: mockPlaybookService },
        { provide: SocketService, useValue: mockSocketService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: () => '1' }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JobDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and fetch job', () => {
    expect(component).toBeTruthy();
    expect(component.jobId).toBe(1);
    expect(component.loading()).toBe(false);
    expect(component.job()?.status).toBe('running');
  });

  it('should stop listening on destroy', () => {
    component.ngOnDestroy();
    expect(mockSocketService.stopListening).toHaveBeenCalledWith(1);
  });
});
