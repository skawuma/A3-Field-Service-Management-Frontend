import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL_IMPORTS } from '../../material-imports';

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Your Session Is About To Expire</h2>

    <mat-dialog-content>
      <div class="dialog-body">
        <div class="warning-box">
          <mat-icon>schedule</mat-icon>
          <div>
            Your session is about to expire because you have been inactive.
          </div>
        </div>

        <p class="message">
          You will be logged out in
          <strong>{{ data.countdown }}</strong>
          seconds.
        </p>

        <p class="sub-message">
          Select <strong>Stay Signed In</strong> to continue your session.
        </p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button color="warn" (click)="logoutNow()">
        Log Out
      </button>

      <button mat-flat-button color="primary" (click)="staySignedIn()">
        Stay Signed In
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-width: 420px;
      max-width: 100%;
      padding-top: 6px;
    }

    .warning-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 10px;
      background: #fff7ed;
      border: 1px solid #fdba74;
      color: #9a3412;
      font-size: 14px;
      font-weight: 500;
    }

    .message {
      margin: 0;
      font-size: 15px;
      color: #374151;
    }

    .sub-message {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .dialog-body {
        min-width: unset;
      }
    }
  `]
})
export class SessionTimeoutDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { countdown: number },
    private dialogRef: MatDialogRef<SessionTimeoutDialogComponent>
  ) {}

  staySignedIn() {
    this.dialogRef.close('extend');
  }

  logoutNow() {
    this.dialogRef.close('logout');
  }
}
