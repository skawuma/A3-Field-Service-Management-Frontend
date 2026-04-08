import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Router } from '@angular/router';
import { MATERIAL_IMPORTS } from '../../../material-imports';
import { ApiService } from '../../services/api-service';
import { AuthService } from '../../services/auth-service';
import { NotificationService } from '../../services/notification.service';

interface DashboardSummary {
  totalTechnicians: number;
  totalWorkOrders: number;
  openWorkOrders: number;
  inProgressWorkOrders: number;
  unassignedWorkOrders: number;
  scheduledToday: number;
  dueTodayWorkOrders?: number;
  overdueWorkOrders?: number;
  completedToday?: number;
  highPriorityOpen?: number;
}

interface DashboardRecentActivityItem {
  workOrderId: number | null;
  eventType: string;
  title: string;
  description: string;
  actor: string;
  createdAt: string;
}

interface DashboardChartDatum {
  key: string;
  label: string;
  total: number;
}

interface DashboardTrendPoint {
  date: string;
  label: string;
  total: number;
}

interface DashboardAnalytics {
  workOrdersByStatus: DashboardChartDatum[];
  workOrdersByPriority: DashboardChartDatum[];
  completionTrend: DashboardTrendPoint[];
}

interface DashboardSlaWorkOrderItem {
  workOrderId: number | null;
  workOrderRef: string;
  title: string;
  customerName: string;
  scheduledDate: string;
  status: string;
  priority: string;
  assignedTechId: number | null;
  assignedTechName: string | null;
  daysLate: number;
}

interface DashboardSlaSummary {
  overdueCount: number;
  dueTodayCount: number;
  overdueItems: DashboardSlaWorkOrderItem[];
  dueTodayItems: DashboardSlaWorkOrderItem[];
}

