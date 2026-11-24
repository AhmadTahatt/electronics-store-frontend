import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, retry, throwError, timer } from 'rxjs';
import { API_URL } from '../config/api-url';
import { Auth } from '../services/auth';
import { ToastService } from '../services/toast';

/**
 * - Adds "Authorization: Bearer <jwt>" ONLY to calls to our own API (never to other sites).
 * - Retries a failed GET once when the network drops or the server is briefly unavailable.
 * - 401 = token missing/expired -> log out.  403 = logged in but not allowed -> tell the user.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const toast = inject(ToastService);
  const router = inject(Router);
  const api = inject(API_URL);

  const isApiCall = req.url === api || req.url.startsWith(`${api}/`);
  const isLoginCall = req.url === `${api}/auth/login`;

  const token = auth.token;
  const request = token && isApiCall
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    retry({
      count: 1,
      delay: (err: unknown) =>
        req.method === 'GET' && err instanceof HttpErrorResponse && (err.status === 0 || err.status === 503)
          ? timer(400)
          : throwError(() => err)
    }),
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && isApiCall && token) {
        if (err.status === 401 && !isLoginCall) {
          auth.logout();
        }
        if (err.status === 403) {
          toast.show('You do not have permission to do that.', 'error');
          if (router.url.startsWith('/admin')) router.navigateByUrl('/');
        }
      }
      return throwError(() => err);
    })
  );
};
