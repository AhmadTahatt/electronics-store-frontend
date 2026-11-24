import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { API_URL } from '../config/api-url';
import { AuthSession, LoginApiResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

const STORAGE_KEY = 'galaxy_auth';

@Injectable({ providedIn: 'root' })
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private api = inject(API_URL);

  private session = signal<AuthSession | null>(this.load());

  /** true while a non-expired session exists */
  readonly isLoggedIn = computed(() => {
    const s = this.session();
    return !!s && !this.isExpired(s);
  });
  readonly isAdmin = computed(() => this.isLoggedIn() && this.session()?.role === 'Admin');
  readonly username = computed(() => this.session()?.username ?? '');

  /** JWT used by the HTTP interceptor */
  get token(): string | null {
    return this.isLoggedIn() ? this.session()!.token : null;
  }

  login(credentials: LoginRequest): Observable<AuthSession> {
    return this.http.post<LoginApiResponse>(`${this.api}/auth/login`, credentials).pipe(
      map(res => this.toSession(res)),
      tap(session => this.save(session))
    );
  }

  /** Backend response -> session. Role "ADMIN"/"CUSTOMER" becomes "Admin"/"Customer"; expiry comes from the JWT. */
  private toSession(res: LoginApiResponse): AuthSession {
    return {
      token: res.token,
      username: res.fullName,
      role: res.userRole === 'ADMIN' ? 'Admin' : 'Customer',
      expiresAt: this.readExpiry(res.token)
    };
  }

  private readExpiry(jwt: string): string | undefined {
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined;
    } catch {
      return undefined;
    }
  }

  register(data: RegisterRequest): Observable<unknown> {
    return this.http.post(`${this.api}/auth/register`, data);
  }

  logout(redirect = true): void {
    this.clear();
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  // ---- storage helpers (safe if storage is unavailable) ----
  private load(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }

  private save(s: AuthSession): void {
    this.session.set(s);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }

  private clear(): void {
    this.session.set(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  private isExpired(s: AuthSession): boolean {
    return !!s.expiresAt && new Date(s.expiresAt).getTime() <= Date.now();
  }
}