interface DashboardTechnicianWorkloadItem {
  technicianId: number | null;
  technicianName: string;
  totalAssignedWorkOrders: number;
  openAssignedWorkOrders: number;
  inProgressAssignedWorkOrders: number;
  dueTodayAssignedWorkOrders: number;
  overdueAssignedWorkOrders: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, ...MATERIAL_IMPORTS],
  template: `
    <div class="dashboard-page">

      <div class="header-row">
        <div class="header-text">
          <h2 class="title">Dashboard</h2>
          <p class="subtitle">{{ dashboardSubtitle }}</p>
          <p class="updated-at" *ngIf="lastUpdated">
            Last updated: {{ lastUpdated | date:'medium' }}
          </p>
        </div>

        <button
          mat-raised-button
          color="primary"
          (click)="refreshDashboard()"
          [disabled]="isRefreshing"
        >
          <mat-icon>refresh</mat-icon>
          Refresh
        </button>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-progress-spinner diameter="48" mode="indeterminate"></mat-progress-spinner>
      </div>

      <mat-card *ngIf="!loading && loadError" class="state-card error-card">
        <div class="state-content">
          <mat-icon class="state-icon">error</mat-icon>
          <div>
            <div class="state-title">Unable to load dashboard</div>
            <div class="state-subtitle">Please try again.</div>
          </div>
        </div>

        <button mat-stroked-button color="warn" (click)="refreshDashboard()">
          Retry
        </button>
      </mat-card>

      <ng-container *ngIf="!loading && !loadError">

        <div *ngIf="!isTechDashboard" class="grid-container">
          <mat-card class="stat-card primary mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">groups</mat-icon>
            </div>
            <div class="value">{{ summary?.totalTechnicians ?? 0 }}</div>
            <div class="label">Technicians</div>
          </mat-card>

          <mat-card class="stat-card accent mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">assignment</mat-icon>
            </div>
            <div class="value">{{ summary?.totalWorkOrders ?? 0 }}</div>
            <div class="label">Work Orders</div>
          </mat-card>

          <mat-card class="stat-card warn mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">error_outline</mat-icon>
            </div>
            <div class="value">{{ summary?.openWorkOrders ?? 0 }}</div>
            <div class="label">Open</div>
          </mat-card>

          <mat-card class="stat-card in-progress mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">autorenew</mat-icon>
            </div>
            <div class="value">{{ summary?.inProgressWorkOrders ?? 0 }}</div>
            <div class="label">In Progress</div>
          </mat-card>

          <mat-card class="stat-card unassigned mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">person_off</mat-icon>
            </div>
            <div class="value">{{ summary?.unassignedWorkOrders ?? 0 }}</div>
            <div class="label">Unassigned</div>
          </mat-card>

          <mat-card class="stat-card today mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">event</mat-icon>
            </div>
            <div class="value">{{ summary?.scheduledToday ?? 0 }}</div>
            <div class="label">Scheduled Today</div>
          </mat-card>

          <mat-card class="stat-card sla-due mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">today</mat-icon>
            </div>
            <div class="value">{{ summary?.dueTodayWorkOrders ?? 0 }}</div>
            <div class="label">Due Today</div>
          </mat-card>

          <mat-card class="stat-card overdue mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">schedule</mat-icon>
            </div>
            <div class="value">{{ summary?.overdueWorkOrders ?? 0 }}</div>
            <div class="label">Overdue</div>
          </mat-card>

          <mat-card class="stat-card completed mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">task_alt</mat-icon>
            </div>
            <div class="value">{{ summary?.completedToday ?? 0 }}</div>
            <div class="label">Completed Today</div>
          </mat-card>

          <mat-card class="stat-card urgent mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">priority_high</mat-icon>
            </div>
            <div class="value">{{ summary?.highPriorityOpen ?? 0 }}</div>
            <div class="label">High Priority Open</div>
          </mat-card>
        </div>

        <div *ngIf="isTechDashboard" class="grid-container">
          <mat-card class="stat-card sla-due mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">today</mat-icon>
            </div>
            <div class="value">{{ slaSummary?.dueTodayCount ?? 0 }}</div>
            <div class="label">{{ dueTodayCardLabel }}</div>
          </mat-card>

          <mat-card class="stat-card overdue mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">schedule</mat-icon>
            </div>
            <div class="value">{{ slaSummary?.overdueCount ?? 0 }}</div>
            <div class="label">{{ overdueCardLabel }}</div>
          </mat-card>
        </div>

        <div class="details-grid">
          <mat-card class="panel-card">
            <div class="panel-header">
              <div>
                <h3>{{ slaPanelTitle }}</h3>
                <p class="panel-subtitle">{{ slaPanelSubtitle }}</p>
              </div>
            </div>

            <div *ngIf="slaLoading" class="panel-loading">
              <mat-progress-spinner diameter="32" mode="indeterminate"></mat-progress-spinner>
            </div>

            <div *ngIf="!slaLoading && slaLoadError" class="empty-state">
              SLA tracking is temporarily unavailable.
            </div>

            <div *ngIf="!slaLoading && !slaLoadError && slaSummary" class="sla-section">
              <div class="sla-summary-row">
                <div class="sla-badge overdue-badge">
                  {{ overdueBadgeLabel }}: {{ slaSummary.overdueCount }}
                </div>
                <div class="sla-badge due-badge">
                  {{ dueTodayBadgeLabel }}: {{ slaSummary.dueTodayCount }}
                </div>
              </div>

              <div class="sla-columns">
                <div class="sla-column">
                  <h4>{{ overdueListTitle }}</h4>

                  <div *ngIf="slaSummary.overdueItems.length === 0" class="mini-empty-state">
                    {{ overdueEmptyState }}
                  </div>

                  <div class="sla-item" *ngFor="let item of slaSummary.overdueItems">
                    <button
                      type="button"
                      class="sla-link-button"
                      (click)="openWorkOrder(item.workOrderId)"
                    >
                      {{ item.workOrderRef }} - {{ item.title || 'Untitled work order' }}
                    </button>

                    <div class="sla-item-meta">
                      {{ item.customerName || 'No customer' }} •
                      {{ item.scheduledDate | date:'mediumDate' }} •
                      {{ item.assignedTechName || 'Unassigned' }}
                    </div>

                    <div class="sla-item-submeta">
                      {{ item.daysLate }} day{{ item.daysLate === 1 ? '' : 's' }} late •
                      {{ item.status }} •
                      {{ item.priority || 'Unspecified' }}
                    </div>
                  </div>
                </div>

                <div class="sla-column">
                  <h4>{{ dueTodayListTitle }}</h4>

                  <div *ngIf="slaSummary.dueTodayItems.length === 0" class="mini-empty-state">
                    {{ dueTodayEmptyState }}
                  </div>

                  <div class="sla-item" *ngFor="let item of slaSummary.dueTodayItems">
                    <button
                      type="button"
                      class="sla-link-button"
                      (click)="openWorkOrder(item.workOrderId)"
                    >
                      {{ item.workOrderRef }} - {{ item.title || 'Untitled work order' }}
                    </button>

                    <div class="sla-item-meta">
                      {{ item.customerName || 'No customer' }} •
                      {{ item.scheduledDate | date:'mediumDate' }} •
                      {{ item.assignedTechName || 'Unassigned' }}
                    </div>

                    <div class="sla-item-submeta">
                      {{ item.status }} • {{ item.priority || 'Unspecified' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-card>
        </div>

        <div *ngIf="!isTechDashboard" class="analytics-grid">
          <mat-card class="panel-card chart-card">
            <div class="panel-header">
              <div>
                <h3>Work Orders by Status</h3>
                <p class="panel-subtitle">Current status distribution across all jobs</p>
              </div>
            </div>

            <div *ngIf="analyticsLoading" class="panel-loading">
              <mat-progress-spinner diameter="32" mode="indeterminate"></mat-progress-spinner>
            </div>

            <div *ngIf="!analyticsLoading && analyticsLoadError" class="empty-state">
              Analytics are temporarily unavailable.
            </div>

            <div
              *ngIf="!analyticsLoading && !analyticsLoadError && hasChartData(statusChartData.datasets[0].data)"
              class="chart-wrapper"
            >
              <canvas
                baseChart
                [type]="statusChartType"
                [data]="statusChartData"
                [options]="statusChartOptions"
              ></canvas>
            </div>

            <div
              *ngIf="!analyticsLoading && !analyticsLoadError && !hasChartData(statusChartData.datasets[0].data)"
              class="empty-state"
            >
              No status analytics available yet.
            </div>
          </mat-card>

          <mat-card class="panel-card chart-card">
            <div class="panel-header">
              <div>
                <h3>Work Orders by Priority</h3>
                <p class="panel-subtitle">Current workload mix by priority level</p>
              </div>
            </div>

            <div *ngIf="analyticsLoading" class="panel-loading">
              <mat-progress-spinner diameter="32" mode="indeterminate"></mat-progress-spinner>
            </div>

            <div *ngIf="!analyticsLoading && analyticsLoadError" class="empty-state">
              Analytics are temporarily unavailable.
            </div>

            <div
              *ngIf="!analyticsLoading && !analyticsLoadError && hasChartData(priorityChartData.datasets[0].data)"
              class="chart-wrapper"
            >
              <canvas
                baseChart
                [type]="priorityChartType"
                [data]="priorityChartData"
                [options]="priorityChartOptions"
              ></canvas>
            </div>

            <div
              *ngIf="!analyticsLoading && !analyticsLoadError && !hasChartData(priorityChartData.datasets[0].data)"
              class="empty-state"
            >
              No priority analytics available yet.
            </div>
          </mat-card>

          <mat-card class="panel-card chart-card">
            <div class="panel-header">
              <div>
                <h3>Completion Trend</h3>
                <p class="panel-subtitle">Completed work orders over the last 7 days</p>
              </div>
            </div>

            <div *ngIf="analyticsLoading" class="panel-loading">
              <mat-progress-spinner diameter="32" mode="indeterminate"></mat-progress-spinner>
            </div>

            <div *ngIf="!analyticsLoading && analyticsLoadError" class="empty-state">
              Analytics are temporarily unavailable.
            </div>

            <div *ngIf="!analyticsLoading && !analyticsLoadError" class="chart-wrapper">
              <canvas
                baseChart
                [type]="completionTrendChartType"
                [data]="completionTrendChartData"
                [options]="completionTrendChartOptions"
              ></canvas>
            </div>
          </mat-card>
        </div>

        <div *ngIf="!isTechDashboard" class="details-grid">
          <mat-card class="panel-card">
            <div class="panel-header">
              <h3>Work Order Snapshot</h3>
            </div>

            <div class="snapshot-list">
              <div class="snapshot-item">
                <span>Total Work Orders</span>
                <strong>{{ summary?.totalWorkOrders ?? 0 }}</strong>
              </div>
              <div class="snapshot-item">
                <span>Open</span>
                <strong>{{ summary?.openWorkOrders ?? 0 }}</strong>
              </div>
              <div class="snapshot-item">
                <span>In Progress</span>
                <strong>{{ summary?.inProgressWorkOrders ?? 0 }}</strong>
              </div>
              <div class="snapshot-item">
                <span>Unassigned</span>
                <strong>{{ summary?.unassignedWorkOrders ?? 0 }}</strong>
              </div>
              <div class="snapshot-item">
                <span>Scheduled Today</span>
                <strong>{{ summary?.scheduledToday ?? 0 }}</strong>
              </div>
              <div class="snapshot-item">
                <span>Due Today</span>
                <strong>{{ summary?.dueTodayWorkOrders ?? 0 }}</strong>
              </div>
              <div class="snapshot-item">
                <span>Overdue</span>
                <strong>{{ summary?.overdueWorkOrders ?? 0 }}</strong>
              </div>
              <div class="snapshot-item">
                <span>Completed Today</span>
                <strong>{{ summary?.completedToday ?? 0 }}</strong>
              </div>
              <div class="snapshot-item">
                <span>High Priority Open</span>
                <strong>{{ summary?.highPriorityOpen ?? 0 }}</strong>
              </div>
            </div>
          </mat-card>

          <mat-card class="panel-card">
            <div class="panel-header">
              <h3>SLA Watch</h3>
            </div>

            <div class="snapshot-list">
              <div class="snapshot-item">
                <span>Overdue Work Orders</span>
                <strong>{{ summary?.overdueWorkOrders ?? 0 }}</strong>
              </div>
              <div class="snapshot-item">
                <span>Due Today Work Orders</span>
                <strong>{{ summary?.dueTodayWorkOrders ?? 0 }}</strong>
              </div>
              <div class="snapshot-item">
                <span>High Priority Open</span>
                <strong>{{ summary?.highPriorityOpen ?? 0 }}</strong>
              </div>
              <div class="snapshot-item">
                <span>Role-Aware SLA Views</span>
                <strong>Live</strong>
              </div>
            </div>
          </mat-card>

          <mat-card class="panel-card workload-panel">
            <div class="panel-header">
              <div>
                <h3>Technician Workload Overview</h3>
                <p class="panel-subtitle">Assigned load and SLA pressure across the team</p>
              </div>
            </div>

            <div *ngIf="workloadLoading" class="panel-loading compact-loading">
              <mat-progress-spinner diameter="32" mode="indeterminate"></mat-progress-spinner>
            </div>

            <div *ngIf="!workloadLoading && workloadLoadError" class="compact-empty-state">
              Technician workload is temporarily unavailable.
            </div>

            <div *ngIf="!workloadLoading && !workloadLoadError && technicianWorkload.length === 0" class="compact-empty-state">
              No technician workload found yet.
            </div>

            <ng-container *ngIf="!workloadLoading && !workloadLoadError && technicianWorkload.length > 0">
              <div class="heatmap-legend">
                <span class="legend-item low">Balanced</span>
                <span class="legend-item medium">Moderate Load</span>
                <span class="legend-item high">High Pressure</span>
              </div>

              <div class="heatmap-grid">
                <div
                  class="heatmap-tile"
                  *ngFor="let item of technicianWorkload"
                  [ngClass]="getWorkloadLevel(item)"
                >
                  <div class="heatmap-header">
                    <div class="heatmap-name">{{ item.technicianName }}</div>
                  <div class="heatmap-level">{{ getWorkloadLabel(item) }}</div>
                  </div>

                  <div class="heatmap-total">
                    {{ item.totalAssignedWorkOrders }} active
                  </div>

                  <div class="heatmap-metrics">
                    <div class="heatmap-metric">
                      <span>Open</span>
                      <strong>{{ item.openAssignedWorkOrders }}</strong>
                    </div>
                    <div class="heatmap-metric">
                      <span>In Progress</span>
                      <strong>{{ item.inProgressAssignedWorkOrders }}</strong>
                    </div>
                    <div class="heatmap-metric">
                      <span>Due Today</span>
                      <strong>{{ item.dueTodayAssignedWorkOrders }}</strong>
                    </div>
                    <div class="heatmap-metric">
                      <span>Overdue</span>
                      <strong>{{ item.overdueAssignedWorkOrders }}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </ng-container>
          </mat-card>

          <mat-card class="panel-card">
            <div class="panel-header">
              <h3>Recent Activity</h3>
            </div>

            <div *ngIf="activityLoading" class="panel-loading">
              <mat-progress-spinner diameter="32" mode="indeterminate"></mat-progress-spinner>
            </div>

            <div *ngIf="!activityLoading && recentActivity.length === 0" class="empty-state">
              No recent activity found.
            </div>

            <div *ngIf="!activityLoading && recentActivity.length > 0" class="activity-list">
              <div class="activity-item" *ngFor="let item of recentActivity">
                <div class="activity-icon">
                  <mat-icon>{{ getActivityIcon(item.eventType) }}</mat-icon>
                </div>

                <div class="activity-content">
                  <button
                    *ngIf="item.workOrderId; else plainActivityTitle"
                    type="button"
                    class="activity-link"
                    (click)="openWorkOrder(item.workOrderId)"
                  >
                    {{ item.title }}
                  </button>
                  <ng-template #plainActivityTitle>
                    <div class="activity-title">{{ item.title }}</div>
                  </ng-template>
                  <div class="activity-description">{{ item.description }}</div>
                  <div class="activity-meta">
                    {{ item.actor || 'SYSTEM' }} • {{ item.createdAt | date:'medium' }}
                  </div>
                </div>
              </div>
            </div>
          </mat-card>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .title {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #111827;
    }

    .subtitle {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }

    .updated-at {
      margin: 0;
      font-size: 12px;
      color: #9ca3af;
    }

    .grid-container {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }

    .stat-card {
      padding: 24px;
      color: white;
      border-radius: 16px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      min-height: 145px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
    }

    .card-top {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 12px;
    }

    .icon {
      font-size: 34px;
      width: 34px;
      height: 34px;
      opacity: 0.95;
    }

    .value {
      font-size: 34px;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 6px;
    }

    .label {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.92;
    }

    .details-grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }

    .analytics-grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }

    .panel-card {
      border-radius: 16px;
      padding: 16px;
    }

    .workload-panel {
      display: flex;
      flex-direction: column;
    }

    .chart-card {
      min-height: 380px;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    .panel-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: #6b7280;
    }

    .snapshot-list {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .snapshot-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      color: #374151;
    }

    .snapshot-item:last-child {
      border-bottom: none;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 56px 0;
    }

    .state-card {
      border-radius: 16px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .state-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .state-icon {
      color: #d32f2f;
    }

    .state-title {
      font-weight: 600;
      color: #111827;
    }

    .state-subtitle {
      font-size: 14px;
      color: #6b7280;
    }

    .panel-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 280px;
    }

    .compact-loading {
      min-height: 160px;
    }

    .empty-state {
      min-height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }

    .compact-empty-state {
      min-height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }

    .chart-wrapper {
      position: relative;
      height: 280px;
      margin-top: 16px;
    }

    .activity-list {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .activity-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding-bottom: 14px;
      border-bottom: 1px solid #e5e7eb;
    }

    .activity-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .activity-icon mat-icon {
      color: #3f51b5;
      margin-top: 2px;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .activity-link {
      border: none;
      background: none;
      padding: 0;
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      color: #1d4ed8;
      cursor: pointer;
      text-align: left;
    }

    .activity-link:hover {
      text-decoration: underline;
    }

    .activity-description {
      font-size: 14px;
      color: #374151;
      margin-top: 2px;
    }

    .activity-meta {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 4px;
    }

    .sla-section {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .sla-summary-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .sla-badge {
      padding: 10px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
    }

    .overdue-badge {
      background: #fff7ed;
      color: #c2410c;
    }

    .due-badge {
      background: #eff6ff;
      color: #1d4ed8;
    }

    .sla-columns {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .sla-column h4 {
      margin: 0 0 12px;
      font-size: 15px;
      font-weight: 600;
      color: #111827;
    }

    .sla-item {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .sla-item:last-child {
      border-bottom: none;
    }

    .sla-link-button {
      border: none;
      background: none;
      padding: 0;
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      color: #1d4ed8;
      cursor: pointer;
      text-align: left;
    }

    .sla-link-button:hover {
      text-decoration: underline;
    }

    .sla-item-meta {
      margin-top: 4px;
      font-size: 13px;
      color: #4b5563;
    }

    .sla-item-submeta {
      margin-top: 4px;
      font-size: 12px;
      color: #9ca3af;
    }

    .mini-empty-state {
      color: #6b7280;
      font-size: 14px;
      padding: 8px 0;
    }

    .heatmap-legend {
      margin-top: 16px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .legend-item {
      font-size: 12px;
      font-weight: 600;
      border-radius: 999px;
      padding: 6px 10px;
    }

    .legend-item.low {
      background: #dcfce7;
      color: #166534;
    }

    .legend-item.medium {
      background: #fef3c7;
      color: #92400e;
    }

    .legend-item.high {
      background: #ffedd5;
      color: #c2410c;
    }

    .heatmap-grid {
      margin-top: 16px;
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      align-items: stretch;
    }

    .heatmap-tile {
      border-radius: 16px;
      padding: 16px;
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      min-height: 220px;
      box-sizing: border-box;
    }

    .heatmap-tile:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
    }

    .heatmap-tile.low {
      background: #f0fdf4;
      border-color: #86efac;
    }

    .heatmap-tile.medium {
      background: #fffbeb;
      border-color: #fcd34d;
    }

    .heatmap-tile.high {
      background: #fff7ed;
      border-color: #fdba74;
    }

    .heatmap-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .heatmap-name {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
    }

    .heatmap-level {
      font-size: 12px;
      font-weight: 700;
      border-radius: 999px;
      padding: 4px 10px;
      background: rgba(255,255,255,0.65);
      color: #374151;
      white-space: nowrap;
    }

    .heatmap-total {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
    }

    .heatmap-metrics {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .heatmap-metric {
      background: rgba(255, 255, 255, 0.7);
      border-radius: 12px;
      padding: 10px 12px;
      border: 1px solid rgba(229, 231, 235, 0.9);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .heatmap-metric span {
      font-size: 12px;
      color: #6b7280;
    }

    .heatmap-metric strong {
      font-size: 18px;
      color: #111827;
    }

    .primary { background: linear-gradient(135deg, #3f51b5, #5c6bc0); }
    .accent { background: linear-gradient(135deg, #e91e63, #ec407a); }
    .warn { background: linear-gradient(135deg, #f44336, #ff7043); }
    .in-progress { background: linear-gradient(135deg, #009688, #26a69a); }
    .unassigned { background: linear-gradient(135deg, #607d8b, #78909c); }
    .today { background: linear-gradient(135deg, #8bc34a, #9ccc65); }
    .sla-due { background: linear-gradient(135deg, #0284c7, #38bdf8); }
    .overdue { background: linear-gradient(135deg, #c2410c, #f97316); }
    .completed { background: linear-gradient(135deg, #2e7d32, #43a047); }
    .urgent { background: linear-gradient(135deg, #fb8c00, #ffb300); }

    @media (max-width: 768px) {
      .title {
        font-size: 24px;
      }

      .value {
        font-size: 30px;
      }

      .grid-container,
      .analytics-grid,
      .details-grid,
      .sla-columns,
      .heatmap-grid {
        grid-template-columns: 1fr;
      }

      .heatmap-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .heatmap-metrics {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  analytics: DashboardAnalytics | null = null;
  technicianWorkload: DashboardTechnicianWorkloadItem[] = [];
  loading = true;
  loadError = false;
  lastUpdated: Date | null = null;
  recentActivity: DashboardRecentActivityItem[] = [];
  activityLoading = false;
  analyticsLoading = false;
  analyticsLoadError = false;
  workloadLoading = false;
  workloadLoadError = false;

  readonly statusChartType: 'pie' = 'pie';
  readonly priorityChartType: 'bar' = 'bar';
  readonly completionTrendChartType: 'line' = 'line';

  slaSummary: DashboardSlaSummary | null = null;
  slaLoading = false;
  slaLoadError = false;

  readonly statusChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  readonly priorityChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  readonly completionTrendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  statusChartData: ChartConfiguration<'pie', number[], string>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#ef4444', '#f59e0b', '#0ea5e9', '#22c55e', '#6b7280'],
        borderColor: '#ffffff',
        borderWidth: 2
      }
    ]
  };

  priorityChartData: ChartConfiguration<'bar', number[], string>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Work Orders',
        backgroundColor: ['#93c5fd', '#60a5fa', '#f59e0b', '#ef4444', '#cbd5e1'],
        borderRadius: 8,
        maxBarThickness: 48
      }
    ]
  };

  completionTrendChartData: ChartConfiguration<'line', number[], string>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Completed',
        tension: 0.3,
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.18)',
        fill: true,
        pointBackgroundColor: '#16a34a',
        pointRadius: 4
      }
    ]
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private notify: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refreshDashboard();
  }

  refreshDashboard(): void {
    if (this.isTechDashboard) {
      this.summary = null;
      this.analytics = null;
      this.technicianWorkload = [];
      this.recentActivity = [];
      this.activityLoading = false;
      this.analyticsLoading = false;
      this.analyticsLoadError = false;
      this.workloadLoading = false;
      this.workloadLoadError = false;
      this.loading = true;
      this.loadError = false;
      this.loadSlaSummary(true);
      return;
    }

    this.loadSummary();
    this.loadRecentActivity();
    this.loadAnalytics();
    this.loadTechnicianWorkload();
    this.loadSlaSummary();
  }

  loadRecentActivity(): void {
    this.activityLoading = true;

    this.api.get<DashboardRecentActivityItem[]>('dashboard/recent-activity').subscribe({
      next: (res) => {
        this.recentActivity = res ?? [];
        this.activityLoading = false;
      },
      error: () => {
        this.activityLoading = false;
        this.notify.error('Failed to load recent activity');
      }
    });
  }

  loadSlaSummary(asPrimaryLoad = false): void {
    this.slaLoading = true;
    this.slaLoadError = false;

    if (asPrimaryLoad) {
      this.loading = true;
      this.loadError = false;
    }

    this.api.get<DashboardSlaSummary>('dashboard/sla').subscribe({
      next: (res) => {
        this.slaSummary = res;
        this.slaLoading = false;
        this.lastUpdated = new Date();

        if (asPrimaryLoad) {
          this.loading = false;
        }
      },
      error: () => {
        this.slaLoading = false;
        this.slaLoadError = true;
        this.notify.error('Failed to load SLA tracking data');

        if (asPrimaryLoad) {
          this.loading = false;
          this.loadError = true;
        }
      }
    });
  }

  loadAnalytics(): void {
    this.analyticsLoading = true;
    this.analyticsLoadError = false;

    this.api.get<DashboardAnalytics>('dashboard/analytics').subscribe({
      next: (res) => {
        this.analytics = res;
        this.applyAnalyticsCharts(res);
        this.analyticsLoading = false;
      },
      error: () => {
        this.analyticsLoading = false;
        this.analyticsLoadError = true;
        this.notify.error('Failed to load dashboard analytics');
      }
    });
  }

  loadTechnicianWorkload(): void {
    this.workloadLoading = true;
    this.workloadLoadError = false;

    this.api.get<DashboardTechnicianWorkloadItem[]>('dashboard/technician-workload').subscribe({
      next: (res) => {
        this.technicianWorkload = res ?? [];
        this.workloadLoading = false;
      },
      error: () => {
        this.workloadLoading = false;
        this.workloadLoadError = true;
        this.notify.error('Failed to load technician workload');
      }
    });
  }

  loadSummary(): void {
    this.loading = true;
    this.loadError = false;

    this.api.get<DashboardSummary>('dashboard/summary').subscribe({
      next: (res) => {
        this.summary = res;
        this.lastUpdated = new Date();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.notify.error('Failed to load dashboard data');
      }
    });
  }

  getActivityIcon(eventType: string): string {
    switch (eventType) {
      case 'CREATED':
        return 'add_circle';
      case 'ASSIGNED_TECHNICIAN':
        return 'person_add';
      case 'UNASSIGNED_TECHNICIAN':
        return 'assignment_return';
      case 'STARTED':
        return 'play_circle';
      case 'COMPLETED':
        return 'task_alt';
      case 'REOPENED':
        return 'restart_alt';
      default:
        return 'history';
    }
  }

  get isRefreshing(): boolean {
    return this.loading || this.activityLoading || this.analyticsLoading || this.workloadLoading || this.slaLoading;
  }

  get isTechDashboard(): boolean {
    return this.auth.isTech();
  }

  get dashboardSubtitle(): string {
    return this.isTechDashboard
      ? 'Your SLA workload and due work orders'
      : 'Overview of technicians and work order activity';
  }

  get dueTodayCardLabel(): string {
    return this.isTechDashboard ? 'My Due Today' : 'Due Today';
  }

  get overdueCardLabel(): string {
    return this.isTechDashboard ? 'My Overdue' : 'Overdue';
  }

  get slaPanelTitle(): string {
    return this.isTechDashboard ? 'My SLA Tracking' : 'SLA Tracking';
  }

  get slaPanelSubtitle(): string {
    return this.isTechDashboard
      ? 'Your overdue and due-today work orders requiring attention'
      : 'Overdue and due-today work orders requiring attention';
  }

  get overdueBadgeLabel(): string {
    return this.isTechDashboard ? 'My Overdue' : 'Overdue';
  }

  get dueTodayBadgeLabel(): string {
    return this.isTechDashboard ? 'My Due Today' : 'Due Today';
  }

  get overdueListTitle(): string {
    return this.isTechDashboard ? 'My Overdue Work Orders' : 'Overdue Items';
  }

  get dueTodayListTitle(): string {
    return this.isTechDashboard ? 'My Due Today Work Orders' : 'Due Today';
  }

  get overdueEmptyState(): string {
    return this.isTechDashboard ? 'You have no overdue work orders.' : 'No overdue work orders.';
  }

  get dueTodayEmptyState(): string {
    return this.isTechDashboard ? 'You have no work orders due today.' : 'No work orders due today.';
  }

  hasChartData(data: readonly number[]): boolean {
    return data.some((value) => value > 0);
  }

  openWorkOrder(workOrderId: number | null): void {
    if (!workOrderId) {
      return;
    }

    this.router.navigate(['/workorders', workOrderId]);
  }

  private applyAnalyticsCharts(analytics: DashboardAnalytics): void {
    this.statusChartData = {
      labels: analytics.workOrdersByStatus.map((item) => item.label),
      datasets: [
        {
          ...this.statusChartData.datasets[0],
          data: analytics.workOrdersByStatus.map((item) => item.total)
        }
      ]
    };

    this.priorityChartData = {
      labels: analytics.workOrdersByPriority.map((item) => item.label),
      datasets: [
        {
          ...this.priorityChartData.datasets[0],
          data: analytics.workOrdersByPriority.map((item) => item.total)
        }
      ]
    };

    this.completionTrendChartData = {
      labels: analytics.completionTrend.map((item) => item.label),
      datasets: [
        {
          ...this.completionTrendChartData.datasets[0],
          data: analytics.completionTrend.map((item) => item.total)
        }
      ]
    };
  }

  getStatusColor(key: string): string {
    switch (key) {
      case 'OPEN': return '#ef4444';
      case 'IN_PROGRESS': return '#0ea5e9';
      case 'COMPLETED': return '#22c55e';
      default: return '#6b7280';
    }
  }

  getWorkloadLevel(item: DashboardTechnicianWorkloadItem): 'low' | 'medium' | 'high' {
    if (item.overdueAssignedWorkOrders > 0) {
      return 'high';
    }

    if (item.dueTodayAssignedWorkOrders > 0 || item.totalAssignedWorkOrders >= 5) {
      return 'medium';
    }

    return 'low';
  }

  getWorkloadLabel(item: DashboardTechnicianWorkloadItem): string {
    const level = this.getWorkloadLevel(item);

    switch (level) {
      case 'high':
        return 'High Pressure';
      case 'medium':
        return 'Moderate Load';
      default:
        return 'Balanced';
    }
  }
}
