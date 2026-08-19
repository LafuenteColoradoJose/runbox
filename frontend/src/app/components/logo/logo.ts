import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './logo.html',
  styleUrl: './logo.css',
})
export class Logo {}
