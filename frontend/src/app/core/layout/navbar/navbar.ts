import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Logo } from '../../../components/logo/logo';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule, MatIconModule, MatButtonModule, Logo],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  isDarkMode = false;

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
}
