export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

/** What the app keeps after login (already converted from the backend response). */
export interface AuthSession {
  token: string;
  username: string;      // the user's full name, shown in the navbar
  role: string;          // "Admin" | "Customer"
  expiresAt?: string;    // ISO date, read from the JWT
}

/** Raw backend response of POST /api/auth/login (LoginDtoResponse). */
export interface LoginApiResponse {
  userId: number;
  fullName: string;
  email: string;
  userRole: 'ADMIN' | 'CUSTOMER';
  token: string;
}
