import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MATERIAL_IMPORTS } from '../../material-imports';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, ...MATERIAL_IMPORTS],
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav mode="side" opened class="app-sidenav">
        <div class="logo">A3 FSM</div>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/technicians">
            <mat-icon>engineering</mat-icon>
            <span>Technicians</span>
          </a>
          <a mat-list-item routerLink="/workorders">
            <mat-icon>assignment</mat-icon>
            <span>Work Orders</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="app-toolbar">
          <span class="flex-1">A3 Field Service Management</span>
          <button mat-button (click)="onLogout()">
            <mat-icon>logout</mat-icon>
            Logout
          </button>
        </mat-toolbar>

        <div class="app-content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container { height: 100vh; }
    .app-sidenav {
      width: 240px;
      padding: 16px 0;
    }
    .logo {
      font-size: 20px;
      font-weight: 600;
      padding: 0 16px 16px 16px;
    }
    .app-toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .app-content {
      padding: 16px;
    }
    .flex-1 {
      flex: 1;
    }
  `]
})
export class MainLayoutComponent {
  constructor(private auth: AuthService) {}

  onLogout() {
    this.auth.logout();
    window.location.href = '/auth/login';
  }
}
