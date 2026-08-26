import { Component, inject, OnInit, ViewChild, signal, computed } from '@angular/core';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Sort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InventoryService, Organization } from '../../../core/services/inventory.service';
import { OrganizationDialog } from '../organization-dialog/organization-dialog';
import { AuthService } from '../../../core/services/auth';
import { SearchBarComponent } from '../../../components/search-bar/search-bar';

import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-organizations-list',
  imports: [MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatIconModule, MatDialogModule, SearchBarComponent, DatePipe],
  templateUrl: './organizations-list.html',
  styleUrl: './organizations-list.css',
})
export class OrganizationsList implements OnInit {
  private inventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);
  public authService = inject(AuthService);

  displayedColumns = signal<string[]>(['id', 'name', 'stats', 'created_at', 'actions']);
  
  organizations = signal<Organization[]>([]);
  searchQuery = signal<string>('');
  
  pageSize = signal(10);
  pageIndex = signal(0);
  
  sortState = signal<Sort>({ active: '', direction: '' });

  filteredOrganizations = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    let orgs = this.organizations();
    
    if (query) {
      orgs = orgs.filter(o => 
        o.name.toLowerCase().includes(query) || 
        o.id.toString().includes(query)
      );
    }

    const sort = this.sortState();
    if (sort.active && sort.direction) {
      orgs = [...orgs].sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'id': return compare(a.id, b.id, isAsc);
          case 'name': return compare(a.name, b.name, isAsc);
          default: return 0;
        }
      });
    }

    return orgs;
  });

  pagedOrganizations = computed(() => {
    const startIndex = this.pageIndex() * this.pageSize();
    return this.filteredOrganizations().slice(startIndex, startIndex + this.pageSize());
  });

  ngOnInit(): void {
    if (this.authService.currentUser()?.role !== 'admin') {
      this.displayedColumns.set(['id', 'name', 'stats', 'created_at']);
    }
    this.loadOrganizations();
  }

  onSortData(sort: Sort) {
    this.sortState.set(sort);
  }

  onPageChange(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }

  loadOrganizations() {
    this.inventoryService.getOrganizations().subscribe((data) => {
      this.organizations.set(data);
    });
  }

  openDialog(org?: Organization) {
    const dialogRef = this.dialog.open(OrganizationDialog, {
      width: '400px',
      data: org,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.loadOrganizations();
    });
  }

  deleteOrg(id: number) {
    if (confirm('Are you sure you want to delete this organization?')) {
      this.inventoryService.deleteOrganization(id).subscribe(() => {
        this.loadOrganizations();
      });
    }
  }
}

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

