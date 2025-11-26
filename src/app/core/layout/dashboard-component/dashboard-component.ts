import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../../../material-imports';
import { ApiService } from '../../services/api-service';
import { NotificationService } from '../../services/notification.service';

interface DashboardSummary {
  totalTechnicians: number;
  totalWorkOrders: number;
  openWorkOrders: number;
  inProgressWorkOrders: number;
  unassignedWorkOrders: number;
  scheduledToday: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_IMPORTS],
  template: `
    <!-- HEADER -->
    <div class="header mb-6">
      <h2 class="title">Dashboard</h2>
      <p class="subtitle">Overview of technicians and work order activity</p>
    </div>

    <!-- LOADING -->
    <div *ngIf="loading" class="loading-container">
      <mat-progress-spinner diameter="50" mode="indeterminate"></mat-progress-spinner>
    </div>

    <!-- DATA GRID -->
    <div *ngIf="!loading" class="grid-container">

      <!-- TECHNICIANS -->
      <mat-card class="stat-card primary mat-elevation-z4">
        <mat-icon class="icon">groups</mat-icon>
        <div class="value">{{ summary?.totalTechnicians }}</div>
        <div class="label">Technicians</div>
      </mat-card>

      <!-- TOTAL WORK ORDERS -->
      <mat-card class="stat-card accent mat-elevation-z4">
        <mat-icon class="icon">assignment</mat-icon>
        <div class="value">{{ summary?.totalWorkOrders }}</div>
        <div class="label">Work Orders</div>
      </mat-card>

      <!-- OPEN -->
      <mat-card class="stat-card warn mat-elevation-z4">
        <mat-icon class="icon">error_outline</mat-icon>
        <div class="value">{{ summary?.openWorkOrders }}</div>
        <div class="label">Open</div>
      </mat-card>

      <!-- IN PROGRESS -->
      <mat-card class="stat-card in-progress mat-elevation-z4">
        <mat-icon class="icon">autorenew</mat-icon>
        <div class="value">{{ summary?.inProgressWorkOrders }}</div>
        <div class="label">In Progress</div>
      </mat-card>

      <!-- UNASSIGNED -->
      <mat-card class="stat-card unassigned mat-elevation-z4">
        <mat-icon class="icon">person_off</mat-icon>
        <div class="value">{{ summary?.unassignedWorkOrders }}</div>
        <div class="label">Unassigned</div>
      </mat-card>

      <!-- SCHEDULED TODAY -->
      <mat-card class="stat-card today mat-elevation-z4">
        <mat-icon class="icon">event</mat-icon>
        <div class="value">{{ summary?.scheduledToday }}</div>
        <div class="label">Scheduled Today</div>
      </mat-card>

    </div>
  `,
  styles: [`
    .header {
      text-align: left;
    }

    .title {
      font-size: 26px;
      font-weight: 600;
    }

    .subtitle {
      font-size: 14px;
      color: #6b7280;
      margin-top: -4px;
    }

    .grid-container {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    .stat-card {
      padding: 24px;
      text-align: center;
      color: white;
      border-radius: 14px;
      transition: transform .2s ease, box-shadow .2s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
    }

    .icon {
      font-size: 42px;
      margin-bottom: 8px;
      opacity: 0.9;
    }

    .value {
      font-size: 34px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .label {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.85;
    }

    .primary       { background: #3f51b5; }
    .accent        { background: #e91e63; }
    .warn          { background: #f44336; }
    .in-progress   { background: #009688; }
    .unassigned    { background: #607d8b; }
    .today         { background: #8bc34a; }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
  `]
})
export class DashboardComponent implements OnInit {

  summary: DashboardSummary | null = null;
  loading = true;

  constructor(
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.loadSummary();
    
  }

  loadSummary() {
    this.loading = true;
    this.api.get<DashboardSummary>('dashboard/summary').subscribe({
      next: res => {
        this.summary = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notify.error('Failed to load dashboard data');
      }
    });
  }
}
