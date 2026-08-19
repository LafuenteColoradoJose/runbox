import { Injectable } from '@angular/core';

export interface Playbook {
  id: number;
  name: string;
  path: string;
  description: string;
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
  private apiUrl = location.port === '4200' ? 'http://localhost:3000/api' : '/api';

  async getPlaybooks(): Promise<Playbook[]> {
    const res = await fetch(`${this.apiUrl}/playbooks`);
    return res.json();
  }

  async runPlaybook(playbookId: number): Promise<Job> {
    const res = await fetch(`${this.apiUrl}/playbooks/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: playbookId })
    });
    const data = await res.json();
    return data.job;
  }

  async getJob(jobId: number): Promise<Job> {
    const res = await fetch(`${this.apiUrl}/jobs/${jobId}`);
    return res.json();
  }
}
