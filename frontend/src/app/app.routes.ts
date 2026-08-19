import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'playbooks', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'playbooks', loadComponent: () => import('./pages/playbooks/playbooks').then(m => m.Playbooks) },
  { path: 'jobs/:id', loadComponent: () => import('./pages/job-detail/job-detail').then(m => m.JobDetail) }
];
