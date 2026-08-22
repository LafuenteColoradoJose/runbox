import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { InventoryService, Inventory, Organization } from '../../../core/services/inventory.service';

@Component({
  selector: 'app-inventory-dialog',
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit Inventory' : 'New Inventory' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="invForm" class="dialog-form">
        <mat-form-field appearance="fill">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" placeholder="E.g., Production">
          <mat-error *ngIf="invForm.get('name')?.hasError('required')">Name is required</mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill">
          <mat-label>Organization</mat-label>
          <mat-select formControlName="organization_id">
            <mat-option *ngFor="let org of organizations" [value]="org.id">{{ org.name }}</mat-option>
          </mat-select>
          <mat-error *ngIf="invForm.get('organization_id')?.hasError('required')">Organization is required</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="invForm.invalid" (click)="save()">Save</button>
    </mat-dialog-actions>
  `
})
export class InventoryDialog implements OnInit {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private dialogRef = inject(MatDialogRef<InventoryDialog>);
  data = inject(MAT_DIALOG_DATA) as Inventory | null;

  organizations: Organization[] = [];

  invForm: FormGroup = this.fb.group({
    name: [this.data?.name || '', Validators.required],
    organization_id: [this.data?.organization_id || '', Validators.required]
  });

  ngOnInit() {
    this.inventoryService.getOrganizations().subscribe(orgs => {
      this.organizations = orgs;
      // if creating new and only 1 org, select it by default
      if (!this.data && orgs.length === 1) {
        this.invForm.patchValue({ organization_id: orgs[0].id });
      }
    });
  }

  save() {
    if (this.invForm.invalid) return;
    const formVal = this.invForm.value;

    if (this.data?.id) {
      this.inventoryService.updateInventory(this.data.id, formVal).subscribe({
        next: () => this.dialogRef.close(true)
      });
    } else {
      this.inventoryService.createInventory(formVal).subscribe({
        next: () => this.dialogRef.close(true)
      });
    }
  }
}
