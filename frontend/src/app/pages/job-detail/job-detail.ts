import { Component, OnInit, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TerminalViewer } from '../../components/terminal-viewer/terminal-viewer';
import { StatusBadge } from '../../components/status-badge/status-badge';
import { PlaybookService, Job } from '../../core/services/playbook';
import { SocketService } from '../../core/services/socket';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, TerminalViewer, StatusBadge, MatProgressSpinnerModule],
  template: `
    @if (loading()) {
      <div class="loading-state"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (job()) {
      <div class="job-header">
        <div class="job-title">
          <h2>Job #{{ job()!.id }}</h2>
          <app-status-badge [status]="job()!.status"></app-status-badge>
        </div>
        <div class="job-meta">
          <span>Started: {{ job()!.created_at | date:'medium' }}</span>
        </div>
      </div>
      
      <div class="terminal-wrapper">
        <app-terminal-viewer #terminal></app-terminal-viewer>
      </div>
    } @else {
      <div class="error-state">Job not found</div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .loading-state, .error-state {
      padding: 48px;
      text-align: center;
    }
    .job-header {
      margin-bottom: 16px;
      padding: 16px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .job-title {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;
    }
    .job-title h2 {
      margin: 0;
      color: #333;
    }
    .job-meta {
      font-size: 14px;
      color: #666;
    }
    .terminal-wrapper {
      flex: 1;
      min-height: 400px;
      display: flex;
      flex-direction: column;
    }
  `]
})
export class JobDetail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private playbookService = inject(PlaybookService);
  private socketService = inject(SocketService);

  @ViewChild('terminal') terminal!: TerminalViewer;

  jobId: number = 0;
  job = signal<Job | null>(null);
  loading = signal<boolean>(true);

  async ngOnInit() {
    this.jobId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.jobId) return;

    try {
      const data = await this.playbookService.getJob(this.jobId);
      this.job.set(data);

      setTimeout(() => {
        if (this.terminal && data.log_output) {
          this.terminal.write(data.log_output);
        }
        
        // Listen to active logs if it's still running
        if (data.status === 'running' || data.status === 'pending') {
          this.socketService.listenToJob(this.jobId, (log) => {
            if (this.terminal) {
              this.terminal.write(log.data);
            }
          });

          this.socketService.listenToJobStatus(this.jobId, (statusData) => {
            this.job.update(j => j ? { ...j, status: statusData.status } : null);
          });
        }
      }, 100);
    } catch (err) {
      console.error('Failed to load job', err);
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    if (this.jobId) {
      this.socketService.stopListening(this.jobId);
    }
  }
}
