import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="'badge-' + status.toLowerCase()">
      {{ status | uppercase }}
    </span>
  `,
  styles: [`
    .badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: bold;
      display: inline-block;
    }
    .badge-pending { background: #e0e0e0; color: #333; }
    .badge-running { background: #e3f2fd; color: #1976d2; }
    .badge-success { background: #e8f5e9; color: #2e7d32; }
    .badge-failed { background: #ffebee; color: #c62828; }
    .badge-error { background: #ffebee; color: #c62828; }
  `]
})
export class StatusBadge {
  @Input({ required: true }) status!: string;
}
