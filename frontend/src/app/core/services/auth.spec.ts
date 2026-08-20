import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';
import { vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerMock: any;

  beforeEach(() => {
    routerMock = {
      navigate: vi.fn()
    };
    
    // Clear local storage
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerMock }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.isAuthenticated()).toBeFalsy();
  });

  it('should login, set token, and update authenticated state', () => {
    service.login('testuser', 'password').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'testuser', password: 'password' });

    req.flush({ token: 'fake-jwt-token', user: { username: 'testuser' } });

    expect(localStorage.getItem('runbox_token')).toBe('fake-jwt-token');
    expect(service.isAuthenticated()).toBeTruthy();
  });

  it('should logout, remove token, and navigate to login', () => {
    // Setup state
    localStorage.setItem('runbox_token', 'fake-jwt-token');
    service.isAuthenticated.set(true);

    service.logout();

    expect(localStorage.getItem('runbox_token')).toBeNull();
    expect(service.isAuthenticated()).toBeFalsy();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should return the token from localStorage', () => {
    localStorage.setItem('runbox_token', 'my-token');
    expect(service.getToken()).toBe('my-token');
  });
});
