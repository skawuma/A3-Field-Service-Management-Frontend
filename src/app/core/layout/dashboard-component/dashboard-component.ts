import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Router, RouterLink } from '@angular/router';
import { MATERIAL_IMPORTS } from '../../../material-imports';
import { ApiService } from '../../services/api-service';
import { AuthService } from '../../services/auth-service';
import { NotificationService } from '../../services/notification.service';
import { RealtimeEventMessage, RealtimeEventMetadata } from '../../models/realtime-event.model';
import { RealtimeService } from '../../services/realtime.service';

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
  activeAssigned?: number;
  assignedInProgress?: number;
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

interface DashboardTechnicianSlaPerformance {
  technicianId: number;
  technicianName: string;
  completedCount: number;
  withinSlaCount: number;
  breachedCount: number;
  compliancePercent: number;
  averageCompletionMinutes: number;
}

interface DashboardSlaIntelligence {
  nearBreachCount: number;
  breachedActiveCount: number;
  completedWithinSlaCount: number;
  completedBreachedCount: number;
  averageTimeToAssignMinutes: number | null;
  averageTimeToStartMinutes: number | null;
  averageTimeToCompleteMinutes: number | null;
  technicianPerformance: DashboardTechnicianSlaPerformance[];
}

type SlaMetricTone = 'success' | 'warning' | 'danger' | 'info';

