import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  isDarkMode = false;
  private authService = inject(AuthService);
  currentUser = this.authService.currentUser;
  
  // Usamos una señal para saber si está colapsado para la vista móvil en el futuro,
  // por ahora lo usaremos solo si es necesario, la mayor parte de la expansión es por CSS
  isOpen = signal(false);

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

