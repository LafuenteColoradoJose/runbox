import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatDividerModule, MatTabsModule, MatSlideToggleModule, MatSelectModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private fb = inject(NonNullableFormBuilder);

  executionForm = this.fb.group({
    defaultInventory: ['/etc/ansible/hosts', Validators.required],
    defaultTimeout: [3600, [Validators.required, Validators.min(0)]],
    defaultSshKey: ['/home/runbox/.ssh/id_rsa', Validators.required]
  });

  notificationsForm = this.fb.group({
    emailAlerts: [true],
    slackIntegration: [false],
    webhookUrl: ['']
  });

  saveExecutionSettings() {
    if (this.executionForm.invalid) return;
    alert('Configuración de ejecución guardada.');
  }

  saveNotificationSettings() {
    alert('Configuración de notificaciones guardada.');
  }
}
