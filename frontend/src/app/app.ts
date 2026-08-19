import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Sidebar } from './core/layout/sidebar/sidebar';
import { Navbar } from './core/layout/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, Sidebar, Navbar],
  template: `
    <app-navbar></app-navbar>
    <mat-sidenav-container class="app-container">
      <mat-sidenav mode="side" opened class="app-sidenav">
        <app-sidebar></app-sidebar>
      </mat-sidenav>
      <mat-sidenav-content class="app-content">
        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .app-container {
      flex: 1;
    }
    .app-sidenav {
      width: 250px;
      background-color: #1e1e2d;
      color: white;
    }
    .app-content {
      background-color: #f4f6f8;
    }
    .content-wrapper {
      padding: 24px;
      height: calc(100% - 48px);
      box-sizing: border-box;
    }
  `]
})
export class App {
  title = 'frontend';
}
