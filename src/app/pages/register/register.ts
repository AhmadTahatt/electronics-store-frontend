import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { getErrorMessage } from '../../utils/http-error';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  private authService = inject(Auth);
  private router = inject(Router);

  fullName = '';
  email = '';
  phoneNumber = '';
  password = '';
  confirmPassword = '';

  errorMessage = signal('');
  successMessage = signal('');
  loading = signal(false);

  onSubmit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    const fullName = this.fullName.trim();
    const email = this.email.trim();
    const phoneNumber = this.phoneNumber.trim();

    if (!fullName || !email || !phoneNumber || !this.password) {
      this.errorMessage.set('All fields are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }
    if (!/^[+\d][\d\s\-()]{5,19}$/.test(phoneNumber)) {
      this.errorMessage.set('Please enter a valid phone number.');
      return;
    }
    if (fullName.length < 3) {
      this.errorMessage.set('Full name must be at least 3 characters.');
      return;
    }
    if (this.password.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters long.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.authService.register({ fullName, email, phoneNumber, password: this.password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Account created successfully! Redirecting to login...');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.errorMessage.set(getErrorMessage(err, 'Registration failed. Please try again.'));
      }
    });
  }
}
