import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MATERIAL_IMPORTS } from '../../material-imports';
import { AuthService } from '../services/auth-service';

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
          <a
            mat-list-item
            routerLink="/dashboard"
            *ngIf="isAdmin || isDispatch">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>

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
  styles: [/* same styles you already have */]
})
export class MainLayoutComponent implements OnInit {

  role: string | null = null;
  userEmail: string | null = null;
  displayName: string = '';
  userInitials: string = '';
  roleClass = '';

  isAdmin = false;
  isDispatch = false;
  isTech = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

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
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
