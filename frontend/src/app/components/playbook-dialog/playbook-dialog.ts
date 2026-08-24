import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Playbook, PlaybookService } from '../../core/services/playbook';
import { InventoryService, Organization } from '../../core/services/inventory.service';

@Component({
  selector: 'app-playbook-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './playbook-dialog.html',
  styleUrls: ['./playbook-dialog.css']
})
export class PlaybookDialog implements OnInit {
  playbookForm: FormGroup;
  isEditMode = false;
  organizations: Organization[] = [];

  constructor(
    private fb: FormBuilder,
    private playbookService: PlaybookService,
    private inventoryService: InventoryService,
    public dialogRef: MatDialogRef<PlaybookDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Playbook | null
  ) {
    this.isEditMode = !!data;
    this.playbookForm = this.fb.group({
      name: [data?.name || '', Validators.required],
      path: [data?.path || '', Validators.required],
      organization_id: [data?.organization_id || null]
    });
  }

  ngOnInit(): void {
    this.inventoryService.getOrganizations().subscribe(orgs => {
      this.organizations = orgs;
    });
  }

  onSubmit(): void {
    if (this.playbookForm.valid) {
      const formValue = this.playbookForm.value;
      if (this.isEditMode && this.data) {
        this.playbookService.updatePlaybook(this.data.id, formValue).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        this.playbookService.createPlaybook(formValue).subscribe(() => {
          this.dialogRef.close(true);
        });
      }
    }
  }
}
