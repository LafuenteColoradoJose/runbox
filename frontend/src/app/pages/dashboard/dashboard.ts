import { Component, inject, computed, signal } from '@angular/core';
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
  private isDarkMode = signal<boolean>(false);

  constructor() {
    if (typeof document !== 'undefined') {
      this.isDarkMode.set(document.documentElement.classList.contains('dark-theme'));
      const observer = new MutationObserver(() => {
        this.isDarkMode.set(document.documentElement.classList.contains('dark-theme'));
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
  }

  public chartOption = computed<EChartsOption>(() => {
    const data = this.stats();
    if (!data) return {};

    const successCount = data.totalJobs - data.failedJobs;
    const failedCount = data.failedJobs;

    // Hardcode hex colors that closely match the Material 3 light theme badges
    // to avoid ECharts Canvas rendering bugs with computed styles / CSS vars.
    const successColor = '#67deb6'; // Soft mint/cyan for success
    const failedColor = '#ffb4ab';  // Soft red for failed

    // ECharts Canvas fails to parse var(--mat-sys-on-surface).
    // We must pass strict HEX colors depending on the active theme.
    const textColor = this.isDarkMode() ? '#e2e2e2' : '#1f1f1f';

    return {
      textStyle: {
        color: textColor
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: this.isDarkMode() ? '#1e1e1e' : '#ffffff',
        borderColor: this.isDarkMode() ? '#444' : '#ccc',
        textStyle: { color: textColor }
      },
      legend: {
        data: ['Success', 'Failed'],
        textStyle: { color: textColor },
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
          data: ['All Time Executions'],
          axisLabel: { color: textColor }
        }
      ],
      yAxis: [
        {
          type: 'value',
          axisLabel: { color: textColor }
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
