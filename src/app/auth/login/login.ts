import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { MATERIAL_IMPORTS } from '../../material-imports';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

interface DemoAccount {
  role: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <section class="sign-in-panel">
          <p class="eyebrow">A3 Field Service Management</p>
          <h1 class="title">Welcome back</h1>
          <p class="subtitle">Sign in to manage field service operations.</p>

          <form (ngSubmit)="onSubmit()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput [(ngModel)]="email" name="email" type="email" required>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [(ngModel)]="password" name="password" type="password" required>
            </mat-form-field>

            <button mat-raised-button color="primary" class="full-width" type="submit">
              Sign In
            </button>
          </form>
        </section>

        <section class="demo-panel" aria-labelledby="demo-panel-title">
          <div class="demo-heading">
            <p class="eyebrow">Visitor access</p>
            <h2 id="demo-panel-title">Try the Demo</h2>
            <p>Choose a role to fill the sign-in form with a ready-to-use demo account.</p>
          </div>

          <div class="demo-accounts">
            <article class="demo-account" *ngFor="let account of demoAccounts">
              <div class="account-details">
                <span class="role-badge">{{ account.role }}</span>
                <span class="credential-label">Email</span>
                <code>{{ account.email }}</code>
                <span class="credential-label">Password</span>
                <code>{{ account.password }}</code>
              </div>

              <button
                mat-stroked-button
                type="button"
                class="demo-button"
                (click)="useDemo(account)"
                [attr.aria-label]="'Use ' + account.role + ' demo account'">
                Use {{ account.role }}
              </button>
            </article>
          </div>
        </section>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      padding: 32px;
      background:
        radial-gradient(circle at top left, rgba(25, 118, 210, 0.16), transparent 38%),
        #f4f7fb;
    }

    .login-card {
      display: grid;
      grid-template-columns: minmax(280px, 0.9fr) minmax(420px, 1.4fr);
      width: min(960px, 100%);
      padding: 0;
      overflow: hidden;
      border-radius: 18px;
      box-shadow: 0 20px 55px rgba(15, 40, 72, 0.15);
    }

    .sign-in-panel,
    .demo-panel {
      padding: 40px;
    }

    .sign-in-panel {
      align-self: center;
    }

    .demo-panel {
      color: #ffffff;
      background: linear-gradient(145deg, #12385f, #1769aa);
    }

    .eyebrow {
      margin: 0 0 8px;
      color: #1976d2;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.09em;
      text-transform: uppercase;
    }

    .title {
      margin: 0;
      color: #17324d;
      font-size: 2rem;
      line-height: 1.15;
    }

    .subtitle {
      margin: 10px 0 28px;
      color: #5f6f7e;
    }

    .demo-heading .eyebrow {
      color: #a9d5ff;
    }

    .demo-heading h2 {
      margin: 0;
      font-size: 1.75rem;
    }

    .demo-heading > p:last-child {
      margin: 8px 0 24px;
      color: #d6e8f8;
      line-height: 1.5;
    }

    .full-width {
      width: 100%;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .demo-accounts {
      display: grid;
      gap: 12px;
    }

    .demo-account {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 16px;
      padding: 16px;
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.09);
    }

    .account-details {
      display: grid;
      grid-template-columns: 62px minmax(0, 1fr);
      align-items: center;
      gap: 5px 10px;
      min-width: 0;
    }

    .role-badge {
      grid-column: 1 / -1;
      width: fit-content;
      margin-bottom: 4px;
      padding: 3px 8px;
      border-radius: 999px;
      color: #12385f;
      background: #d9edff;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .credential-label {
      color: #bcd9f1;
      font-size: 0.72rem;
      text-transform: uppercase;
    }

    code {
      overflow-wrap: anywhere;
      color: #ffffff;
      font-size: 0.78rem;
    }

    .demo-button.mat-mdc-outlined-button:not(:disabled) {
      min-width: 126px;
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.65);
      --mdc-outlined-button-label-text-color: #ffffff;
      --mdc-outlined-button-outline-color: rgba(255, 255, 255, 0.65);
      --mat-outlined-button-state-layer-color: #ffffff;
    }

    @media (max-width: 820px) {
      .login-container {
        align-items: flex-start;
        padding: 20px;
      }

      .login-card {
        grid-template-columns: 1fr;
      }

      .sign-in-panel,
      .demo-panel {
        padding: 30px;
      }
    }

    @media (max-width: 520px) {
      .login-container {
        padding: 0;
      }

      .login-card {
        border-radius: 0;
      }

      .sign-in-panel,
      .demo-panel {
        padding: 24px 20px;
      }

      .demo-account {
        grid-template-columns: 1fr;
      }

      .demo-button {
        width: 100%;
      }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  readonly demoAccounts: DemoAccount[] = [
    {
      role: 'Admin',
      email: 'admin.demo@a3fsm.com',
      password: 'DemoAdmin2026!',
    },
    {
      role: 'Dispatcher',
      email: 'dispatcher.demo@a3fsm.com',
      password: 'DemoDispatch2026!',
    },
    {
      role: 'Technician',
      email: 'tech.demo@a3fsm.com',
      password: 'DemoTech2026!',
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      if (params.get('timedOut') === 'true') {
        this.snackBar.open('Your session timed out due to inactivity. Please sign in again.', 'Close', {
          duration: 4000,
        });
      }
    });
  }

  useDemo(account: DemoAccount): void {
    this.email = account.email;
    this.password = account.password;
  }

  onSubmit() {
    const loginPayload = {
      email: this.email,
      password: this.password
    };

    this.auth.login(loginPayload).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        const message = err.error?.message || 'Login failed. Please check your email and password.';
        this.snackBar.open(message, 'Close', {
          duration: 4000,
        });
      }
    });
  }

}
