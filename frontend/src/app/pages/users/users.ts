import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, UserOrganization } from '../../core/services/user';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class Users implements OnInit {
  userService = inject(UserService);
  private http = inject(HttpClient);

  users = this.userService.users;
  organizations = signal<any[]>([]);

  showModal = signal(false);
  isEditing = signal(false);
  
  formData = signal({
    id: 0,
    username: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    organizations: [] as number[]
  });

  ngOnInit() {
    this.userService.loadUsers().subscribe();
    this.loadOrganizations();
  }

  loadOrganizations() {
    this.http.get<any[]>(`${environment.apiUrl}/organizations`).subscribe(orgs => {
      this.organizations.set(orgs);
    });
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.formData.set({
      id: 0,
      username: '',
      password: '',
      role: 'user',
      organizations: []
    });
    this.showModal.set(true);
  }

  openEditModal(user: User) {
    this.isEditing.set(true);
    this.formData.set({
      id: user.id,
      username: user.username,
      password: '', // Leave blank, only update if changed
      role: user.role,
      organizations: user.organizations?.map(o => o.id) || []
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  toggleOrganization(orgId: number) {
    const current = this.formData().organizations;
    if (current.includes(orgId)) {
      this.formData.update(data => ({ ...data, organizations: current.filter(id => id !== orgId) }));
    } else {
      this.formData.update(data => ({ ...data, organizations: [...current, orgId] }));
    }
  }

  saveUser() {
    const data = this.formData();
    const payload: any = {
      username: data.username,
      role: data.role,
      organizations: data.organizations
    };

    if (data.password) {
      payload.password = data.password;
    }

    if (this.isEditing()) {
      this.userService.updateUser(data.id, payload).subscribe(() => {
        this.closeModal();
      });
    } else {
      this.userService.createUser(payload).subscribe(() => {
        this.closeModal();
      });
    }
  }

  deleteUser(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar a este usuario?')) {
      this.userService.deleteUser(id).subscribe();
    }
  }
}
