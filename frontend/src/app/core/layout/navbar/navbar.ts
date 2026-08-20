import { Component, Inject, OnInit, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Logo } from '../../../components/logo/logo';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule, Logo],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  isDarkMode = false;
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngOnInit() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.isDarkMode = true;
      this.document.documentElement.classList.add('dark-theme');
    } else {
      this.document.documentElement.classList.add('light-theme');
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      this.document.documentElement.classList.remove('light-theme');
      this.document.documentElement.classList.add('dark-theme');
    } else {
      this.document.documentElement.classList.remove('dark-theme');
      this.document.documentElement.classList.add('light-theme');
    }
  }

  logout() {
    this.authService.logout();
  }
}
