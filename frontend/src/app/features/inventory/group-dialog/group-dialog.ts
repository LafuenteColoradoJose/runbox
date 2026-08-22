import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { InventoryService, Group } from '../../../core/services/inventory.service';

export interface GroupDialogData {
  group?: Group;
  inventoryId: number;
}

@Component({
  selector: 'app-group-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.group ? 'Edit Group' : 'New Group' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="groupForm" class="dialog-form">
        <mat-form-field appearance="fill">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="E.g., webservers">
          <mat-error *ngIf="groupForm.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Variables (JSON)</mat-label>
          <textarea matInput formControlName="variables" rows="5" class="font-mono" placeholder="{}"></textarea>
          <mat-error *ngIf="groupForm.get('variables')?.hasError('invalidJson')">Invalid JSON format</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="groupForm.invalid" (click)="save()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`
    textarea.font-mono {
      font-family: monospace;
    }
  `]
})
export class GroupDialog {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private dialogRef = inject(MatDialogRef<GroupDialog>);
  data = inject(MAT_DIALOG_DATA) as GroupDialogData;

  groupForm: FormGroup;

  constructor() {
    this.groupForm = this.fb.group({
      name: [this.data.group?.name || '', Validators.required],
      variables: [
        this.data.group?.variables ? (typeof this.data.group.variables === 'string' ? this.data.group.variables : JSON.stringify(this.data.group.variables, null, 2)) : '{}', 
        [this.jsonValidator]
      ]
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
    if (this.groupForm.invalid) return;
    const formVal = this.groupForm.value;

    if (this.data.group?.id) {
      this.inventoryService.updateGroup(this.data.group.id, formVal).subscribe({
        next: () => this.dialogRef.close(true)
      });
    } else {
      this.inventoryService.createGroup(this.data.inventoryId, formVal).subscribe({
        next: () => this.dialogRef.close(true)
      });
    }
  }
}
