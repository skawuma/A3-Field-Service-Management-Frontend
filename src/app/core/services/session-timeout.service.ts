import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { fromEvent, merge, Subscription, interval } from 'rxjs';
import { SessionTimeoutDialogComponent } from '../session/session-timeout-dialog.component';
import { AuthService } from './auth-service';

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService implements OnDestroy {
  private readonly warningAfterMs = 4 * 60 * 1000; // 4 min
  private readonly logoutAfterMs = 5 * 60 * 1000;  // 5 min
  private readonly countdownSeconds = 60;

  private activitySub?: Subscription;
  private warningTimer: any;
  private logoutTimer: any;
  private countdownSub?: Subscription;

  private dialogRef?: MatDialogRef<SessionTimeoutDialogComponent>;
  private remainingSeconds = this.countdownSeconds;

  constructor(
    private ngZone: NgZone,
    private dialog: MatDialog,
    private authService: AuthService,
    private router: Router
  ) {}

  startWatching() {
    this.stopWatching();

    this.ngZone.runOutsideAngular(() => {
      this.activitySub = merge(
        fromEvent(document, 'mousemove'),
        fromEvent(document, 'mousedown'),
        fromEvent(document, 'keydown'),
        fromEvent(document, 'scroll'),
        fromEvent(document, 'touchstart'),
        fromEvent(window, 'focus')
      ).subscribe(() => {
        this.ngZone.run(() => {
          if (this.dialogRef) {
            return;
          }

          this.resetTimers();
        });
      });
    });

    this.resetTimers();
  }

  stopWatching() {
    this.activitySub?.unsubscribe();
    this.activitySub = undefined;

    this.clearTimers();
    this.closeDialog();
  }

  private resetTimers() {
    this.clearTimers();

    // If dialog is open and user becomes active, close it
    if (this.dialogRef) {
      this.closeDialog();
    }

    this.warningTimer = setTimeout(() => {
      this.openWarningDialog();
    }, this.warningAfterMs);

    this.logoutTimer = setTimeout(() => {
      this.forceLogout();
    }, this.logoutAfterMs);
  }

  private clearTimers() {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = undefined;
    }

    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = undefined;
    }

    this.countdownSub?.unsubscribe();
    this.countdownSub = undefined;
  }

  private openWarningDialog() {
    if (this.dialogRef) return;

    this.remainingSeconds = this.countdownSeconds;

    this.dialogRef = this.dialog.open(SessionTimeoutDialogComponent, {
      width: '480px',
      disableClose: true,
      data: { countdown: this.remainingSeconds }
    });

    this.countdownSub = interval(1000).subscribe(() => {
      this.remainingSeconds--;

      if (this.dialogRef?.componentInstance) {
        this.dialogRef.componentInstance.data.countdown = this.remainingSeconds;
      }

      if (this.remainingSeconds <= 0) {
        this.forceLogout();
      }
    });

    this.dialogRef.afterClosed().subscribe(result => {
      this.countdownSub?.unsubscribe();
      this.countdownSub = undefined;
      this.dialogRef = undefined;

      if (result === 'extend') {
        this.extendSession();
      } else if (result === 'logout') {
        this.forceLogout();
      }
    });
  }

  private closeDialog() {
    this.countdownSub?.unsubscribe();
    this.countdownSub = undefined;

    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = undefined;
    }
  }

  private extendSession() {
    if (!this.authService.hasValidRefreshToken()) {
      if (this.authService.hasValidAccessToken()) {
        this.resetTimers();
        return;
      }

      this.forceLogout();
      return;
    }

    this.authService.refreshSession().subscribe({
      next: () => {
        this.resetTimers();
      },
      error: () => {
        this.forceLogout();
      }
    });
  }

  private forceLogout() {
    this.stopWatching();

    this.authService.logout();

    this.router.navigate(['/auth/login'], {
      queryParams: { timedOut: 'true' }
    });
  }

  ngOnDestroy(): void {
    this.stopWatching();
  }
}
