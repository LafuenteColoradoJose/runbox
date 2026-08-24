import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './user-dialog.html',
  styleUrls: ['./user-dialog.css']
})
export class UserDialog {
  private dialogRef = inject(MatDialogRef<UserDialog>);
  private data = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  isEditing = !!this.data.user;
  organizations = this.data.organizations || [];

  userForm: FormGroup = this.fb.group({
    username: [this.data.user?.username || '', Validators.required],
    password: ['', this.isEditing ? [] : [Validators.required]],
    role: [this.data.user?.role || 'user', Validators.required],
    organizations: [this.data.user?.organizations?.map((o: any) => o.id) || []]
  });

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    }
  }

  get isAdmin(): boolean {
    return this.userForm.get('role')?.value === 'admin';
  }
}
