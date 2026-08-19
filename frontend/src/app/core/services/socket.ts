import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket;
  private apiUrl = location.port === '4200' ? 'http://localhost:3000' : '';

  constructor() {
    this.socket = io(this.apiUrl);
  }

  listenToJob(jobId: number, callback: (log: any) => void) {
    this.socket.on(`job-${jobId}-log`, callback);
  }

  listenToJobStatus(jobId: number, callback: (status: any) => void) {
    this.socket.on(`job-${jobId}-status`, callback);
  }

  stopListening(jobId: number) {
    this.socket.off(`job-${jobId}-log`);
    this.socket.off(`job-${jobId}-status`);
  }
}
