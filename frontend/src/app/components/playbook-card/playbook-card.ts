import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Playbook } from '../../core/services/playbook';

@Component({
  selector: 'app-playbook-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="playbook-card">
      <mat-card-header>
        <mat-icon mat-card-avatar class="playbook-icon">integration_instructions</mat-icon>
        <mat-card-title>{{ playbook.name }}</mat-card-title>
        <mat-card-subtitle>{{ playbook.path }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p>{{ playbook.description || 'No description provided.' }}</p>
      </mat-card-content>
      <mat-card-actions align="end">
        <button mat-flat-button color="primary" (click)="onRun.emit(playbook)">
          <mat-icon>play_arrow</mat-icon> Run
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .playbook-card {
      margin-bottom: 16px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .playbook-icon {
      font-size: 32px;
      height: 32px;
      width: 32px;
      color: #3f51b5;
    }
    mat-card-content {
      flex-grow: 1;
      margin-top: 16px;
      color: rgba(0,0,0,0.6);
    }
  `]
})
export class PlaybookCard {
  @Input({ required: true }) playbook!: Playbook;
  @Output() onRun = new EventEmitter<Playbook>();
}
