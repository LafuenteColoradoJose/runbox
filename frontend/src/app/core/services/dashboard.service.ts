import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RecentJob {
  id: number;
  status: string;
  started_at: string;
  playbook_name: string;
}

export interface DashboardStats {
  totalPlaybooks: number;
  totalJobs: number;
  failedJobs: number;
  totalOrganizations: number;
  totalInventories: number;
  totalGroups: number;
  totalHosts: number;
  recentJobs: RecentJob[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }
}
