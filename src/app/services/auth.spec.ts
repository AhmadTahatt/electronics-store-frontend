import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Auth } from './auth';

/** Builds a fake JWT whose payload has the given expiry (seconds since 1970). */
function fakeJwt(exp: number): string {
  const encode = (o: object) => btoa(JSON.stringify(o));
  return `${encode({ alg: 'HS256' })}.${encode({ exp })}.sig`;
}

describe('Auth', () => {
  let service: Auth;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(Auth);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('starts logged out', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.token).toBeNull();
  });

  it('posts email + password and converts the response into a session', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    let role = '';
    service.login({ email: 'a@b.com', password: 'secret123' }).subscribe(s => (role = s.role));

    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'a@b.com', password: 'secret123' });
    req.flush({ userId: 1, fullName: 'Store Admin', email: 'a@b.com', userRole: 'ADMIN', token: fakeJwt(exp) });

    expect(role).toBe('Admin');
    expect(service.isAdmin()).toBe(true);
    expect(service.username()).toBe('Store Admin');
  });

  it('treats a CUSTOMER as logged in but not admin', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    service.login({ email: 'c@b.com', password: 'secret123' }).subscribe();
    http.expectOne('/api/auth/login').flush({
      userId: 2, fullName: 'Sara', email: 'c@b.com', userRole: 'CUSTOMER', token: fakeJwt(exp)
    });

    expect(service.isLoggedIn()).toBe(true);
    expect(service.isAdmin()).toBe(false);
  });

  it('is logged out when the token has already expired', () => {
    const exp = Math.floor(Date.now() / 1000) - 60;
    service.login({ email: 'c@b.com', password: 'secret123' }).subscribe();
    http.expectOne('/api/auth/login').flush({
      userId: 2, fullName: 'Sara', email: 'c@b.com', userRole: 'CUSTOMER', token: fakeJwt(exp)
    });

    expect(service.isLoggedIn()).toBe(false);
  });

  it('logout clears the session', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    service.login({ email: 'c@b.com', password: 'secret123' }).subscribe();
    http.expectOne('/api/auth/login').flush({
      userId: 2, fullName: 'Sara', email: 'c@b.com', userRole: 'CUSTOMER', token: fakeJwt(exp)
    });
    service.logout(false);
    expect(service.isLoggedIn()).toBe(false);
    expect(sessionStorage.getItem('galaxy_auth')).toBeNull();
  });

  it('register posts the form to /auth/register', () => {
    const body = { fullName: 'Ahmad Tahat', email: 'a@b.com', phoneNumber: '0791234567', password: 'secret123' };
    service.register(body).subscribe();
    const req = http.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(null);
  });
});
