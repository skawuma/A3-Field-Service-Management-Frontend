import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { MATERIAL_IMPORTS } from '../../material-imports';




@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="login-container">
      <mat-card class="login-card">

        <h1 class="title">A3 FSM Login</h1>

        <form (ngSubmit)="onSubmit()" class="form">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput [(ngModel)]="email" name="email" type="email" required>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput [(ngModel)]="password" name="password" type="password" required>
          </mat-form-field>

          <button mat-raised-button color="primary" class="full-width">
            Sign In
          </button>

        </form>

      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #f5f5f5;
    }

    .login-card {
      padding: 24px;
      width: 380px;
    }

    .title {
      text-align: center;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

onSubmit() {
  const loginPayload = {
    email: this.email,   // backend likely expects "username"
    password: this.password
  };

  this.auth.login(loginPayload).subscribe({
    next: () => this.router.navigate(['/dashboard']),
    error: (err) => console.error('Login failed', err)
  });
}

}
