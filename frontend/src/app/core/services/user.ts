import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface UserOrganization {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  organizations?: UserOrganization[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  // Signal state for users
  users = signal<User[]>([]);

  // Load all users from backend
  loadUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl).pipe(
      tap(users => this.users.set(users))
    );
  }

  // Create a new user
  createUser(userData: Partial<User> & { password?: string, organizations?: number[] }): Observable<User> {
    return this.http.post<User>(this.apiUrl, userData).pipe(
      tap(() => this.loadUsers().subscribe()) // Reload list after creation
    );
  }

  // Update an existing user
  updateUser(id: number, userData: Partial<User> & { password?: string, organizations?: number[] }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, userData).pipe(
      tap(() => this.loadUsers().subscribe())
    );
  }

  // Delete a user
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadUsers().subscribe())
    );
  }
}
