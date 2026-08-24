import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Users } from './users';
import { UserService } from '../../core/services/user';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { environment } from '../../../environments/environment';

describe('Users', () => {
  let component: Users;
  let fixture: ComponentFixture<Users>;
  let httpTestingController: HttpTestingController;
  let mockUserService: any;

  beforeEach(async () => {
    mockUserService = {
      users: signal([{ id: 1, username: 'user1', role: 'user', organizations: [] }]),
      loadUsers: vi.fn().mockReturnValue(of(true)),
      createUser: vi.fn().mockReturnValue(of(true)),
      updateUser: vi.fn().mockReturnValue(of(true)),
      deleteUser: vi.fn().mockReturnValue(of(true))
    };

    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: mockUserService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Users);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create and load users and organizations on init', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 10, name: 'Org 1' }]);
    expect(component).toBeTruthy();
    expect(mockUserService.loadUsers).toHaveBeenCalled();
    expect(component.organizations().length).toBe(1);
    expect(component.organizations()[0].name).toBe('Org 1');
  });

  it('should open create modal', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    req.flush([]);
    
    component.openCreateModal();
    expect(component.isEditing()).toBe(false);
    expect(component.showModal()).toBe(true);
    expect(component.formData().id).toBe(0);
    expect(component.formData().username).toBe('');
  });

  it('should open edit modal', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    req.flush([]);
    
    const userToEdit: any = { id: 5, username: 'edituser', role: 'admin', organizations: [{id: 10, name: 'Org 1'}] };
    component.openEditModal(userToEdit);
    expect(component.isEditing()).toBe(true);
    expect(component.showModal()).toBe(true);
    expect(component.formData().id).toBe(5);
    expect(component.formData().username).toBe('edituser');
    expect(component.formData().organizations).toEqual([10]);
  });

  it('should close modal', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    req.flush([]);

    component.showModal.set(true);
    component.closeModal();
    expect(component.showModal()).toBe(false);
  });

  it('should toggle organizations in formData', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    req.flush([]);

    component.formData.set({ ...component.formData(), organizations: [1] });
    
    // Add org 2
    component.toggleOrganization(2);
    expect(component.formData().organizations).toEqual([1, 2]);

    // Remove org 1
    component.toggleOrganization(1);
    expect(component.formData().organizations).toEqual([2]);
  });

  it('should create new user', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    req.flush([]);

    component.openCreateModal();
    component.formData.set({
      id: 0,
      username: 'newuser',
      password: 'password123',
      role: 'user',
      organizations: [1]
    });
    
    component.saveUser();
    expect(mockUserService.createUser).toHaveBeenCalledWith({
      username: 'newuser',
      password: 'password123',
      role: 'user',
      organizations: [1]
    });
    expect(component.showModal()).toBe(false);
  });

  it('should update existing user without password', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    req.flush([]);

    component.openEditModal({ id: 2, username: 'old', role: 'user', organizations: [] } as any);
    component.formData.set({
      id: 2,
      username: 'updated',
      password: '',
      role: 'admin',
      organizations: []
    });
    
    component.saveUser();
    expect(mockUserService.updateUser).toHaveBeenCalledWith(2, {
      username: 'updated',
      role: 'admin',
      organizations: []
    });
    expect(component.showModal()).toBe(false);
  });

  it('should update existing user with password', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    req.flush([]);

    component.openEditModal({ id: 2, username: 'old', role: 'user', organizations: [] } as any);
    component.formData.set({
      id: 2,
      username: 'updated',
      password: 'newpassword',
      role: 'admin',
      organizations: []
    });
    
    component.saveUser();
    expect(mockUserService.updateUser).toHaveBeenCalledWith(2, {
      username: 'updated',
      password: 'newpassword',
      role: 'admin',
      organizations: []
    });
    expect(component.showModal()).toBe(false);
  });

  it('should delete user on confirmation', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    req.flush([]);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.deleteUser(3);
    expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de que quieres eliminar a este usuario?');
    expect(mockUserService.deleteUser).toHaveBeenCalledWith(3);
  });

  it('should not delete user on cancel', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    req.flush([]);

    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.deleteUser(3);
    expect(mockUserService.deleteUser).not.toHaveBeenCalled();
  });
});
