import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
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
    MatButtonModule,
    MatRadioModule
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
      source_type: [data?.source_type || 'local_path'],
      path: [data?.path || ''],
      content: [data?.content || ''],
      git_repo_url: [data?.git_repo_url || ''],
      git_branch: [data?.git_branch || ''],
      git_path: [data?.git_path || ''],
      organization_id: [data?.organization_id || null]
    });
    
    this.updateValidators();
    this.playbookForm.get('source_type')?.valueChanges.subscribe(() => {
      this.updateValidators();
    });
  }
  
  private updateValidators() {
    const sourceType = this.playbookForm.get('source_type')?.value;
    const pathControl = this.playbookForm.get('path');
    const contentControl = this.playbookForm.get('content');
    const gitRepoUrlControl = this.playbookForm.get('git_repo_url');
    const gitPathControl = this.playbookForm.get('git_path');
    const gitBranchControl = this.playbookForm.get('git_branch');
    
    pathControl?.clearValidators();
    contentControl?.clearValidators();
    gitRepoUrlControl?.clearValidators();
    gitPathControl?.clearValidators();
    
    if (sourceType === 'local_path') {
      pathControl?.setValidators([Validators.required]);
    } else if (sourceType === 'database') {
      contentControl?.setValidators([Validators.required]);
    } else if (sourceType === 'git') {
      gitRepoUrlControl?.setValidators([Validators.required]);
      gitPathControl?.setValidators([Validators.required]);
    }
    
    pathControl?.updateValueAndValidity();
    contentControl?.updateValueAndValidity();
    gitRepoUrlControl?.updateValueAndValidity();
    gitPathControl?.updateValueAndValidity();
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
