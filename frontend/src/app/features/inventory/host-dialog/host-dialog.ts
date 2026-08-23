import { Component, Inject, inject, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { InventoryService, Host, Group } from '../../../core/services/inventory.service';

export interface HostDialogData {
  host?: Host;
  inventoryId: number;
}

@Component({
  selector: 'app-host-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.host ? 'Edit Host' : 'New Host' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="hostForm" class="dialog-form">
        <mat-form-field appearance="fill">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="E.g., web-server-1" />
          @if (hostForm.get('name')?.hasError('required')) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>IP Address / Hostname</mat-label>
          <input matInput formControlName="ip_address" placeholder="E.g., 192.168.1.100" />
          @if (hostForm.get('ip_address')?.hasError('required')) {
            <mat-error>IP Address is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Groups</mat-label>
          <mat-select formControlName="groups" multiple>
            @for (g of availableGroups; track g) {
              <mat-option [value]="g.id">{{ g.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Variables (JSON)</mat-label>
          <textarea
            matInput
            formControlName="variables"
            rows="8"
            class="font-mono bg-[var(--surface-color)] text-sm"
            placeholder="{}"
          ></textarea>
          @if (hostForm.get('variables')?.hasError('invalidJson')) {
            <mat-error>Invalid JSON format</mat-error>
          }
          <mat-hint>Professional JSON editor. Enter valid JSON.</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="hostForm.invalid" (click)="save()">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      textarea.font-mono {
        font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', Courier, monospace;
        line-height: 1.5;
      }
    `,
  ],
})
export class HostDialog implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private dialogRef = inject(MatDialogRef<HostDialog>);
  data = inject(MAT_DIALOG_DATA) as HostDialogData;

  hostForm: FormGroup;
  availableGroups: Group[] = [];

  constructor() {
    this.hostForm = this.fb.group({
      name: [this.data.host?.name || '', Validators.required],
      ip_address: [this.data.host?.ip_address || '', Validators.required],
      groups: [this.data.host?.groups?.map((g) => g.id) || []],
      variables: [
        this.data.host?.variables
          ? typeof this.data.host.variables === 'string'
            ? this.data.host.variables
            : JSON.stringify(this.data.host.variables, null, 2)
          : '{}',
        [this.jsonValidator],
      ],
    });
  }

  ngOnInit() {
    this.inventoryService.getGroupsByInventory(this.data.inventoryId).subscribe((groups) => {
      this.availableGroups = groups;
    });
  }

  jsonValidator(control: any) {
    try {
      if (control.value) JSON.parse(control.value);
      return null;
    } catch (e) {
      return { invalidJson: true };
    }
  }

  save() {
    if (this.hostForm.invalid) return;
    const formVal = this.hostForm.value;

    if (this.data.host?.id) {
      this.inventoryService.updateHost(this.data.host.id, formVal).subscribe({
        next: () => this.dialogRef.close(true),
      });
    } else {
      this.inventoryService.createHost(this.data.inventoryId, formVal).subscribe({
        next: () => this.dialogRef.close(true),
      });
    }
  }
}
