import { Component, inject, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InventoryService, Organization } from '../../../core/services/inventory.service';
import { OrganizationDialog } from '../organization-dialog/organization-dialog';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-organizations-list',
  imports: [MatTableModule, MatPaginatorModule, MatSortModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './organizations-list.html',
  styleUrl: './organizations-list.css',
})
export class OrganizationsList implements OnInit, AfterViewInit {
  private inventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  public authService = inject(AuthService);

  dataSource = new MatTableDataSource<Organization>([]);
  displayedColumns: string[] = ['id', 'name', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    if (this.authService.currentUser()?.role !== 'admin') {
      this.displayedColumns = ['id', 'name'];
    }
    this.loadOrganizations();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadOrganizations() {
    this.inventoryService.getOrganizations().subscribe((data) => {
      this.dataSource.data = data;
      this.cdr.markForCheck();
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
