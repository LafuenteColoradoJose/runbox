import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Playbook } from '../../core/services/playbook';

@Component({
  selector: 'app-playbook-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './playbook-card.html',
  styleUrl: './playbook-card.css'
})
export class PlaybookCard {
  playbook = input.required<Playbook>();
  onRun = output<Playbook>();
}
