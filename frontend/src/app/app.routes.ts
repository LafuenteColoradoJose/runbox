import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { guestGuard } from './core/guards/guest-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login), canActivate: [guestGuard] },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard), canActivate: [authGuard] },
  { path: 'organizations', loadComponent: () => import('./features/organizations/organizations-list/organizations-list').then(m => m.OrganizationsList), canActivate: [authGuard] },
  { path: 'playbooks', loadComponent: () => import('./pages/playbooks/playbooks').then(m => m.Playbooks), canActivate: [authGuard] },
  { path: 'jobs/:id', loadComponent: () => import('./pages/job-detail/job-detail').then(m => m.JobDetail), canActivate: [authGuard] },
  { path: 'inventory', loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent), canActivate: [authGuard] },
  { path: 'inventory/:id', loadComponent: () => import('./features/inventory/inventory-detail/inventory-detail').then(m => m.InventoryDetail), canActivate: [authGuard] },
  { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.Profile), canActivate: [authGuard] },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings').then(m => m.Settings), canActivate: [authGuard] },
  { path: 'users', loadComponent: () => import('./pages/users/users').then(m => m.Users), canActivate: [authGuard, adminGuard] }
];
