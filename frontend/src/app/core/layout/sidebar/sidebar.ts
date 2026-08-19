import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule],
  template: `
    <div class="logo-container">
      <mat-icon>terminal</mat-icon>
      <h2>Runbox</h2>
    </div>
    <mat-nav-list class="nav-list">
      <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
        <mat-icon matListItemIcon>dashboard</mat-icon>
        <span matListItemTitle>Dashboard</span>
      </a>
      <a mat-list-item routerLink="/playbooks" routerLinkActive="active-link">
        <mat-icon matListItemIcon>library_books</mat-icon>
        <span matListItemTitle>Playbooks</span>
      </a>
    </mat-nav-list>
  `,
  styles: [`
    .logo-container {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .logo-container h2 {
      margin: 0;
      font-weight: 500;
      font-size: 20px;
      color: #fff;
    }
    .logo-container mat-icon {
      color: #4caf50;
    }
    .nav-list {
      padding-top: 10px;
    }
    .nav-list a {
      color: rgba(255,255,255,0.7);
    }
    .nav-list a:hover {
      background-color: rgba(255,255,255,0.05);
      color: #fff;
    }
    .active-link {
      background-color: rgba(255,255,255,0.1) !important;
      color: #fff !important;
      border-left: 4px solid #4caf50;
    }
    .active-link mat-icon {
      color: #4caf50;
    }
    ::ng-deep .mat-mdc-list-item-icon {
      color: inherit !important;
    }
  `]
})
export class Sidebar {}
