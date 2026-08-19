import { TestBed } from '@angular/core/testing';
import { SocketService } from './socket';
import { vi } from 'vitest';
import { io } from 'socket.io-client';

const mockSocket = {
  on: vi.fn(),
  off: vi.fn()
};

vi.mock('socket.io-client', () => {
  return {
    io: vi.fn(() => mockSocket)
  };
});

describe('SocketService', () => {
  let service: SocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(io).toHaveBeenCalled();
  });

  it('should listen to job log', () => {
    const callback = vi.fn();
    service.listenToJob(1, callback);
    expect(mockSocket.on).toHaveBeenCalledWith('job-1-log', callback);
  });

  it('should listen to job status', () => {
    const callback = vi.fn();
    service.listenToJobStatus(1, callback);
    expect(mockSocket.on).toHaveBeenCalledWith('job-1-status', callback);
  });

  it('should stop listening to job events', () => {
    service.stopListening(1);
    expect(mockSocket.off).toHaveBeenCalledWith('job-1-log');
    expect(mockSocket.off).toHaveBeenCalledWith('job-1-status');
  });
});
