import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { guestGuard } from './guest-guard';
import { AuthService } from '../services/auth';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { runInInjectionContext, EnvironmentInjector } from '@angular/core';

describe('guestGuard', () => {
  let authServiceSpy: { isAuthenticated: ReturnType<typeof vi.fn> };
  let routerSpy: { parseUrl: ReturnType<typeof vi.fn> };
  let injector: EnvironmentInjector;

  beforeEach(() => {
    authServiceSpy = { isAuthenticated: vi.fn() };
    routerSpy = { parseUrl: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    injector = TestBed.inject(EnvironmentInjector);
  });

  const executeGuard = () => {
    return runInInjectionContext(injector, () => {
      return guestGuard({} as any, {} as any);
    });
  };

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should return true if user is NOT authenticated', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(false);
    const result = executeGuard();
    expect(result).toBe(true);
  });

  it('should redirect to /dashboard if user is authenticated', () => {
    authServiceSpy.isAuthenticated.mockReturnValue(true);
    const mockUrlTree = {} as UrlTree;
    routerSpy.parseUrl.mockReturnValue(mockUrlTree);

    const result = executeGuard();
    
    expect(result).toBe(mockUrlTree);
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/dashboard');
  });
});
