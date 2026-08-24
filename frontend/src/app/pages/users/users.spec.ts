import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Users } from './users';
import { UserService } from '../../core/services/user';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

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
      imports: [Users, NoopAnimationsModule],
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
    
    const dialogSpy = vi.spyOn(component['dialog'], 'open').mockReturnValue({
      afterClosed: () => of(null)
    } as any);

    component.openCreateModal();
    expect(dialogSpy).toHaveBeenCalled();
  });

  it('should open edit modal', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    req.flush([]);
    
    const dialogSpy = vi.spyOn(component['dialog'], 'open').mockReturnValue({
      afterClosed: () => of(null)
    } as any);

    const userToEdit: any = { id: 5, username: 'edituser', role: 'admin', organizations: [{id: 10, name: 'Org 1'}] };
    component.openEditModal(userToEdit);
    expect(dialogSpy).toHaveBeenCalled();
  });

  it('should create new user from dialog result', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    req.flush([]);

    vi.spyOn(component['dialog'], 'open').mockReturnValue({
      afterClosed: () => of({
        username: 'newuser',
        password: 'password123',
        role: 'user',
        organizations: [1]
      })
    } as any);

    component.openCreateModal();
    expect(mockUserService.createUser).toHaveBeenCalledWith({
      username: 'newuser',
      password: 'password123',
      role: 'user',
      organizations: [1]
    });
  });

  it('should update existing user from dialog result', () => {
    const req = httpTestingController.expectOne(`${environment.apiUrl}/organizations`);
    req.flush([]);

    vi.spyOn(component['dialog'], 'open').mockReturnValue({
      afterClosed: () => of({
        username: 'updated',
        password: 'newpassword',
        role: 'admin',
        organizations: []
      })
    } as any);

    component.openEditModal({ id: 2, username: 'old', role: 'user', organizations: [] } as any);
    expect(mockUserService.updateUser).toHaveBeenCalledWith(2, {
      username: 'updated',
      password: 'newpassword',
      role: 'admin',
      organizations: []
    });
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
