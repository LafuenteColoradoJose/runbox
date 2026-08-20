import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth';
import { StatusBadge } from '../../components/status-badge/status-badge';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadge],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  public currentUser = this.authService.currentUser;
  public stats = toSignal(this.dashboardService.getStats());
}
