import { InjectionToken } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * Base URL of the backend API. Services inject this token instead of importing
 * `environment` themselves, so the address is configured in one place (and easy to replace in tests).
 */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl
});
