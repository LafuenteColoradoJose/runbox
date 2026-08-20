import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PlaybookService, Playbook } from '../../core/services/playbook';
import { PlaybookCard } from '../../components/playbook-card/playbook-card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-playbooks',
  standalone: true,
  imports: [CommonModule, PlaybookCard, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './playbooks.html',
  styleUrl: './playbooks.css'
})
export class Playbooks implements OnInit {
  private playbookService = inject(PlaybookService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  playbooks = signal<Playbook[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.playbookService.getPlaybooks().subscribe({
      next: (data) => {
        this.playbooks.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error fetching playbooks', err);
        this.snackBar.open('Error al cargar playbooks', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  runPlaybook(playbook: Playbook) {
    this.snackBar.open('Iniciando ' + playbook.name + '...', '', { duration: 1500 });
    this.playbookService.runPlaybook(playbook.id).subscribe({
      next: (res) => {
        this.router.navigate(['/jobs', res.job.id]);
      },
      error: (err) => {
        console.error('Error running playbook', err);
        this.snackBar.open('Error al ejecutar playbook', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
