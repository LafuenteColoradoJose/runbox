import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Playbook {
  id: number;
  name: string;
  path?: string;
  content?: string;
  source_type?: string;
  git_repo_url?: string;
  git_branch?: string;
  git_path?: string;
  description: string;
  organization_id?: number;
  organization_name?: string;
  created_at: string;
}

export interface Job {
  id: number;
  playbook_id: number;
  status: string;
  log_output: string;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class PlaybookService {
  private http = inject(HttpClient);
  // Usa variable de entorno, con fallback para que no rompa
  private apiUrl = (typeof environment !== 'undefined' && environment.apiUrl) ? environment.apiUrl : 'http://localhost:3000/api';

  getPlaybooks(): Observable<Playbook[]> {
    return this.http.get<Playbook[]>(`${this.apiUrl}/playbooks`);
  }

  createPlaybook(data: Partial<Playbook>): Observable<Playbook> {
    return this.http.post<Playbook>(`${this.apiUrl}/playbooks`, data);
  }

  updatePlaybook(id: number, data: Partial<Playbook>): Observable<{success: boolean}> {
    return this.http.put<{success: boolean}>(`${this.apiUrl}/playbooks/${id}`, data);
  }

  deletePlaybook(id: number): Observable<{success: boolean}> {
    return this.http.delete<{success: boolean}>(`${this.apiUrl}/playbooks/${id}`);
  }

  runPlaybook(playbookId: number, inventoryId?: number | null): Observable<{ message: string, job: { id: number } }> {
    return this.http.post<{ message: string, job: { id: number } }>(`${this.apiUrl}/playbooks/run`, { id: playbookId, inventoryId });
  }

  getJob(jobId: number): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/jobs/${jobId}`);
  }
}
