import { Component, OnInit, inject, signal, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, UserOrganization } from '../../core/services/user';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { UserDialog } from '../../features/users/user-dialog/user-dialog';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatChipsModule
  ],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class Users implements OnInit {
  userService = inject(UserService);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

  users = this.userService.users;
  organizations = signal<any[]>([]);

  dataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = ['id', 'username', 'role', 'organizations', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    effect(() => {
      this.dataSource.data = this.users();
    });
  }

  ngOnInit() {
    this.userService.loadUsers().subscribe();
    this.loadOrganizations();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadOrganizations() {
    this.http.get<any[]>(`${environment.apiUrl}/organizations`).subscribe(orgs => {
      this.organizations.set(orgs);
    });
  }

  openCreateModal() {
    const dialogRef = this.dialog.open(UserDialog, {
      width: '500px',
      data: { user: null, organizations: this.organizations() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.createUser(result).subscribe();
      }
    });
  }

  openEditModal(user: User) {
    const dialogRef = this.dialog.open(UserDialog, {
      width: '500px',
      data: { user, organizations: this.organizations() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const payload: any = {
          username: result.username,
          role: result.role,
          organizations: result.organizations
        };
        if (result.password) {
          payload.password = result.password;
        }
        this.userService.updateUser(user.id, payload).subscribe();
      }
    });
  }

  deleteUser(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar a este usuario?')) {
      this.userService.deleteUser(id).subscribe();
    }
  }
}
