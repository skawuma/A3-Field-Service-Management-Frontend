import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MATERIAL_IMPORTS } from '../../material-imports';
import { AuthService } from '../services/auth-service';
import { NotificationService } from '../services/notification.service';
import { RealtimeService } from '../services/realtime.service';
import { SessionTimeoutService } from '../services/session-timeout.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ...MATERIAL_IMPORTS],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('drawer') drawer?: MatSidenav;

  role: string | null = null;
  userEmail: string | null = null;
  displayName = '';
  userInitials = '';
  roleClass = '';
  isMobile = false;

  isAdmin = false;
  isDispatch = false;
  isTech = false;

  constructor(
    private readonly sessionTimeoutService: SessionTimeoutService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly realtime: RealtimeService,
    private readonly notify: NotificationService,
    private readonly breakpointObserver: BreakpointObserver,
  ) {}

  ngOnInit(): void {
    this.role = this.auth.getRole();
    this.isAdmin = this.role === 'ADMIN';
    this.isDispatch = this.role === 'DISPATCH';
    this.isTech = this.role === 'TECH';

    const { email, displayName } = this.decodeUserInfoFromToken();
    this.userEmail = email;
    this.displayName = displayName || email || 'User';
    this.userInitials = this.getInitials(this.displayName);
    this.roleClass = this.getRoleClass(this.role);

    this.breakpointObserver
      .observe('(max-width: 900px)')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.isMobile = state.matches;
        if (!state.matches) {
          this.drawer?.open();
        }
      });

    this.sessionTimeoutService.startWatching();
    this.bindUserNotifications();
    this.realtime.connect();
  }

  toggleNavigation(): void {
    this.drawer?.toggle();
  }

  closeNavigation(): void {
    if (this.isMobile) {
      this.drawer?.close();
    }
  }

  onLogout(): void {
    this.realtime.disconnect();
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    this.sessionTimeoutService.stopWatching();
    this.realtime.disconnect();
  }

  private bindUserNotifications(): void {
    this.realtime.userNotifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (!event) {
          return;
        }

        const message =
          event.metadata?.notificationMessage ??
          event.metadata?.activityDescription ??
          event.message ??
          'New realtime notification received';

        this.notify.info(message);
      });
  }

  private decodeUserInfoFromToken(): { email: string | null; displayName: string } {
    const token = this.auth.getToken();
    if (!token) {
      return { email: null, displayName: '' };
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.sub ?? null,
        displayName:
          payload.firstName && payload.lastName
            ? `${payload.firstName} ${payload.lastName}`
            : '',
      };
    } catch {
      return { email: null, displayName: '' };
    }
  }

  private getRoleClass(role: string | null): string {
    return (
      {
        ADMIN: 'role-admin',
        DISPATCH: 'role-dispatch',
        TECH: 'role-tech',
      }[role ?? ''] ?? ''
    );
  }

  private getInitials(text: string): string {
    if (!text) {
      return '?';
    }
    const parts = text.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }
}
