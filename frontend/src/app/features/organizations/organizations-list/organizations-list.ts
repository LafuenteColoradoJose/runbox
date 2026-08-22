import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { InventoryService, Organization } from '../../../core/services/inventory.service';
import { OrganizationDialog } from '../organization-dialog/organization-dialog';

@Component({
  selector: 'app-organizations-list',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './organizations-list.html',
  styleUrl: './organizations-list.css'
})
export class OrganizationsList implements OnInit {
  private inventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  
  organizations: Organization[] = [];
  displayedColumns: string[] = ['id', 'name', 'actions'];

  ngOnInit(): void {
    this.loadOrganizations();
  }

  loadOrganizations() {
    this.inventoryService.getOrganizations().subscribe(data => {
      this.organizations = data;
      this.cdr.markForCheck();
    });
  }

  openDialog(org?: Organization) {
    const dialogRef = this.dialog.open(OrganizationDialog, {
      width: '400px',
      data: org
    });

    dialogRef.afterClosed().subscribe(result => {
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
