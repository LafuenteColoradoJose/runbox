import { TestBed } from '@angular/core/testing';
import { SocketService } from './socket';

describe('SocketService', () => {
  let service: SocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocketService);
    (service as any).socket = {
      on: vi.fn(),
      off: vi.fn()
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should listen to job log', () => {
    const callback = vi.fn();
    service.listenToJob(1, callback);
    expect((service as any).socket.on).toHaveBeenCalledWith('job-1-log', callback);
  });

  it('should listen to job status', () => {
    const callback = vi.fn();
    service.listenToJobStatus(1, callback);
    expect((service as any).socket.on).toHaveBeenCalledWith('job-1-status', callback);
  });

  it('should stop listening to job events', () => {
    service.stopListening(1);
    expect((service as any).socket.off).toHaveBeenCalledWith('job-1-log');
    expect((service as any).socket.off).toHaveBeenCalledWith('job-1-status');
  });
});

