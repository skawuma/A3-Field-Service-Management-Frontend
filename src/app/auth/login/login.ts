import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth-service';
import { MATERIAL_IMPORTS } from '../../material-imports';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { DEMO_ACCOUNTS, DemoAccount } from '../../core/demo/demo-config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="login-container">
      <div class="login-shell">
        <mat-card class="login-card">
          <div class="login-header">
            <p class="eyebrow">A3 Field Service Management</p>
            <h1>Welcome to the live demo</h1>
            <p>Sign in with a demo account to explore role-based field service workflows.</p>
          </div>

          <form (ngSubmit)="onSubmit()" class="form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input
                matInput
                [(ngModel)]="email"
                name="email"
                type="email"
                autocomplete="username"
                autocapitalize="none"
                spellcheck="false"
                required>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                [(ngModel)]="password"
                name="password"
                type="password"
                autocomplete="current-password"
                autocapitalize="none"
                required>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              type="submit"
              class="full-width sign-in-button"
              [disabled]="submitting">
              {{ submitting ? 'Signing in…' : 'Sign In' }}
            </button>
          </form>
        </mat-card>

        <mat-card *ngIf="demoMode" class="credentials-card">
          <div class="credentials-heading">
            <div>
              <p class="eyebrow">Try the app</p>
              <h2>Demo credentials</h2>
            </div>
            <span>Fake data only</span>
          </div>

          <p class="credentials-intro" id="demo-credentials-help">
            Visitors can use any public account below. Choose a role to sign in immediately.
            Demo changes may be reset periodically.
          </p>

          <div class="credentials-table-wrap">
            <table aria-describedby="demo-credentials-help">
              <thead>
                <tr>
                  <th scope="col">Role</th>
                  <th scope="col">Email</th>
                  <th scope="col">Password</th>
                  <th scope="col"><span class="visually-hidden">Action</span></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let account of demoAccounts">
                  <td data-label="Role">
                    <strong>{{ account.role }}</strong>
                    <small>{{ account.description }}</small>
                  </td>
                  <td data-label="Email"><code>{{ account.email }}</code></td>
                  <td data-label="Password"><code>{{ account.password }}</code></td>
                  <td class="action-cell">
                    <button
                      mat-stroked-button
                      color="primary"
                      type="button"
                      [disabled]="submitting"
                      (click)="loginWithDemoAccount(account)">
                      Sign in as {{ account.role }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-height: 0;
    }

    .login-container {
      align-items: center;
      background:
        radial-gradient(circle at top left, rgba(37, 99, 235, 0.16), transparent 38%),
        linear-gradient(145deg, #eef4ff 0%, #f8fafc 52%, #eef7f5 100%);
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      min-height: 100%;
      padding: 36px 20px;
    }

    .login-shell {
      align-items: stretch;
      display: grid;
      gap: 24px;
      grid-template-columns: minmax(320px, 420px) minmax(460px, 680px);
      max-width: 1140px;
      width: 100%;
    }

    .login-card,
    .credentials-card {
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 18px;
      box-shadow: 0 24px 70px rgba(30, 64, 175, 0.12);
      padding: 30px;
    }

    .login-header h1,
    .credentials-heading h2 {
      color: #0f172a;
      margin: 0;
    }

    .login-header h1 {
      font-size: clamp(1.75rem, 4vw, 2.35rem);
      line-height: 1.08;
    }

    .login-header > p:last-child,
    .credentials-intro {
      color: #64748b;
      line-height: 1.6;
    }

    .eyebrow {
      color: #1d4ed8;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      margin: 0 0 10px;
      text-transform: uppercase;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-top: 28px;
    }

    .full-width {
      width: 100%;
    }

    .sign-in-button {
      min-height: 48px;
    }

    .credentials-heading {
      align-items: flex-start;
      display: flex;
      gap: 18px;
      justify-content: space-between;
    }

    .credentials-heading > span {
      background: #dcfce7;
      border-radius: 999px;
      color: #166534;
      font-size: 0.72rem;
      font-weight: 800;
      padding: 6px 10px;
      white-space: nowrap;
    }

    .credentials-table-wrap {
      border: 1px solid #dbe4f0;
      border-radius: 12px;
      margin-top: 20px;
      overflow-x: auto;
    }

    table {
      border-collapse: collapse;
      min-width: 600px;
      text-align: left;
      width: 100%;
    }

    th {
      background: #eff6ff;
      color: #334155;
      font-size: 0.72rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    th,
    td {
      border-bottom: 1px solid #e2e8f0;
      padding: 14px 12px;
      vertical-align: middle;
    }

    tbody tr:last-child td {
      border-bottom: 0;
    }

    tbody tr:hover {
      background: #f8fafc;
    }

    td:first-child {
      min-width: 150px;
    }

    td code {
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.82rem;
      white-space: nowrap;
    }

    td small {
      color: #64748b;
      display: block;
      font-size: 0.75rem;
      line-height: 1.45;
      margin-top: 5px;
    }

    .action-cell {
      text-align: right;
      white-space: nowrap;
    }

    .visually-hidden {
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px;
    }

    @media (max-width: 920px) {
      .login-shell {
        grid-template-columns: 1fr;
        max-width: 680px;
      }
    }

    @media (max-width: 560px) {
      .login-container {
        align-items: flex-start;
        padding: 20px 12px;
      }

      .login-card,
      .credentials-card {
        border-radius: 14px;
        padding: 22px;
      }

      .credentials-heading {
        align-items: flex-start;
        flex-direction: column;
      }

      .credentials-table-wrap {
        border: 0;
        overflow: visible;
      }

      table,
      tbody,
      tr,
      td {
        display: block;
        min-width: 0;
        width: 100%;
      }

      thead {
        display: none;
      }

      tbody {
        display: grid;
        gap: 12px;
      }

      tbody tr {
        background: #f8fafc;
        border: 1px solid #dbe4f0;
        border-radius: 12px;
        box-sizing: border-box;
        overflow: hidden;
      }

      th,
      td,
      tbody tr:last-child td {
        border-bottom: 1px solid #e2e8f0;
      }

      td {
        box-sizing: border-box;
        display: grid;
        gap: 8px;
        grid-template-columns: 76px minmax(0, 1fr);
        padding: 12px 14px;
      }

      td::before {
        color: #64748b;
        content: attr(data-label);
        font-size: 0.7rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      td:first-child {
        min-width: 0;
      }

      td:first-child small {
        grid-column: 2;
      }

      td code {
        overflow-wrap: anywhere;
        white-space: normal;
      }

      .action-cell {
        border-bottom: 0 !important;
        display: flex;
        justify-content: flex-end;
      }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  readonly demoMode = environment.demoMode;
  readonly demoAccounts = DEMO_ACCOUNTS;
  submitting = false;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
      private snackBar: MatSnackBar
  ) {}

  loginWithDemoAccount(account: DemoAccount): void {
    this.email = account.email;
    this.password = account.password;
    this.onSubmit();
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      if (params.get('timedOut') === 'true') {
        this.snackBar.open('Your session timed out due to inactivity. Please sign in again.', 'Close', {
          duration: 4000
        });
      }
    });
  }

  onSubmit() {
    if (this.submitting) {
      return;
    }

    this.submitting = true;
    const loginPayload = {
      email: this.email.trim(),
      password: this.password
    };

    this.auth.login(loginPayload).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.submitting = false;
        const message = err.error?.message || 'Login failed. Please check your email and password.';
        this.snackBar.open(message, 'Close', {
          duration: 4000
        });
      }
    });
  }

}
