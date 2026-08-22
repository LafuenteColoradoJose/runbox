import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { InventoryService, Inventory } from '../../core/services/inventory.service';
import { InventoryDialog } from './inventory-dialog/inventory-dialog';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatDialogModule, RouterModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css'
})
export class InventoryComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  
  inventories: Inventory[] = [];
  displayedColumns: string[] = ['name', 'organization', 'actions'];

  ngOnInit(): void {
    this.loadInventories();
  }

  loadInventories() {
    this.inventoryService.getInventories().subscribe(data => {
      this.inventories = data;
      this.cdr.markForCheck();
    });
  }

  openDialog(inv?: Inventory) {
    const dialogRef = this.dialog.open(InventoryDialog, {
      width: '400px',
      data: inv
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadInventories();
    });
  }

  deleteInv(id: number) {
    if (confirm('Are you sure you want to delete this inventory?')) {
      this.inventoryService.deleteInventory(id).subscribe(() => {
        this.loadInventories();
      });
    }
  }
}
