import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, UserOrganization } from '../../core/services/user';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { UserDialog } from '../../features/users/user-dialog/user-dialog';
import { SearchBarComponent } from '../../components/search-bar/search-bar';

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
    MatChipsModule,
    SearchBarComponent
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

  displayedColumns = signal<string[]>(['id', 'username', 'role', 'organizations', 'actions']);
  
  searchQuery = signal<string>('');
  pageSize = signal(10);
  pageIndex = signal(0);
  sortState = signal<Sort>({ active: '', direction: '' });

  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    let userList = this.users();
    
    if (query) {
      userList = userList.filter(u => 
        u.username.toLowerCase().includes(query) || 
        u.role.toLowerCase().includes(query)
      );
    }

    const sort = this.sortState();
    if (sort.active && sort.direction) {
      userList = [...userList].sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'id': return compare(a.id, b.id, isAsc);
          case 'username': return compare(a.username, b.username, isAsc);
          case 'role': return compare(a.role, b.role, isAsc);
          default: return 0;
        }
      });
    }

    return userList;
  });

  pagedUsers = computed(() => {
    const startIndex = this.pageIndex() * this.pageSize();
    return this.filteredUsers().slice(startIndex, startIndex + this.pageSize());
  });

  ngOnInit() {
    this.userService.loadUsers().subscribe();
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

function compare(a: number | string, b: number | string, isAsc: boolean) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

