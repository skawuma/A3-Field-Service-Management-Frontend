import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div class="w-full max-w-md bg-slate-800 rounded-2xl p-8 shadow-lg">
        <h1 class="text-2xl font-semibold mb-6 text-center">A3 FSM Login</h1>

        <form (ngSubmit)="onSubmit()">
          <label class="block mb-3 text-sm">
            Email
            <input [(ngModel)]="email" name="email" type="email"
                   class="mt-1 w-full px-3 py-2 rounded-md text-black" required />
          </label>

          <label class="block mb-6 text-sm">
            Password
            <input [(ngModel)]="password" name="password" type="password"
                   class="mt-1 w-full px-3 py-2 rounded-md text-black" required />
          </label>

          <button type="submit"
                  class="w-full py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 font-medium">
            Sign In
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => console.error('Login failed', err)
    });
  }
}
