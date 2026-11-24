import { HttpErrorResponse } from '@angular/common/http';

/** Turns any HTTP failure into a message that is safe to show to the user. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Cannot reach the server. Please try again later.';
    }
    const body = err.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body && typeof body === 'object') {
      if (typeof body.detail === 'string' && body.detail) return body.detail;   // ASP.NET ProblemDetails
      if (typeof body.message === 'string') return body.message;
      if (typeof body.title === 'string') return body.title;
      // ASP.NET validation: { errors: { Field: ["msg", ...] } }
      if (body.errors && typeof body.errors === 'object') {
        const first = Object.values(body.errors as Record<string, string[]>)[0];
        if (Array.isArray(first) && first.length) return first[0];
      }
    }
  }
  return fallback;
}
