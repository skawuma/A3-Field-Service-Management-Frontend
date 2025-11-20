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
    <h2 class="mb-4">Dashboard</h2>

    <div *ngIf="loading" class="loading-container">
      <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
    </div>

    <div *ngIf="!loading" class="grid-container">

      <mat-card class="stat-card primary">
        <mat-icon class="icon">groups</mat-icon>
        <div class="value">{{ summary?.totalTechnicians }}</div>
        <div class="label">Technicians</div>
      </mat-card>

      <mat-card class="stat-card accent">
        <mat-icon class="icon">assignment</mat-icon>
        <div class="value">{{ summary?.totalWorkOrders }}</div>
        <div class="label">Work Orders</div>
      </mat-card>

      <mat-card class="stat-card warn">
        <mat-icon class="icon">error_outline</mat-icon>
        <div class="value">{{ summary?.openWorkOrders }}</div>
        <div class="label">Open</div>
      </mat-card>

      <mat-card class="stat-card in-progress">
        <mat-icon class="icon">autorenew</mat-icon>
        <div class="value">{{ summary?.inProgressWorkOrders }}</div>
        <div class="label">In Progress</div>
      </mat-card>

      <mat-card class="stat-card unassigned">
        <mat-icon class="icon">person_off</mat-icon>
        <div class="value">{{ summary?.unassignedWorkOrders }}</div>
        <div class="label">Unassigned</div>
      </mat-card>

      <mat-card class="stat-card today">
        <mat-icon class="icon">event</mat-icon>
        <div class="value">{{ summary?.scheduledToday }}</div>
        <div class="label">Scheduled Today</div>
      </mat-card>

    </div>
  `,
  styles: [`
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .stat-card {
      padding: 20px;
      text-align: center;
      color: white;
    }

    .icon {
      font-size: 40px;
      margin-bottom: 8px;
    }

    .value {
      font-size: 32px;
      font-weight: 600;
    }

    .label {
      font-size: 14px;
      opacity: 0.8;
    }

    .primary { background: #3f51b5; }
    .accent { background: #e91e63; }
    .warn { background: #f44336; }
    .in-progress { background: #009688; }
    .unassigned { background: #607d8b; }
    .today { background: #8bc34a; }

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

    // Optional: Auto refresh every minute
    // setInterval(() => this.loadSummary(), 60000);
  }

  loadSummary() {
    this.api.get<DashboardSummary>('dashboard/summary')
      .subscribe({
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
