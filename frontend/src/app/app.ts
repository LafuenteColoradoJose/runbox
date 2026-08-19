import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Sidebar } from './core/layout/sidebar/sidebar';
import { Navbar } from './core/layout/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatSidenavModule, Sidebar, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',})
export class App {
  title = 'frontend';
}
