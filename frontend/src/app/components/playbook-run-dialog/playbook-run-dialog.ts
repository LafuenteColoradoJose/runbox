import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { InventoryService, Inventory } from '../../core/services/inventory.service';

@Component({
  selector: 'app-playbook-run-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './playbook-run-dialog.html',
  styleUrl: './playbook-run-dialog.css'
})
export class PlaybookRunDialog implements OnInit {
  private dialogRef = inject(MatDialogRef<PlaybookRunDialog>);
  private inventoryService = inject(InventoryService);

  inventories = signal<Inventory[]>([]);
  selectedInventoryId = signal<number | null>(null);

  ngOnInit() {
    this.inventoryService.getInventories().subscribe({
      next: (data) => this.inventories.set(data),
      error: (err) => console.error('Failed to load inventories', err)
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onRun(): void {
    this.dialogRef.close({ inventoryId: this.selectedInventoryId() });
  }
}
