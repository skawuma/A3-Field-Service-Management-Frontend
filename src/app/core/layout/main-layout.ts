import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SessionTimeoutService } from '../services/session-timeout.service';
import { MATERIAL_IMPORTS } from '../../material-imports';
import { AuthService } from '../services/auth-service';
import { NotificationService } from '../services/notification.service';
import { RealtimeService } from '../services/realtime.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, ...MATERIAL_IMPORTS],
  template: `
    <mat-sidenav-container class="app-container">

      <!-- SIDEBAR -->
      <mat-sidenav mode="side" opened class="app-sidenav">

        <div class="logo">
          <div class="logo-text">A3 FSM</div>
          <div class="welcome" *ngIf="displayName">
            Welcome, {{ displayName }}
          </div>
        </div>

        <mat-nav-list>

          <!-- Dashboard: ADMIN + DISPATCH only -->
    <div *ngIf="isAdmin || isDispatch ||isTech">
  <a mat-list-item routerLink="/dashboard">
    <mat-icon>dashboard</mat-icon>
    <span>Dashboard</span>
  </a>
     </div>

          <!-- Technicians: ADMIN only -->
          <a
            mat-list-item
            routerLink="/technicians"
            *ngIf="isAdmin">
            <mat-icon>engineering</mat-icon>
            <span>Technicians</span>
          </a>

          <!-- Work Orders: ALL ROLES -->
          <a mat-list-item routerLink="/workorders">
            <mat-icon>assignment</mat-icon>
            <span>Work Orders</span>
          </a>

        </mat-nav-list>
      </mat-sidenav>

      <!-- MAIN CONTENT -->
      <mat-sidenav-content>
        <mat-toolbar color="primary" class="app-toolbar">

          <span class="toolbar-title">A3 Field Service Management</span>

          <!-- USER INFO -->
          <div class="user-info" *ngIf="userEmail">
            <div class="user-text">
              <div class="user-email">{{ userEmail }}</div>
              <span class="role-badge" [ngClass]="roleClass">{{ role }}</span>
            </div>

            <button mat-icon-button [matMenuTriggerFor]="userMenu">
              <div class="avatar">{{ userInitials }}</div>
            </button>
          </div>

          <button *ngIf="!userEmail" mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu" class="menu-panel">
            <div class="menu-header" *ngIf="userEmail">
              <div class="avatar big">{{ userInitials }}</div>
              <div class="menu-email">{{ userEmail }}</div>
              <span class="role-badge" [ngClass]="roleClass">{{ role }}</span>
            </div>

            <button mat-menu-item (click)="onLogout()">
              <mat-icon>logout</mat-icon> Logout
            </button>
          </mat-menu>

        </mat-toolbar>

        <div class="app-content">
          <router-outlet></router-outlet>
        </div>

      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    /* unchanged styles from your file */
    .app-container { height: 100vh; }
    .app-sidenav {
      width: 240px;
      padding-top: 8px;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
    }
    .logo { padding: 0 16px 16px 16px; border-bottom: 1px solid #e5e7eb; }
    .logo-text { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .welcome { font-size: 12px; color: #6b7280; }

    .app-toolbar {
      position: sticky; top: 0; z-index: 10;
      display: flex; align-items: center;
    }
    .toolbar-title { flex: 1; font-size: 18px; font-weight: 600; }
    .app-content { padding: 16px; }

    .user-info { display: flex; align-items: center; gap: 12px; }
    .user-email { font-size: 13px; }

    .avatar {
      background: #e0e7ff;
      color: #1e3a8a;
      width: 32px; height: 32px;
      border-radius: 50%;
      display: flex; justify-content: center; align-items: center;
      font-weight: 600; text-transform: uppercase;
    }

    .avatar.big {
      width: 40px; height: 40px; font-size: 18px;
      margin-bottom: 8px;
    }

    .role-badge {
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      margin-top: 2px;
      text-transform: uppercase;
    }

    .role-admin { background: #ffebee; color: #c62828; }
    .role-dispatch { background: #e3f2fd; color: #1565c0; }
    .role-tech { background: #e8f5e9; color: #2e7d32; }

    .menu-panel { min-width: 220px; }
    .menu-header {
      padding: 12px 16px 8px 16px;
      display: flex; flex-direction: column; align-items: center;
      border-bottom: 1px solid #e5e7eb;
    }
  `]
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  role: string | null = null;
  userEmail: string | null = null;
  displayName: string = '';
  userInitials: string = '';
  roleClass = '';

  isAdmin = false;
  isDispatch = false;
  isTech = false;

  constructor(
    private sessionTimeoutService: SessionTimeoutService,
    private auth: AuthService,
    private router: Router,
    private realtime: RealtimeService,
    private notify: NotificationService
  ) { }

  ngOnInit() {
    this.role = this.auth.getRole();

    this.isAdmin = this.role === 'ADMIN';
    this.isDispatch = this.role === 'DISPATCH';
    this.isTech = this.role === 'TECH';

    const { email, displayName } = this.decodeUserInfoFromToken();
    this.userEmail = email;
    this.displayName = displayName || email || 'User';
    this.userInitials = this.getInitials(this.displayName);
    this.roleClass = this.getRoleClass(this.role);
    this.sessionTimeoutService.startWatching();
    this.bindUserNotifications();
    this.realtime.connect();

  }

  private bindUserNotifications(): void {
    this.realtime.userNotifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (!event) {
          return;
        }

        const message = event.metadata?.notificationMessage
          ?? event.metadata?.activityDescription
          ?? event.message
          ?? 'New realtime notification received';

        this.notify.info(message);
      });
  }



  private decodeUserInfoFromToken(): { email: string | null; displayName: string } {
    const token = this.auth.getToken();
    if (!token) return { email: null, displayName: '' };

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.sub ?? null,
        displayName: payload.firstName && payload.lastName
          ? `${payload.firstName} ${payload.lastName}`
          : ''
      };
    } catch {
      return { email: null, displayName: '' };
    }
  }

  private getRoleClass(role: string | null): string {
    return {
      'ADMIN': 'role-admin',
      'DISPATCH': 'role-dispatch',
      'TECH': 'role-tech'
    }[role ?? ''] ?? '';
  }

  private getInitials(text: string): string {
    if (!text) return '?';
    const p = text.trim().split(' ');
    return p.length >= 2
      ? (p[0][0] + p[1][0]).toUpperCase()
      : p[0].substring(0, 2).toUpperCase();
  }

  onLogout() {
    this.realtime.disconnect();
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }



  ngOnDestroy(): void {
    this.sessionTimeoutService.stopWatching();
    this.realtime.disconnect();
  }
}