interface SlaCockpitMetric {
  icon: string;
  label: string;
  value: string;
  helper: string;
  meta: string;
  tone: SlaMetricTone;
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

interface LegacyDashboardTechnicianWorkloadItem {
  technicianId: number | null;
  technicianName: string;
  totalAssigned: number;
  openAssigned: number;
  inProgressAssigned: number;
  dueTodayAssigned: number;
  overdueAssigned: number;
}

interface LegacyDashboardTechnicianWorkloadSummary {
  technicianCount: number;
  items: LegacyDashboardTechnicianWorkloadItem[];
}

type DashboardTechnicianWorkloadResponse =
  | DashboardTechnicianWorkloadItem[]
  | LegacyDashboardTechnicianWorkloadItem[]
  | LegacyDashboardTechnicianWorkloadSummary;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, BaseChartDirective, ...MATERIAL_IMPORTS],
  template: `
    <div class="dashboard-page">

      <div class="header-row">
        <div class="header-text">
          <span class="dashboard-eyebrow">{{ dashboardEyebrow }}</span>
          <h1 class="title">Dashboard</h1>
          <p class="subtitle">{{ dashboardSubtitle }}</p>
          <p class="updated-at" *ngIf="lastUpdated">
            Last updated: {{ lastUpdated | date:'medium' }}
          </p>
        </div>

        <div class="header-actions">
          <a mat-stroked-button routerLink="/reports" *ngIf="!isTechDashboard">
            <mat-icon>monitoring</mat-icon>
            View Reports
          </a>
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
            <div class="value">{{ technicianDueTodayCount }}</div>
            <div class="label">{{ dueTodayCardLabel }}</div>
          </mat-card>

          <mat-card class="stat-card overdue mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">schedule</mat-icon>
            </div>
            <div class="value">{{ technicianOverdueCount }}</div>
            <div class="label">{{ overdueCardLabel }}</div>
          </mat-card>

          <mat-card class="stat-card primary mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">assignment_ind</mat-icon>
            </div>
            <div class="value">{{ technicianAssignedActiveCount }}</div>
            <div class="label">My Assigned Active</div>
          </mat-card>

          <mat-card class="stat-card in-progress mat-elevation-z3">
            <div class="card-top">
              <mat-icon class="icon">bolt</mat-icon>
            </div>
            <div class="value">{{ technicianInProgressCount }}</div>
            <div class="label">My In Progress</div>
          </mat-card>
        </div>

        <mat-card class="sla-cockpit-card" *ngIf="showSlaCockpit">
          <div class="sla-cockpit-header">
            <div>
              <span class="panel-eyebrow">SLA metrics</span>
              <h2>{{ slaCockpitTitle }}</h2>
              <p class="panel-subtitle">{{ slaCockpitSubtitle }}</p>
            </div>

            <span class="sla-status-pill" [attr.data-status]="slaHealthStatusTone">
              <mat-icon>{{ slaHealthStatusIcon }}</mat-icon>
              {{ slaHealthStatusLabel }}
            </span>
          </div>

          <div *ngIf="slaIntelligenceLoading" class="panel-loading cockpit-loading">
            <mat-progress-spinner diameter="36" mode="indeterminate"></mat-progress-spinner>
            <span>Loading SLA intelligence…</span>
          </div>

          <div *ngIf="!slaIntelligenceLoading && slaIntelligenceLoadError" class="empty-state inline-error">
            <span class="state-visual"><mat-icon>cloud_off</mat-icon></span>
            <strong>SLA data unavailable</strong>
            <span>Please refresh or check backend service status.</span>
            <button mat-stroked-button type="button" (click)="loadSlaIntelligence()">
              <mat-icon>refresh</mat-icon> Try again
            </button>
          </div>

          <ng-container *ngIf="!slaIntelligenceLoading && !slaIntelligenceLoadError && slaIntelligence">
            <div class="sla-cockpit-grid">
              <section
                class="sla-gauge-card"
                [attr.data-status]="slaHealthStatusTone"
                aria-label="SLA performance gauge"
              >
                <div class="sla-gauge-arc" [style.background]="slaGaugeBackground">
                  <div class="sla-gauge-inner">
                    <span>SLA</span>
                    <strong>{{ slaHealthPercent }}%</strong>
                    <small>Performance</small>
                  </div>
                  <i class="sla-gauge-needle" [style.transform]="slaNeedleRotation"></i>
                </div>

                <div class="sla-gauge-footer">
                  <span class="gauge-pill" [attr.data-status]="slaHealthStatusTone">
                    <mat-icon>{{ slaHealthStatusIcon }}</mat-icon>
                    {{ slaHealthStatusLabel }}
                  </span>
                  <small>{{ slaGaugeCaption }}</small>
                </div>
              </section>

              <section class="sla-metric-stack" aria-label="SLA metric rows">
                <article
                  class="sla-metric-row"
                  *ngFor="let metric of slaCockpitMetrics"
                  [attr.data-tone]="metric.tone"
                >
                  <span class="metric-icon"><mat-icon>{{ metric.icon }}</mat-icon></span>
                  <div class="metric-copy">
                    <strong>{{ metric.label }}</strong>
                    <span>{{ metric.helper }}</span>
                  </div>
                  <div class="metric-value">
                    <strong>{{ metric.value }}</strong>
                    <small>{{ metric.meta }}</small>
                  </div>
                  <span class="metric-sparkline" aria-hidden="true">
                    <i></i><i></i><i></i><i></i><i></i><i></i>
                  </span>
                </article>
              </section>
            </div>

            <section class="technician-sla-board">
              <div class="tech-board-header">
                <div>
                  <span class="panel-eyebrow">Technician visibility</span>
                  <h3>{{ technicianSlaBoardTitle }}</h3>
                </div>
                <p>{{ technicianSlaBoardSubtitle }}</p>
              </div>

              <div *ngIf="slaIntelligence.technicianPerformance.length === 0" class="mini-empty-state">
                No technician SLA completions yet. Completed work orders will appear here once SLA clocks finish.
              </div>

              <div class="tech-sla-grid" *ngIf="slaIntelligence.technicianPerformance.length > 0">
                <article
                  class="tech-sla-card"
                  *ngFor="let item of slaIntelligence.technicianPerformance; trackBy: trackTechnicianSla"
                  [attr.data-tone]="getTechnicianSlaTone(item)"
                >
                  <div class="tech-sla-topline">
                    <span class="tech-avatar">{{ getTechnicianInitials(item.technicianName) }}</span>
                    <div>
                      <strong>{{ item.technicianName }}</strong>
                      <small>{{ getTechnicianSlaStatusLabel(item) }}</small>
                    </div>
                  </div>

                  <div class="tech-compliance-row">
                    <strong>{{ item.compliancePercent | number: '1.0-1' }}%</strong>
                    <span>SLA compliant</span>
                  </div>

                  <div class="tech-progress" aria-hidden="true">
                    <span [style.width.%]="boundedPercent(item.compliancePercent)"></span>
                  </div>

                  <div class="tech-sla-stats">
                    <span><strong>{{ item.completedCount }}</strong> completed</span>
                    <span><strong>{{ item.withinSlaCount }}</strong> within SLA</span>
                    <span><strong>{{ item.breachedCount }}</strong> breached</span>
                    <span><strong>{{ formatDuration(item.averageCompletionMinutes) }}</strong> avg.</span>
                  </div>
                </article>
              </div>
            </section>
          </ng-container>
        </mat-card>

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

            <div *ngIf="!slaLoading && slaLoadError" class="empty-state inline-error">
              <span class="state-visual"><mat-icon>cloud_off</mat-icon></span>
              <strong>SLA data unavailable</strong>
              <span>Please refresh or check backend service status.</span>
              <button mat-stroked-button type="button" (click)="loadSlaSummary()">
                <mat-icon>refresh</mat-icon> Try again
              </button>
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

          <mat-card *ngIf="isTechDashboard" class="panel-card">
            <div class="panel-header">
              <div>
                <h3>{{ recentActivityTitle }}</h3>
                <p class="panel-subtitle">{{ recentActivitySubtitle }}</p>
              </div>
            </div>

            <div *ngIf="activityLoading" class="panel-loading">
              <mat-progress-spinner diameter="32" mode="indeterminate"></mat-progress-spinner>
            </div>

            <div *ngIf="!activityLoading && activityLoadError" class="empty-state">
              Recent activity is temporarily unavailable.
            </div>

            <div *ngIf="!activityLoading && !activityLoadError && recentActivity.length === 0" class="empty-state">
              No recent activity found.
            </div>

            <div *ngIf="!activityLoading && !activityLoadError && recentActivity.length > 0" class="activity-list">
              <div class="activity-item" *ngFor="let item of recentActivity">
                <div class="activity-icon">
                  <mat-icon>{{ getActivityIcon(item.eventType) }}</mat-icon>
                </div>

                <div class="activity-content">
                  <button
                    *ngIf="item.workOrderId; else plainTechActivityTitle"
                    type="button"
                    class="activity-link"
                    (click)="openWorkOrder(item.workOrderId)"
                  >
                    {{ item.title }}
                  </button>
                  <ng-template #plainTechActivityTitle>
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
                  (click)="openTechnicianWorkload(item)"
                  (keyup.enter)="openTechnicianWorkload(item)"
                  tabindex="0"
                  role="button"
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
              <div>
                <h3>{{ recentActivityTitle }}</h3>
                <p class="panel-subtitle">{{ recentActivitySubtitle }}</p>
              </div>
            </div>

            <div *ngIf="activityLoading" class="panel-loading">
              <mat-progress-spinner diameter="32" mode="indeterminate"></mat-progress-spinner>
            </div>

            <div *ngIf="!activityLoading && activityLoadError" class="empty-state">
              Recent activity is temporarily unavailable.
            </div>

            <div *ngIf="!activityLoading && !activityLoadError && recentActivity.length === 0" class="empty-state">
              No recent activity found.
            </div>

            <div *ngIf="!activityLoading && !activityLoadError && recentActivity.length > 0" class="activity-list">
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
      gap: var(--space-6);
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-5);
      flex-wrap: wrap;
      padding: 3px 2px 1px;
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .dashboard-eyebrow {
      color: var(--primary);
      font-size: var(--font-xs);
      font-weight: 800;
      letter-spacing: .1em;
      text-transform: uppercase;
    }

    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .header-actions mat-icon {
      margin-right: 5px;
    }

    .title {
      margin: 0;
      font-size: clamp(1.85rem, 3vw, 2.45rem);
      font-weight: 800;
      color: var(--text-strong);
      letter-spacing: -.035em;
      line-height: 1.12;
    }

    .subtitle {
      margin: 0;
      font-size: .95rem;
      color: var(--text-muted);
    }

    .updated-at {
      margin: 0;
      font-size: 12px;
      color: var(--text-faint);
    }

    .grid-container {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    }

    .stat-card {
      --tone: var(--primary);
      --tone-soft: var(--primary-soft);
      min-height: 132px;
      padding: 17px 18px;
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: var(--surface);
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .stat-card::after { content: ''; position: absolute; top: 0; right: 0; left: 0; height: 3px; background: var(--tone); opacity: .85; }

    .stat-card:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, var(--tone) 25%, var(--border));
      box-shadow: var(--shadow-md);
    }

    .card-top {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 11px;
    }

    .icon {
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border-radius: 11px;
      color: var(--tone);
      background: var(--tone-soft);
      font-size: 20px;
    }

    .value {
      color: var(--text-strong);
      font-size: 1.65rem;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 6px;
    }

    .label {
      color: var(--text-muted);
      font-size: .77rem;
      font-weight: 600;
    }

    .details-grid {
      display: grid;
      gap: var(--space-5);
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }

    .analytics-grid {
      display: grid;
      gap: var(--space-5);
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    }

    .panel-card {
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
      box-shadow: var(--shadow-sm);
      background: var(--surface);
    }

    .workload-panel {
      display: flex;
      flex-direction: column;
    }

    .chart-card {
      min-height: 370px;
    }

    .panel-header h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 750;
      color: var(--text-strong);
      letter-spacing: -.015em;
    }

    .panel-subtitle {
      margin: 4px 0 0;
      font-size: .75rem;
      color: var(--text-muted);
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
      border-bottom: 1px solid var(--border);
      font-size: .8rem;
      color: var(--text);
    }

    .snapshot-item:last-child {
      border-bottom: none;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      min-height: 300px;
      align-items: center;
    }

    .state-card {
      border-radius: var(--radius-lg);
      padding: 22px;
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
      color: var(--danger);
    }

    .state-title {
      font-weight: 600;
      color: var(--text-strong);
    }

    .state-subtitle {
      font-size: 14px;
      color: var(--text-muted);
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
      flex-direction: column;
      gap: 6px;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--text-muted);
      font-size: .8rem;
      padding: 22px;
    }

    .inline-error { min-height: 240px; border: 1px dashed #fecaca; border-radius: var(--radius-md); background: linear-gradient(180deg, #fff, var(--danger-soft)); }
    .inline-error .state-visual { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 14px; color: var(--danger); background: #fff; box-shadow: var(--shadow-sm); }
    .inline-error strong { color: var(--text-strong); font-size: .9rem; }
    .inline-error button { margin-top: 8px; }
    .inline-error button mat-icon { margin-right: 5px; }

    .compact-empty-state {
      min-height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      color: var(--text-muted);
      font-size: .8rem;
    }

    .chart-wrapper {
      position: relative;
      height: 280px;
      margin-top: 18px;
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
      border-bottom: 1px solid var(--border);
    }

    .activity-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .activity-icon mat-icon {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border-radius: 10px;
      color: var(--primary);
      background: var(--primary-soft);
      font-size: 18px;
      margin-top: 2px;
    }

    .activity-content {
      flex: 1;
    }

    .activity-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-strong);
    }

    .activity-link {
      border: none;
      background: none;
      padding: 0;
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      color: var(--primary);
      cursor: pointer;
      text-align: left;
    }

    .activity-link:hover {
      text-decoration: underline;
    }

    .activity-description {
      font-size: 14px;
      color: var(--text);
      margin-top: 2px;
    }

    .activity-meta {
      font-size: 12px;
      color: var(--text-faint);
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
      padding: 7px 11px;
      border-radius: 999px;
      font-size: .72rem;
      font-weight: 750;
    }

    .overdue-badge {
      background: var(--danger-soft);
      color: var(--danger);
    }

    .due-badge {
      background: var(--primary-soft);
      color: var(--primary-hover);
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
      color: var(--text-strong);
    }

    .sla-item {
      padding: 12px 0;
      border-bottom: 1px solid var(--border);
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
      color: var(--primary);
      cursor: pointer;
      text-align: left;
    }

    .sla-link-button:hover {
      text-decoration: underline;
    }

    .sla-item-meta {
      margin-top: 4px;
      font-size: 13px;
      color: var(--text);
    }

    .sla-item-submeta {
      margin-top: 4px;
      font-size: 12px;
      color: var(--text-faint);
    }

    .mini-empty-state {
      color: var(--text-muted);
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
      background: var(--success-soft);
      color: var(--success);
    }

    .legend-item.medium {
      background: var(--warning-soft);
      color: var(--warning);
    }

    .legend-item.high {
      background: var(--danger-soft);
      color: var(--danger);
    }

    .heatmap-grid {
      margin-top: 16px;
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      align-items: stretch;
    }

    .heatmap-tile {
      --load-tone: var(--success);
      --load-soft: var(--success-soft);
      border-radius: var(--radius-md);
      padding: 16px;
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      min-height: 206px;
      box-sizing: border-box;
      cursor: pointer;
      text-align: left;
    }

    .heatmap-tile:hover {
      transform: translateY(-2px);
      border-color: color-mix(in srgb, var(--load-tone) 28%, var(--border));
      box-shadow: var(--shadow-sm);
    }

    .heatmap-tile.low {
      --load-tone: var(--success);
      --load-soft: var(--success-soft);
      background: linear-gradient(180deg, var(--surface), var(--load-soft));
    }

    .heatmap-tile.medium {
      --load-tone: var(--warning);
      --load-soft: var(--warning-soft);
      background: linear-gradient(180deg, var(--surface), var(--load-soft));
    }

    .heatmap-tile.high {
      --load-tone: var(--danger);
      --load-soft: var(--danger-soft);
      background: linear-gradient(180deg, var(--surface), var(--load-soft));
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
      color: var(--text-strong);
    }

    .heatmap-level {
      font-size: 12px;
      font-weight: 700;
      border-radius: 999px;
      padding: 4px 10px;
      background: rgba(255,255,255,.8);
      color: var(--load-tone);
      white-space: nowrap;
    }

    .heatmap-total {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-strong);
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
      border: 1px solid rgba(226, 232, 240, .9);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .heatmap-metric span {
      font-size: 12px;
      color: var(--text-muted);
    }

    .heatmap-metric strong {
      font-size: 18px;
      color: var(--text-strong);
    }

    .stat-card.primary { --tone: var(--primary); --tone-soft: var(--primary-soft); }
    .stat-card.accent { --tone: #7c3aed; --tone-soft: #f1eafe; }
    .stat-card.warn, .stat-card.overdue { --tone: var(--danger); --tone-soft: var(--danger-soft); }
    .stat-card.in-progress { --tone: #0284c7; --tone-soft: var(--info-soft); }
    .stat-card.unassigned { --tone: #64748b; --tone-soft: #eef2f6; }
    .stat-card.today, .stat-card.completed { --tone: var(--success); --tone-soft: var(--success-soft); }
    .stat-card.sla-due { --tone: #0e7490; --tone-soft: #e6f7fa; }
    .stat-card.urgent { --tone: var(--warning); --tone-soft: var(--warning-soft); }

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
      .sla-cockpit-grid,
      .sla-columns,
      .heatmap-grid {
        grid-template-columns: 1fr;
      }

      .sla-cockpit-card {
        padding: 17px;
      }

      .sla-cockpit-header,
      .tech-board-header {
        flex-direction: column;
      }

      .sla-metric-row {
        grid-template-columns: auto minmax(0, 1fr);
      }

      .metric-value {
        justify-items: start;
        text-align: left;
      }

      .metric-sparkline {
        display: none;
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
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  summary: DashboardSummary | null = null;
  analytics: DashboardAnalytics | null = null;
  technicianWorkload: DashboardTechnicianWorkloadItem[] = [];
  loading = true;
  loadError = false;
  lastUpdated: Date | null = null;
  recentActivity: DashboardRecentActivityItem[] = [];
  activityLoading = false;
  activityLoadError = false;
  analyticsLoading = false;
  analyticsLoadError = false;
  workloadLoading = false;
  workloadLoadError = false;

  readonly statusChartType: 'pie' = 'pie';
  readonly priorityChartType: 'bar' = 'bar';
  readonly completionTrendChartType: 'line' = 'line';

  slaSummary: DashboardSlaSummary | null = null;
  slaIntelligence: DashboardSlaIntelligence | null = null;
  slaLoading = false;
  slaLoadError = false;
  slaIntelligenceLoading = false;
  slaIntelligenceLoadError = false;

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
    private router: Router,
    private realtime: RealtimeService
  ) {}

  ngOnInit(): void {
    this.bindRealtime();
    this.refreshDashboard();
  }

  ngOnDestroy(): void {}

  refreshDashboard(): void {
    this.recentActivity = [];
    this.activityLoadError = false;

    if (this.isTechDashboard) {
      this.analytics = null;
      this.technicianWorkload = [];
      this.analyticsLoading = false;
      this.analyticsLoadError = false;
      this.workloadLoading = false;
      this.workloadLoadError = false;
      this.loadSummary(true);
      this.loadRecentActivity();
      this.loadSlaSummary();
      this.loadSlaIntelligence();
      return;
    }

    this.loadSummary(true);
    this.loadRecentActivity();
    this.loadAnalytics();
    this.loadTechnicianWorkload();
    this.loadSlaSummary();
    this.loadSlaIntelligence();
  }

  private bindRealtime(): void {
    this.realtime.dashboardEvents$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.handleRealtimeDashboardEvent(event));

    this.realtime.alertEvents$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.handleRealtimeAlertEvent(event));
  }

  loadRecentActivity(): void {
    this.activityLoading = true;
    this.activityLoadError = false;

    this.api.get<DashboardRecentActivityItem[]>('dashboard/recent-activity').subscribe({
      next: (res) => {
        this.recentActivity = res ?? [];
        this.activityLoading = false;
      },
      error: () => {
        this.activityLoading = false;
        this.activityLoadError = true;
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
      error: (error: HttpErrorResponse) => {
        this.slaLoading = false;
        this.slaLoadError = true;
        this.logDashboardApiError('SLA summary', error);

        if (asPrimaryLoad) {
          this.loading = false;
          this.loadError = true;
        }
      }
    });
  }

  loadSlaIntelligence(): void {
    this.slaIntelligenceLoading = true;
    this.slaIntelligenceLoadError = false;

    this.api.get<DashboardSlaIntelligence>('dashboard/sla-intelligence').subscribe({
      next: (res) => {
        this.slaIntelligence = res;
        this.slaIntelligenceLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.slaIntelligence = null;
        this.slaIntelligenceLoading = false;
        this.slaIntelligenceLoadError = true;
        this.logDashboardApiError('SLA intelligence', error);
      }
    });
  }

  private logDashboardApiError(resource: string, error: HttpErrorResponse): void {
    console.error(`[Dashboard] ${resource} request failed`, {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message
    });
  }

  formatDuration(value: number | null | undefined): string {
    if (value == null) return 'Pending';
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  private durationTone(
    value: number | null | undefined,
    warningThresholdMinutes: number,
    dangerThresholdMinutes: number
  ): SlaMetricTone {
    if (value == null) {
      return 'info';
    }

    if (value >= dangerThresholdMinutes) {
      return 'danger';
    }

    return value >= warningThresholdMinutes ? 'warning' : 'success';
  }

  private percentTone(value: number | null): SlaMetricTone {
    if (value == null) {
      return 'info';
    }

    if (value >= 90) {
      return 'success';
    }

    return value >= 75 ? 'warning' : 'danger';
  }

  private formatPercent(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
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

    this.api.get<DashboardTechnicianWorkloadResponse>('dashboard/technician-workload').subscribe({
      next: (res) => {
        this.technicianWorkload = this.normalizeTechnicianWorkload(res);
        this.workloadLoading = false;
      },
      error: () => {
        this.workloadLoading = false;
        this.workloadLoadError = true;
        this.notify.error('Failed to load technician workload');
      }
    });
  }

  loadSummary(asPrimaryLoad = false): void {
    if (asPrimaryLoad) {
      this.loading = true;
      this.loadError = false;
    }

    this.api.get<DashboardSummary>('dashboard/summary').subscribe({
      next: (res) => {
        this.summary = res;
        this.lastUpdated = new Date();

        if (asPrimaryLoad) {
          this.loading = false;
        }
      },
      error: () => {
        if (asPrimaryLoad) {
          this.loading = false;
          this.loadError = true;
        }

        this.notify.error('Failed to load dashboard data');
      }
    });
  }

  private handleRealtimeDashboardEvent(event: RealtimeEventMessage): void {
    if (!event?.type) {
      return;
    }

    switch (event.type) {
      case 'WORK_ORDER_ASSIGNED':
        this.applyWorkOrderAssignedEvent(event);
        break;

      case 'WORK_ORDER_COMPLETED':
        this.applyWorkOrderCompletedEvent(event);
        break;

      case 'WORK_ORDER_STATUS_CHANGED':
        this.applyWorkOrderStatusChangedEvent(event);
        break;

      case 'WORK_ORDER_CREATED':
        this.applyWorkOrderCreatedEvent(event);
        break;

      default:
        break;
    }

    this.lastUpdated = new Date();
  }

  private handleRealtimeAlertEvent(event: RealtimeEventMessage): void {
    if (!event?.type) {
      return;
    }

    if (event.type === 'SLA_NEAR_BREACH') {
      this.loadSlaIntelligence();
      const message = this.toNonBlankString(event.metadata?.activityDescription)
        ?? this.toNonBlankString(event.message)
        ?? `${this.resolveRealtimeWorkOrderRef(event)} is near its SLA deadline`;
      this.notify.warn(message);
      return;
    }

    if (event.type === 'SLA_BREACHED') {
      if (event.metadata?.overdueDays != null) {
        this.applySlaBreachedEvent(event);
      }
      this.loadSlaIntelligence();
      this.lastUpdated = new Date();

      const metadata = this.getRealtimeMetadata(event);
      const overdueDays = Number(metadata.overdueDays ?? 0);
      const workOrderRef = this.resolveRealtimeWorkOrderRef(event);
      const alertMessage = this.toNonBlankString(metadata.activityDescription)
        ?? this.toNonBlankString(event.message)
        ?? `${workOrderRef} breached SLA${overdueDays > 0 ? ` (${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue)` : ''}`;

      this.notify.error(alertMessage);
    }
  }

  private applyWorkOrderAssignedEvent(event: RealtimeEventMessage): void {
    const metadata = this.getRealtimeMetadata(event);
    const previousTechnicianId = this.toNullableNumber(metadata.previousTechnicianId);
    const previousStatus = this.toNonBlankString(metadata.previousStatus);
    const isNewAssignment = previousTechnicianId == null;

    if (this.summary) {
      this.summary = {
        ...this.summary,
        openWorkOrders: previousStatus === 'OPEN'
          ? Math.max(0, (this.summary.openWorkOrders ?? 0) - 1)
          : (this.summary.openWorkOrders ?? 0),
        unassignedWorkOrders: isNewAssignment
          ? Math.max(0, (this.summary.unassignedWorkOrders ?? 0) - 1)
          : (this.summary.unassignedWorkOrders ?? 0),
        activeAssigned: isNewAssignment
          ? (this.summary.activeAssigned ?? 0) + 1
          : (this.summary.activeAssigned ?? 0)
      };
    }

    if (!this.isTechDashboard) {
      this.updateTechnicianWorkloadForAssignment(event.technicianId ?? null, previousTechnicianId);

      if (previousStatus === 'OPEN') {
        this.decrementStatusChartBucket('OPEN');
        this.incrementStatusChartBucket('ASSIGNED');
      }
    }

    this.prependRealtimeActivity(
      this.buildRealtimeActivityItem(
        event,
        'ASSIGNED_TECHNICIAN',
        'Technician assigned',
        `${this.resolveRealtimeWorkOrderRef(event)} assigned`
      )
    );
  }

  private applyWorkOrderCompletedEvent(event: RealtimeEventMessage): void {
    if (this.summary) {
      this.summary = {
        ...this.summary,
        inProgressWorkOrders: Math.max(0, (this.summary.inProgressWorkOrders ?? 0) - 1),
        completedToday: (this.summary.completedToday ?? 0) + 1,
        activeAssigned: Math.max(0, (this.summary.activeAssigned ?? 0) - 1),
        assignedInProgress: Math.max(0, (this.summary.assignedInProgress ?? 0) - 1)
      };
    }

    if (!this.isTechDashboard) {
      this.updateTechnicianWorkloadForCompletion(event.technicianId ?? null);
      this.incrementCompletionTrendToday();
      this.decrementStatusChartBucket('IN_PROGRESS');
      this.incrementStatusChartBucket('COMPLETED');
    }

    this.removeSlaItemByWorkOrderId(event.workOrderId ?? null);

    this.prependRealtimeActivity(
      this.buildRealtimeActivityItem(
        event,
        'COMPLETED',
        'Work order completed',
        `${this.resolveRealtimeWorkOrderRef(event)} completed and signed`
      )
    );
  }

  private applyWorkOrderStatusChangedEvent(event: RealtimeEventMessage): void {
    const eventKey = String(event.metadata?.['eventKey'] ?? '');

    switch (eventKey) {
      case 'start':
      case 'start_travel':
      case 'arrive_onsite':
      case 'start_work': {
        const previousStatus = this.toNonBlankString(event.metadata?.['previousStatus']);
        const nextStatus = this.toNonBlankString(event.metadata?.['newStatus']) ?? event.status;
        const executionStatuses = ['EN_ROUTE', 'ARRIVED', 'WORK_STARTED', 'IN_PROGRESS'];
        const enteredExecution = !executionStatuses.includes(previousStatus ?? '')
          && executionStatuses.includes(nextStatus ?? '');

        if (this.summary && enteredExecution) {
          this.summary = {
            ...this.summary,
            inProgressWorkOrders: (this.summary.inProgressWorkOrders ?? 0) + 1,
            assignedInProgress: (this.summary.assignedInProgress ?? 0) + 1
          };
        }

        if (!this.isTechDashboard) {
          if (enteredExecution) {
            this.updateTechnicianWorkloadForStart(event.technicianId ?? null);
          }
          if (previousStatus) this.decrementStatusChartBucket(previousStatus);
          if (nextStatus) this.incrementStatusChartBucket(nextStatus);
        }

        this.prependRealtimeActivity(
          this.buildRealtimeActivityItem(
            event,
            eventKey === 'start_travel' ? 'TRAVEL_STARTED' : eventKey === 'arrive_onsite' ? 'ARRIVED_ONSITE' : 'WORK_STARTED',
            this.toNonBlankString(event.metadata?.['activityTitle']) ?? 'Work order updated',
            this.toNonBlankString(event.metadata?.['activityDescription']) ?? `${this.resolveRealtimeWorkOrderRef(event)} status updated`
          )
        );
        break;
      }

      case 'returned_to_open':
      case 'reopened':
        if (this.summary) {
          this.summary = {
            ...this.summary,
            openWorkOrders: (this.summary.openWorkOrders ?? 0) + 1,
            unassignedWorkOrders: (this.summary.unassignedWorkOrders ?? 0) + 1,
            inProgressWorkOrders: Math.max(0, (this.summary.inProgressWorkOrders ?? 0) - 1),
            activeAssigned: Math.max(0, (this.summary.activeAssigned ?? 0) - 1),
            assignedInProgress: Math.max(0, (this.summary.assignedInProgress ?? 0) - 1)
          };
        }

        if (!this.isTechDashboard) {
          const previousTechId = this.toNullableNumber(event.metadata?.['previousTechnicianId']);
          this.updateTechnicianWorkloadForReturnToOpen(previousTechId);
          this.incrementStatusChartBucket('OPEN');

          if (eventKey === 'reopened') {
            this.decrementStatusChartBucket('COMPLETED');
          }
        }

        this.prependRealtimeActivity(
          this.buildRealtimeActivityItem(
            event,
            eventKey === 'reopened' ? 'REOPENED' : 'UNASSIGNED_TECHNICIAN',
            eventKey === 'reopened' ? 'Work order reopened' : 'Returned for reassignment',
            eventKey === 'reopened'
              ? `${this.resolveRealtimeWorkOrderRef(event)} reopened for dispatch`
              : `${this.resolveRealtimeWorkOrderRef(event)} returned to Open for reassignment`
          )
        );
        break;

      case 'completion_report':
        this.notify.success(
          this.toNonBlankString(this.getRealtimeMetadata(event).activityDescription)
            ?? this.toNonBlankString(event.message)
            ?? `Structured completion submitted for ${this.resolveRealtimeWorkOrderRef(event)}`
        );
        break;

      default:
        break;
    }
  }

  private applyWorkOrderCreatedEvent(event: RealtimeEventMessage): void {
    if (this.summary) {
      this.summary = {
        ...this.summary,
        totalWorkOrders: (this.summary.totalWorkOrders ?? 0) + 1,
        openWorkOrders: (this.summary.openWorkOrders ?? 0) + 1
      };
    }

    if (!this.isTechDashboard) {
      this.incrementStatusChartBucket('OPEN');
    }

    this.prependRealtimeActivity({
      workOrderId: event.workOrderId ?? null,
      eventType: 'CREATED',
      title: 'Work order created',
      description: `WO-${event.workOrderId ?? 'N/A'} created`,
      actor: 'SYSTEM',
      createdAt: event.timestamp ?? new Date().toISOString()
    });
  }

  private applySlaBreachedEvent(event: RealtimeEventMessage): void {
    const workOrderId = event.workOrderId ?? null;
    const overdueDays = Number(event.metadata?.['overdueDays'] ?? 0);

    if (this.summary) {
      this.summary = {
        ...this.summary,
        overdueWorkOrders: (this.summary.overdueWorkOrders ?? 0) + 1
      };
    }

    if (!this.slaSummary || workOrderId == null) {
      return;
    }

    const exists = this.slaSummary.overdueItems.some(item => item.workOrderId === workOrderId);
    if (exists) {
      return;
    }

    const newItem = this.buildRealtimeSlaItem(event, overdueDays);

    this.slaSummary = {
      ...this.slaSummary,
      overdueCount: (this.slaSummary.overdueCount ?? 0) + 1,
      overdueItems: [newItem, ...this.slaSummary.overdueItems].slice(0, 5)
    };
  }

  private prependRealtimeActivity(item: DashboardRecentActivityItem): void {
    this.recentActivity = [item, ...this.recentActivity].slice(0, 10);
  }

  private removeSlaItemByWorkOrderId(workOrderId: number | null): void {
    if (!this.slaSummary || workOrderId == null) {
      return;
    }

    const overdueItems = this.slaSummary.overdueItems.filter(item => item.workOrderId !== workOrderId);
    const dueTodayItems = this.slaSummary.dueTodayItems.filter(item => item.workOrderId !== workOrderId);

    this.slaSummary = {
      ...this.slaSummary,
      overdueCount: overdueItems.length,
      dueTodayCount: dueTodayItems.length,
      overdueItems,
      dueTodayItems
    };
  }

  private getRealtimeMetadata(event: RealtimeEventMessage): RealtimeEventMetadata {
    return event.metadata ?? {};
  }

  private buildRealtimeActivityItem(
    event: RealtimeEventMessage,
    eventType: string,
    fallbackTitle: string,
    fallbackDescription: string
  ): DashboardRecentActivityItem {
    const metadata = this.getRealtimeMetadata(event);

    return {
      workOrderId: event.workOrderId ?? null,
      eventType,
      title: this.toNonBlankString(metadata.activityTitle) ?? fallbackTitle,
      description: this.toNonBlankString(metadata.activityDescription)
        ?? this.toNonBlankString(event.message)
        ?? fallbackDescription,
      actor: 'SYSTEM',
      createdAt: event.timestamp ?? new Date().toISOString()
    };
  }

  private buildRealtimeSlaItem(
    event: RealtimeEventMessage,
    overdueDays: number
  ): DashboardSlaWorkOrderItem {
    const metadata = this.getRealtimeMetadata(event);
    const workOrderId = event.workOrderId ?? null;

    return {
      workOrderId,
      workOrderRef: this.resolveRealtimeWorkOrderRef(event),
      title: this.toNonBlankString(metadata.title) ?? 'No description',
      customerName: this.toNonBlankString(metadata.clientName)
        ?? this.toNonBlankString(metadata.customerName)
        ?? 'Unknown customer',
      scheduledDate: this.toNonBlankString(metadata.scheduledDate)
        ?? event.timestamp
        ?? new Date().toISOString(),
      status: this.toNonBlankString(event.status)
        ?? this.toNonBlankString(metadata.newStatus)
        ?? 'UNKNOWN',
      priority: this.toNonBlankString(metadata.priority) ?? 'UNSPECIFIED',
      assignedTechId: this.toNullableNumber(metadata.assignedTechId ?? event.technicianId),
      assignedTechName: this.toNonBlankString(metadata.assignedTechName),
      daysLate: overdueDays
    };
  }

  private resolveRealtimeWorkOrderRef(event: RealtimeEventMessage): string {
    return this.toNonBlankString(this.getRealtimeMetadata(event).workOrderRef)
      ?? (event.workOrderId != null ? `WO-${event.workOrderId}` : 'Work order');
  }

  private toNonBlankString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private toNullableNumber(value: unknown): number | null {
    if (value == null) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private incrementStatusChartBucket(key: string): void {
    const index = this.analytics?.workOrdersByStatus.findIndex(item => item.key === key) ?? -1;
    if (index < 0) {
      return;
    }

    const labels = [...(this.statusChartData.labels ?? [])];
    const data = [...this.statusChartData.datasets[0].data];
    data[index] = Number(data[index] ?? 0) + 1;

    this.statusChartData = {
      labels,
      datasets: [{ ...this.statusChartData.datasets[0], data }]
    };
  }

  private decrementStatusChartBucket(key: string): void {
    const index = this.analytics?.workOrdersByStatus.findIndex(item => item.key === key) ?? -1;
    if (index < 0) {
      return;
    }

    const labels = [...(this.statusChartData.labels ?? [])];
    const data = [...this.statusChartData.datasets[0].data];
    data[index] = Math.max(0, Number(data[index] ?? 0) - 1);

    this.statusChartData = {
      labels,
      datasets: [{ ...this.statusChartData.datasets[0], data }]
    };
  }

  private incrementCompletionTrendToday(): void {
    const labels = [...(this.completionTrendChartData.labels ?? [])];
    const data = [...this.completionTrendChartData.datasets[0].data];

    if (data.length === 0) {
      return;
    }

    const todayIndex = data.length - 1;
    data[todayIndex] = Number(data[todayIndex] ?? 0) + 1;

    this.completionTrendChartData = {
      labels,
      datasets: [{ ...this.completionTrendChartData.datasets[0], data }]
    };
  }

  private updateTechnicianWorkloadForAssignment(
    technicianId: number | null,
    previousTechnicianId: number | null
  ): void {
    if (technicianId == null) {
      return;
    }

    this.technicianWorkload = this.technicianWorkload.map(item =>
      item.technicianId === technicianId && previousTechnicianId !== technicianId
        ? {
            ...item,
            totalAssignedWorkOrders: item.totalAssignedWorkOrders + 1,
            openAssignedWorkOrders: item.openAssignedWorkOrders + 1
          }
        : item.technicianId === previousTechnicianId && previousTechnicianId !== technicianId
          ? {
              ...item,
              openAssignedWorkOrders: Math.max(0, item.openAssignedWorkOrders - 1),
              totalAssignedWorkOrders: Math.max(0, item.totalAssignedWorkOrders - 1)
            }
          : item
    );
  }

  private updateTechnicianWorkloadForStart(technicianId: number | null): void {
    if (technicianId == null) {
      return;
    }

    this.technicianWorkload = this.technicianWorkload.map(item =>
      item.technicianId === technicianId
        ? {
            ...item,
            openAssignedWorkOrders: Math.max(0, item.openAssignedWorkOrders - 1),
            inProgressAssignedWorkOrders: item.inProgressAssignedWorkOrders + 1
          }
        : item
    );
  }

  private updateTechnicianWorkloadForCompletion(technicianId: number | null): void {
    if (technicianId == null) {
      return;
    }

    this.technicianWorkload = this.technicianWorkload.map(item =>
      item.technicianId === technicianId
        ? {
            ...item,
            totalAssignedWorkOrders: Math.max(0, item.totalAssignedWorkOrders - 1),
            inProgressAssignedWorkOrders: Math.max(0, item.inProgressAssignedWorkOrders - 1),
            dueTodayAssignedWorkOrders: Math.max(0, item.dueTodayAssignedWorkOrders - 1),
            overdueAssignedWorkOrders: Math.max(0, item.overdueAssignedWorkOrders - 1)
          }
        : item
    );
  }

  private updateTechnicianWorkloadForReturnToOpen(previousTechnicianId: number | null): void {
    if (previousTechnicianId == null) {
      return;
    }

    this.technicianWorkload = this.technicianWorkload.map(item =>
      item.technicianId === previousTechnicianId
        ? {
            ...item,
            totalAssignedWorkOrders: Math.max(0, item.totalAssignedWorkOrders - 1),
            openAssignedWorkOrders: Math.max(0, item.openAssignedWorkOrders - 1),
            inProgressAssignedWorkOrders: Math.max(0, item.inProgressAssignedWorkOrders - 1),
            dueTodayAssignedWorkOrders: Math.max(0, item.dueTodayAssignedWorkOrders - 1),
            overdueAssignedWorkOrders: Math.max(0, item.overdueAssignedWorkOrders - 1)
          }
        : item
    );
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
    return this.loading
      || this.activityLoading
      || this.analyticsLoading
      || this.workloadLoading
      || this.slaLoading
      || this.slaIntelligenceLoading;
  }

  get isTechDashboard(): boolean {
    return this.auth.isTech();
  }

  get dashboardSubtitle(): string {
    if (this.isTechDashboard) {
      return 'Your assigned workload, due work orders, and recent activity';
    }

    if (this.auth.isDispatch()) {
      return 'Dispatch view of workload pressure, SLA risk, and field activity';
    }

    return 'Operational view of technicians, workload, and service performance';
  }

  get dashboardEyebrow(): string {
    if (this.isTechDashboard) {
      return 'My field workspace';
    }
    return this.auth.isDispatch() ? 'Dispatch command center' : 'Administration overview';
  }

  get showSlaCockpit(): boolean {
    return this.slaIntelligenceLoading || this.slaIntelligenceLoadError || this.slaIntelligence !== null;
  }

  get slaCockpitTitle(): string {
    return this.isTechDashboard ? 'My SLA Metrics' : 'SLA Metrics';
  }

  get slaCockpitSubtitle(): string {
    return this.isTechDashboard
      ? 'Response, embark, and completion clocks across your assigned work'
      : 'Response, resolution, compliance, and technician SLA visibility for dispatch decisions';
  }

  get slaCompletionTotal(): number {
    if (!this.slaIntelligence) {
      return 0;
    }

    return this.slaIntelligence.completedWithinSlaCount + this.slaIntelligence.completedBreachedCount;
  }

  get slaCompliancePercent(): number | null {
    const total = this.slaCompletionTotal;

    if (!this.slaIntelligence || total === 0) {
      return null;
    }

    return Math.round((this.slaIntelligence.completedWithinSlaCount / total) * 1000) / 10;
  }

  get slaHealthPercent(): number {
    const compliance = this.slaCompliancePercent ?? 100;
    const activeBreachPenalty = Math.min(42, (this.slaIntelligence?.breachedActiveCount ?? 0) * 12);
    const nearBreachPenalty = Math.min(18, (this.slaIntelligence?.nearBreachCount ?? 0) * 5);
    const overduePenalty = Math.min(18, (this.slaSummary?.overdueCount ?? 0) * 2);

    return this.boundedPercent(Math.round(compliance - activeBreachPenalty - nearBreachPenalty - overduePenalty));
  }

  get slaHealthStatusTone(): SlaMetricTone {
    if (this.slaHealthPercent >= 85) {
      return 'success';
    }

    return this.slaHealthPercent >= 65 ? 'warning' : 'danger';
  }

  get slaHealthStatusLabel(): string {
    switch (this.slaHealthStatusTone) {
      case 'success':
        return 'On track';
      case 'warning':
        return 'Needs watch';
      default:
        return 'At risk';
    }
  }

  get slaHealthStatusIcon(): string {
    switch (this.slaHealthStatusTone) {
      case 'success':
        return 'verified';
      case 'warning':
        return 'radar';
      default:
        return 'report_problem';
    }
  }

  get slaGaugeBackground(): string {
    const score = this.slaHealthPercent;
    const color = this.slaHealthStatusTone === 'success'
      ? '#22c55e'
      : this.slaHealthStatusTone === 'warning'
        ? '#f59e0b'
        : '#ef4444';

    return `conic-gradient(from 225deg, ${color} 0 ${score}%, rgba(148, 210, 255, .16) ${score}% 100%)`;
  }

  get slaNeedleRotation(): string {
    const degrees = -132 + (this.slaHealthPercent * 2.64);
    return `rotate(${degrees}deg)`;
  }

  get slaGaugeCaption(): string {
    if (!this.slaIntelligence) {
      return 'SLA clocks are waiting for live service data.';
    }

    if (this.slaCompletionTotal === 0) {
      return 'No completed SLA samples yet; active risk is still monitored.';
    }

    const completedLabel = `${this.slaIntelligence.completedWithinSlaCount}/${this.slaCompletionTotal} completed within SLA`;
    const breachLabel = `${this.slaIntelligence.breachedActiveCount} active breach${this.slaIntelligence.breachedActiveCount === 1 ? '' : 'es'}`;
    return `${completedLabel}; ${breachLabel}.`;
  }

  get slaCockpitMetrics(): SlaCockpitMetric[] {
    if (!this.slaIntelligence) {
      return [];
    }

    const total = this.slaCompletionTotal;
    const compliance = this.slaCompliancePercent;

    return [
      {
        icon: 'assignment_turned_in',
        label: 'Response time',
        value: this.formatDuration(this.slaIntelligence.averageTimeToAssignMinutes),
        helper: 'Average created-to-assigned dispatch clock',
        meta: 'Dispatch',
        tone: this.durationTone(this.slaIntelligence.averageTimeToAssignMinutes, 60, 240)
      },
      {
        icon: 'departure_board',
        label: 'Embark time',
        value: this.formatDuration(this.slaIntelligence.averageTimeToStartMinutes),
        helper: 'Average assignment-to-travel/start clock',
        meta: 'Field start',
        tone: this.durationTone(this.slaIntelligence.averageTimeToStartMinutes, 90, 300)
      },
      {
        icon: 'verified',
        label: 'SLA compliance',
        value: compliance == null ? 'No data' : `${this.formatPercent(compliance)}%`,
        helper: total === 0
          ? 'Awaiting completed SLA samples'
          : `${this.slaIntelligence.completedWithinSlaCount}/${total} completed within SLA`,
        meta: 'Completed',
        tone: this.percentTone(compliance)
      },
      {
        icon: 'warning',
        label: 'Active risk',
        value: `${this.slaIntelligence.breachedActiveCount}`,
        helper: `${this.slaIntelligence.nearBreachCount} near breach in the next SLA window`,
        meta: 'Live queue',
        tone: this.activeRiskTone
      },
      {
        icon: 'timer',
        label: 'Resolution time',
        value: this.formatDuration(this.slaIntelligence.averageTimeToCompleteMinutes),
        helper: 'Average execution completion duration',
        meta: 'Resolution',
        tone: this.durationTone(this.slaIntelligence.averageTimeToCompleteMinutes, 480, 1440)
      }
    ];
  }

  get activeRiskTone(): SlaMetricTone {
    if ((this.slaIntelligence?.breachedActiveCount ?? 0) > 0) {
      return 'danger';
    }

    return (this.slaIntelligence?.nearBreachCount ?? 0) > 0 ? 'warning' : 'success';
  }

  get technicianSlaBoardTitle(): string {
    return this.isTechDashboard ? 'My SLA scorecard' : 'Technician SLA scorecard';
  }

  get technicianSlaBoardSubtitle(): string {
    return this.isTechDashboard
      ? 'Your completed work-order SLA outcomes in one portfolio-ready card.'
      : 'Ranked completion, breach, and average resolution visibility for admin and dispatch.';
  }

  boundedPercent(value: number | null | undefined): number {
    if (value == null || Number.isNaN(value)) {
      return 0;
    }

    return Math.max(0, Math.min(100, value));
  }

  getTechnicianSlaTone(item: DashboardTechnicianSlaPerformance): SlaMetricTone {
    if (item.compliancePercent >= 90) {
      return 'success';
    }

    return item.compliancePercent >= 75 ? 'warning' : 'danger';
  }

  getTechnicianSlaStatusLabel(item: DashboardTechnicianSlaPerformance): string {
    switch (this.getTechnicianSlaTone(item)) {
      case 'success':
        return 'Reliable SLA performer';
      case 'warning':
        return 'Watch response windows';
      default:
        return 'Needs SLA attention';
    }
  }

  getTechnicianInitials(name: string | null | undefined): string {
    if (!name?.trim()) {
      return 'T';
    }

    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }

  trackTechnicianSla(_index: number, item: DashboardTechnicianSlaPerformance): number {
    return item.technicianId;
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
      ? 'Your overdue and due-today assigned work orders requiring attention'
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

  get technicianDueTodayCount(): number {
    return this.summary?.dueTodayWorkOrders ?? this.slaSummary?.dueTodayCount ?? 0;
  }

  get technicianOverdueCount(): number {
    return this.summary?.overdueWorkOrders ?? this.slaSummary?.overdueCount ?? 0;
  }

  get technicianAssignedActiveCount(): number {
    return this.summary?.activeAssigned ?? 0;
  }

  get technicianInProgressCount(): number {
    return this.summary?.assignedInProgress ?? 0;
  }

  get recentActivityTitle(): string {
    return this.isTechDashboard ? 'My Recent Activity' : 'Recent Activity';
  }

  get recentActivitySubtitle(): string {
    return this.isTechDashboard
      ? 'Updates across your assigned work orders'
      : 'Latest work order activity across the team';
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

  openTechnicianWorkload(item: DashboardTechnicianWorkloadItem): void {
    if (!item.technicianId) {
      return;
    }

    this.router.navigate(['/workorders'], {
      queryParams: {
        technicianId: item.technicianId,
        technicianName: item.technicianName
      }
    });
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

  private normalizeTechnicianWorkload(
    response: DashboardTechnicianWorkloadResponse | null | undefined
  ): DashboardTechnicianWorkloadItem[] {
    const items = Array.isArray(response) ? response : response?.items ?? [];

    return items.map((item) => this.normalizeTechnicianWorkloadItem(item));
  }

  private normalizeTechnicianWorkloadItem(
    item: DashboardTechnicianWorkloadItem | LegacyDashboardTechnicianWorkloadItem
  ): DashboardTechnicianWorkloadItem {
    if ('totalAssignedWorkOrders' in item) {
      return item;
    }

    return {
      technicianId: item.technicianId,
      technicianName: item.technicianName,
      totalAssignedWorkOrders: item.totalAssigned,
      openAssignedWorkOrders: item.openAssigned,
      inProgressAssignedWorkOrders: item.inProgressAssigned,
      dueTodayAssignedWorkOrders: item.dueTodayAssigned,
      overdueAssignedWorkOrders: item.overdueAssigned
    };
  }
}
