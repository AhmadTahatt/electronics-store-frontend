import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Auth } from '../services/auth';
import { ToastService } from '../services/toast';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;

  function setup(loggedIn: boolean) {
    sessionStorage.clear();
    if (loggedIn) {
      sessionStorage.setItem('galaxy_auth', JSON.stringify({ token: 'abc', username: 'Ahmad', role: 'Admin' }));
    }
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: '**', children: [] }]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()]
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  it('adds the Bearer token to API calls', () => {
    setup(true);
    client.get('/api/products').subscribe();
    expect(http.expectOne('/api/products').request.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('does not add a token to other URLs or when logged out', () => {
    setup(false);
    client.get('/api/products').subscribe();
    expect(http.expectOne('/api/products').request.headers.has('Authorization')).toBe(false);
  });

  it('logs out when the API answers 401', () => {
    setup(true);
    const auth = TestBed.inject(Auth);
    client.get('/api/orders').subscribe({ error: () => {} });
    http.expectOne('/api/orders').flush('x', { status: 401, statusText: 'Unauthorized' });
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('shows a message (and stays logged in) on 403', () => {
    setup(true);
    const auth = TestBed.inject(Auth);
    const toast = TestBed.inject(ToastService);
    client.get('/api/orders').subscribe({ error: () => {} });
    http.expectOne('/api/orders').flush('x', { status: 403, statusText: 'Forbidden' });

    expect(auth.isLoggedIn()).toBe(true);
    expect(toast.toasts()[0].message).toContain('permission');
  });

  it('does not send the token to other websites', () => {
    setup(true);
    client.get('https://example.com/data').subscribe();
    expect(http.expectOne('https://example.com/data').request.headers.has('Authorization')).toBe(false);
  });

  it('retries a failed GET once, then succeeds', () => {
    vi.useFakeTimers();
    setup(false);
    let result: unknown;
    client.get('/api/products').subscribe(r => (result = r));

    http.expectOne('/api/products').error(new ProgressEvent('error'), { status: 0 });
    vi.advanceTimersByTime(500);
    http.expectOne('/api/products').flush([{ id: 1 }]);

    expect(result).toEqual([{ id: 1 }]);
    vi.useRealTimers();
  });

  it('never retries a POST', () => {
    setup(false);
    client.post('/api/orders', {}).subscribe({ error: () => {} });
    http.expectOne('/api/orders').error(new ProgressEvent('error'), { status: 0 });
    http.expectNone('/api/orders');
  });
});
