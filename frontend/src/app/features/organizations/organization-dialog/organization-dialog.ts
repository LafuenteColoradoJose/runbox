import { Component, Inject, inject } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { InventoryService, Organization } from '../../../core/services/inventory.service';

@Component({
  selector: 'app-organization-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './organization-dialog.html',
  styleUrl: './organization-dialog.css',
})
export class OrganizationDialog {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private dialogRef = inject(MatDialogRef<OrganizationDialog>);
  data = inject(MAT_DIALOG_DATA) as Organization | null;

  orgForm: FormGroup = this.fb.group({
    name: [this.data?.name || '', Validators.required],
    description: [this.data?.description || ''],
  });

  save() {
    if (this.orgForm.invalid) return;
    const formVal = this.orgForm.value;

    if (this.data?.id) {
      this.inventoryService.updateOrganization(this.data.id, formVal).subscribe({
        next: () => this.dialogRef.close(true),
      });
    } else {
      this.inventoryService.createOrganization(formVal).subscribe({
        next: () => this.dialogRef.close(true),
      });
    }
  }
}
