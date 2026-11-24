import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { getErrorMessage } from '../../utils/http-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private authService = inject(Auth);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = signal('');
  loading = signal(false);

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.email.trim() || !this.password) {
      this.errorMessage.set('Please enter both email and password.');
      return;
    }

    this.loading.set(true);
    this.authService.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: session => {
        this.loading.set(false);
        // Admins go to the dashboard (once that route exists); customers go to the store.
        const dashboardExists = this.router.config.some(r => r.path === 'admin-dashboard');
        const target = session.role === 'Admin' && dashboardExists ? '/admin-dashboard' : '/';
        this.router.navigate([target]);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        const invalid = err instanceof HttpErrorResponse && (err.status === 401 || err.status === 400);
        this.errorMessage.set(
          invalid ? 'Invalid email or password.' : getErrorMessage(err, 'Login failed. Please try again.')
        );
      }
    });
  }
}
