import { Component, inject, OnInit, signal, computed } from '@angular/core';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Sort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { InventoryService, Inventory } from '../../core/services/inventory.service';
import { InventoryDialog } from './inventory-dialog/inventory-dialog';
import { SearchBarComponent } from '../../components/search-bar/search-bar';

import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    RouterModule,
    SearchBarComponent,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.css',
})
export class InventoryComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);
  public authService = inject(AuthService);

  displayedColumns = signal<string[]>(['name', 'organization', 'actions']);

  inventories = signal<Inventory[]>([]);
  searchQuery = signal<string>('');
  
  pageSize = signal(10);
  pageIndex = signal(0);
  
  sortState = signal<Sort>({ active: '', direction: '' });

  filteredInventories = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    let invs = this.inventories();
    
    if (query) {
      invs = invs.filter(i => 
        i.name.toLowerCase().includes(query) || 
        (i.organization_name && i.organization_name.toLowerCase().includes(query))
      );
    }

    const sort = this.sortState();
    if (sort.active && sort.direction) {
      invs = [...invs].sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'name': return compare(a.name, b.name, isAsc);
          case 'organization': return compare(a.organization_name || '', b.organization_name || '', isAsc);
          default: return 0;
        }
      });
    }

    return invs;
  });

  pagedInventories = computed(() => {
    const startIndex = this.pageIndex() * this.pageSize();
    return this.filteredInventories().slice(startIndex, startIndex + this.pageSize());
  });

  ngOnInit(): void {
    if (this.authService.currentUser()?.role !== 'admin') {
      this.displayedColumns.set(['name', 'organization']);
    }
    this.loadInventories();
  }

  onSortData(sort: Sort) {
    this.sortState.set(sort);
  }

  onPageChange(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  loadInventories() {
    this.inventoryService.getInventories().subscribe((data) => {
      this.inventories.set(data);
    });
  }

  openDialog(inv?: Inventory) {
    const dialogRef = this.dialog.open(InventoryDialog, {
      width: '400px',
      data: inv,
    });

    dialogRef.afterClosed().subscribe((result) => {
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

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

