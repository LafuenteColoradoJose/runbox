import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Playbook } from '../../core/services/playbook';

@Component({
  selector: 'app-playbook-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule, MatChipsModule],
  templateUrl: './playbook-card.html',
  styleUrl: './playbook-card.css'
})
export class PlaybookCard {
  playbook = input.required<Playbook>();
  isAdmin = input<boolean>(false);
  viewMode = input<'grid' | 'list'>('grid');
  
  onRun = output<Playbook>();
  onEdit = output<Playbook>();
  onDelete = output<Playbook>();
}
