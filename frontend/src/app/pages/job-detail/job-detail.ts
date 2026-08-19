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
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.css',})
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
