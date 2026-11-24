import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { adminGuard } from './admin-guard';

describe('adminGuard', () => {
  const run = () =>
    TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );

  const setup = (session?: object) => {
    sessionStorage.clear();
    if (session) sessionStorage.setItem('galaxy_auth', JSON.stringify(session));
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  };

  it('redirects anonymous users to /login', () => {
    setup();
    const result = run();
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/login');
  });

  it('allows a logged-in admin', () => {
    setup({ token: 't', username: 'Admin', role: 'Admin' });
    expect(run()).toBe(true);
  });

  it('does not allow a logged-in customer', () => {
    setup({ token: 't', username: 'Sara', role: 'Customer' });
    expect(run() instanceof UrlTree).toBe(true);
  });
});
