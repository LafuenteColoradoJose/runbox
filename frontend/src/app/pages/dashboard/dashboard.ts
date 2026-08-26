import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { NgxEchartsDirective } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth';
import { StatusBadge } from '../../components/status-badge/status-badge';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    StatusBadge,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    NgxEchartsDirective
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);

  public currentUser = this.authService.currentUser;
  public stats = toSignal(this.dashboardService.getStats());

  public chartOption = computed<EChartsOption>(() => {
    const data = this.stats();
    if (!data) return {};

    const successCount = data.totalJobs - data.failedJobs;
    const failedCount = data.failedJobs;

    // Hardcode hex colors that closely match the Material 3 light theme badges
    // to avoid ECharts Canvas rendering bugs with computed styles / CSS vars.
    const successColor = '#67deb6'; // Soft mint/cyan for success
    const failedColor = '#ffb4ab';  // Soft red for failed

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['Success', 'Failed'],
        top: 0,
        right: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: [
        {
          type: 'category',
          data: ['All Time Executions']
        }
      ],
      yAxis: [
        {
          type: 'value'
        }
      ],
      series: [
        {
          name: 'Success',
          type: 'bar',
          stack: 'Status',
          barWidth: '30%',
          itemStyle: { color: successColor },
          emphasis: { disabled: true },
          data: [successCount > 0 ? successCount : 0]
        },
        {
          name: 'Failed',
          type: 'bar',
          stack: 'Status',
          barWidth: '30%',
          itemStyle: { color: failedColor },
          emphasis: { disabled: true },
          data: [failedCount]
        }
      ]
    };
  });
}
