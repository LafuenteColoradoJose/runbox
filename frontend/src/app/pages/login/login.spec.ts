import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthService } from '../../core/services/auth';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn()
    };
    
    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideAnimations(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form initially', () => {
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should show validation error when submitting empty form', () => {
    component.onSubmit();
    expect(authServiceMock.login).not.toHaveBeenCalled();
    // Assuming we don't have form touched checking, the simple invalid check suffices
  });

  it('should call login when form is valid', async () => {
    component.loginForm.controls['username'].setValue('admin');
    component.loginForm.controls['password'].setValue('password');
    
    authServiceMock.login.mockReturnValue(of({ token: 'fake' }));

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith('admin', 'password');
    
    // Simulate async resolution
    await fixture.whenStable();

    expect(component.loading()).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard'], { replaceUrl: true });
  });

  it('should handle login error', async () => {
    component.loginForm.controls['username'].setValue('admin');
    component.loginForm.controls['password'].setValue('wrong');
    
    const errorResponse = new HttpErrorResponse({ status: 401, error: { error: 'Invalid credentials' } });
    authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith('admin', 'wrong');
    
    await fixture.whenStable();

    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toBe('Invalid credentials');
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should handle fallback error message', async () => {
    component.loginForm.controls['username'].setValue('admin');
    component.loginForm.controls['password'].setValue('wrong');
    
    const errorResponse = new HttpErrorResponse({ status: 500 });
    authServiceMock.login.mockReturnValue(throwError(() => errorResponse));

    component.onSubmit();
    await fixture.whenStable();

    expect(component.errorMessage()).toBe('Error al iniciar sesión');
  });
});
