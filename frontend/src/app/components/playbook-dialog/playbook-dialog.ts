import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
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
    MatRadioModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './playbook-dialog.html',
  styleUrls: ['./playbook-dialog.css']
})
export class PlaybookDialog implements OnInit {
  playbookForm: FormGroup;
  isEditMode = false;
  organizations: Organization[] = [];
  
  suggestedTags: string[] = ['Sistema', 'Red', 'Base de Datos', 'Web', 'Docker', 'Seguridad', 'Backup', 'Test'];

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
      tagsRaw: [data?.tags?.join(', ') || ''],
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

  addSuggestedTag(tag: string): void {
    const currentControl = this.playbookForm.get('tagsRaw');
    if (currentControl) {
      let currentVal = currentControl.value || '';
      currentVal = currentVal.trim();
      
      // Añadir la coma si hay contenido y no termina en coma
      if (currentVal.length > 0 && !currentVal.endsWith(',')) {
        currentVal += ', ';
      }
      currentVal += tag;
      
      currentControl.setValue(currentVal);
      currentControl.markAsDirty();
    }
  }

  onSubmit(): void {
    if (this.playbookForm.valid) {
      const formValue = { ...this.playbookForm.value };
      
      // Parsear tags
      let tagsArray: string[] = [];
      if (formValue.tagsRaw) {
        tagsArray = formValue.tagsRaw.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0);
      }
      formValue.tags = tagsArray;
      delete formValue.tagsRaw;

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
