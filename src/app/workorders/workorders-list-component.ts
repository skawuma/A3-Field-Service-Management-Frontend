import { AfterViewInit, Component, DestroyRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MATERIAL_IMPORTS } from '../material-imports';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { ApiService } from '../core/services/api-service';
import { AssignTechnicianDialogComponent } from './assign-technician-dialog.component';
import { AddWorkOrderDialogComponent } from './add-workorder-dialog.component';
import { AuthService } from '../core/services/auth-service';
import { ActivatedRoute, Router } from '@angular/router';
import { RealtimeEventMessage } from '../core/models/realtime-event.model';
import { RealtimeService } from '../core/services/realtime.service';
import { NotificationService } from '../core/services/notification.service';
import { WorkorderTimelineDialogComponent } from './workorder-timeline-dialog.component';
import { EditWorkOrderDialogComponent } from './workorder-edit-dialog.component';

interface WorkOrder {
  id: number;
  clientName: string;
  address: string;
  description: string;
  status: string;
  assignedTechId: number | null;
  assignedTechnicianName?: string | null;
  scheduledDate: string | null;
  priority: string | null;
}

@Component({
  selector: 'app-workorders-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="page-header">
      <div>
        <span class="page-eyebrow">Field operations</span>
        <h2>Work Orders</h2>
        <p>Manage, assign and track every service visit from intake to completion.</p>
      </div>

      <button
        mat-raised-button
        color="primary"
        (click)="openAddDialog()"
        *ngIf="!isTech">
        <mat-icon>add</mat-icon>
        New Work Order
      </button>
    </div>

    <div class="filters">
      <div class="filter-heading">
        <span class="filter-icon"><mat-icon>tune</mat-icon></span>
        <div><strong>Filter work orders</strong><span>Narrow the operational queue</span></div>
      </div>
      <div class="filter-fields">

      <!-- Search -->
      <mat-form-field appearance="outline" class="min-w-[220px]">
        <mat-label>Search</mat-label>
        <input
          matInput
          (keyup)="onSearch($event)"
          placeholder="Search by client, address, description..." />
        <button mat-icon-button *ngIf="search" matSuffix (click)="clearSearch()" aria-label="Clear">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>

      <!-- 🔥 TECH sees no filters -->
      <ng-container *ngIf="!isTech">

        <mat-form-field appearance="outline" class="min-w-[160px]">
          <mat-label>Priority</mat-label>
          <mat-select [(ngModel)]="priorityFilter" (selectionChange)="applyFilters()">
            <mat-option value="">All</mat-option>
            <mat-option value="LOW">Low</mat-option>
            <mat-option value="MEDIUM">Medium</mat-option>
            <mat-option value="HIGH">High</mat-option>
            <mat-option value="CRITICAL">Critical</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="min-w-[160px]">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilters()">
            <mat-option value="">All</mat-option>
            <mat-option value="OPEN">Open</mat-option>
            <mat-option value="ASSIGNED">Assigned</mat-option>
            <mat-option value="EN_ROUTE">En Route</mat-option>
            <mat-option value="ARRIVED">Arrived</mat-option>
            <mat-option value="WORK_STARTED">Work Started</mat-option>
            <mat-option value="IN_PROGRESS">In Progress</mat-option>
            <mat-option value="COMPLETED">Completed</mat-option>
            <mat-option value="CANCELLED">Cancelled</mat-option>
          </mat-select>
        </mat-form-field>

      </ng-container>
      </div>
    </div>

    <mat-card *ngIf="!isTech && technicianIdFilter" class="mb-4">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div class="text-sm font-semibold text-gray-900">Workload Filter Active</div>
          <div class="text-sm text-gray-500">
            Showing work orders for {{ technicianNameFilter || ('Technician #' + technicianIdFilter) }}
          </div>
        </div>

        <button mat-stroked-button color="primary" (click)="clearDashboardFilter()">
          Clear Filter
        </button>
      </div>
    </mat-card>

    <mat-card class="table-card">
      <div class="table-heading">
        <div><span>Work queue</span><strong>{{ totalElements }} work order{{ totalElements === 1 ? '' : 's' }}</strong></div>
        <span class="live-indicator"><i></i> Live updates</span>
      </div>
      <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>

      <div *ngIf="!loading && loadError" class="table-state error-state">
        <span><mat-icon>cloud_off</mat-icon></span>
        <strong>Unable to load work orders</strong>
        <p>The service queue could not be reached. Try again in a moment.</p>
        <button mat-stroked-button type="button" (click)="loadPage(page)"><mat-icon>refresh</mat-icon> Retry</button>
      </div>

      <!-- TABLE -->
      <div class="overflow-x-auto" *ngIf="!loadError && (loading || dataSource.data.length)">
        <mat-table [dataSource]="dataSource" matSort class="w-full">

          <!-- Client -->
          <ng-container matColumnDef="clientName">
            <mat-header-cell *matHeaderCellDef mat-sort-header="clientName">Client</mat-header-cell>
            <mat-cell *matCellDef="let w">
              <span class="order-primary"><strong>{{ w.clientName }}</strong><small>#{{ w.id }} · {{ w.description || 'No description' }}</small></span>
            </mat-cell>
          </ng-container>

          <!-- Address -->
          <ng-container matColumnDef="address">
            <mat-header-cell *matHeaderCellDef>Address</mat-header-cell>
            <mat-cell *matCellDef="let w">{{ w.address }}</mat-cell>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
            <mat-cell *matCellDef="let w">
              <span class="badge" [ngClass]="getStatusClass(w.status)">{{ w.status }}</span>
            </mat-cell>
          </ng-container>

          <!-- Priority -->
          <ng-container matColumnDef="priority">
            <mat-header-cell *matHeaderCellDef>Priority</mat-header-cell>
            <mat-cell *matCellDef="let w">
              <span class="badge" [ngClass]="getPriorityClass(w.priority)">{{ w.priority }}</span>
            </mat-cell>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>

            <mat-cell *matCellDef="let w" class="flex gap-2 items-center">

              <!-- 🔥 VIEW DETAILS -->
              <button
                mat-icon-button
                matTooltip="View Details"
                (click)="openDetail(w); $event.stopPropagation()">
                <mat-icon>visibility</mat-icon>
              </button>

              <!-- 🔥 Only Admin / Dispatch -->
              <button
                *ngIf="!isTech"
                mat-icon-button
                matTooltip="Assign Technician"
                (click)="openAssignDialog(w); $event.stopPropagation()">
                <mat-icon>person_add</mat-icon>
              </button>
              <!-- TIMELINE -->

               
<button
*ngIf="!isTech"
  mat-icon-button
  matTooltip="Timeline"
  (click)="openTimeline(w); $event.stopPropagation()" >
  <mat-icon>history</mat-icon>
</button>

            </mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>

          <!-- ENTIRE ROW CLICKABLE -->
      <mat-row
  *matRowDef="let row; columns: displayedColumns"
  class="hover-row"
  [class.updated-row]="recentlyUpdatedWorkOrderId === row.id"
  (click)="openDetail(row)"
  matRipple>
</mat-row>

        </mat-table>
      </div>

      <div *ngIf="!loading && !loadError && dataSource.data.length === 0" class="table-state empty-state">
        <span><mat-icon>assignment</mat-icon></span>
        <strong>No work orders found</strong>
        <p>{{ search || priorityFilter || statusFilter ? 'Adjust your search or filters to see more results.' : 'New work orders will appear here when they are created.' }}</p>
        <button *ngIf="!isTech && !search && !priorityFilter && !statusFilter" mat-raised-button color="primary" type="button" (click)="openAddDialog()"><mat-icon>add</mat-icon> Create work order</button>
      </div>

      <mat-paginator
        *ngIf="!loadError && totalElements > 0"
        [length]="totalElements"
        [pageIndex]="page"
        [pageSize]="size"
        [pageSizeOptions]="[5, 10, 20]"
        (page)="onPageChange($event)">
      </mat-paginator>

    </mat-card>
  `,

  styles: [`
    :host { display: block; }
    .flex { display: flex; }
    .flex-wrap { flex-wrap: wrap; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-4 { gap: 16px; }
    .mb-4 { margin-bottom: 20px; }
    .min-w\\[220px\\] { min-width: 220px; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-5); margin-bottom: var(--space-5); }
    .page-eyebrow { color: var(--primary); font-size: var(--font-xs); font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
    h2 { margin: 4px 0 6px; color: var(--text-strong); font-size: clamp(1.85rem, 3vw, 2.35rem); line-height: 1.12; letter-spacing: -.04em; }
    h2 + p { margin: 0; color: var(--text-muted); }
    .page-header button mat-icon { margin-right: 6px; }
    .filters { display: flex; align-items: center; justify-content: space-between; gap: var(--space-5); margin-bottom: var(--space-5); padding: 16px 18px 0; border: 1px solid var(--border); border-radius: var(--radius-lg); background: linear-gradient(105deg, var(--surface), #f8fbff); box-shadow: var(--shadow-sm); }
    .filter-heading { display: flex; align-items: center; gap: 11px; flex: 0 0 auto; padding-bottom: 16px; }
    .filter-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 11px; color: var(--primary); background: var(--primary-soft); }
    .filter-heading div { display: grid; gap: 2px; }
    .filter-heading strong { color: var(--text-strong); font-size: .8rem; }
    .filter-heading div span { color: var(--text-muted); font-size: .68rem; }
    .filter-fields { display: flex; justify-content: flex-end; gap: 10px; flex: 1; }
    .filters mat-form-field { flex: 1 1 170px; max-width: 270px; }
    mat-card { border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
    .table-heading { min-height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 15px 18px; border-bottom: 1px solid var(--border); }
    .table-heading > div { display: grid; gap: 2px; }
    .table-heading > div span { color: var(--primary); font-size: .63rem; font-weight: 800; letter-spacing: .09em; text-transform: uppercase; }
    .table-heading strong { color: var(--text-strong); font-size: .9rem; }
    .live-indicator { display: flex; align-items: center; gap: 7px; color: var(--text-muted); font-size: .68rem; font-weight: 700; }
    .live-indicator i { width: 7px; height: 7px; border-radius: 50%; background: var(--success); box-shadow: 0 0 0 4px var(--success-soft); }
    mat-card > div.flex { padding: 16px 18px; }
    .overflow-x-auto { overflow-x: auto; }
    .table-wrapper { overflow-x: auto; }
    mat-header-row { min-height: 48px; background: var(--surface-muted); }
    mat-header-cell { color: var(--text-muted); font-size: 11px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
    mat-row { min-height: 58px; border-color: var(--border); }
    mat-cell { color: var(--text); font-size: 13px; }
    .order-primary { min-width: 190px; display: grid; gap: 3px; }
    .order-primary strong { color: var(--text-strong); font-size: .8rem; }
    .order-primary small { max-width: 245px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .badge { display: inline-flex; padding: 4px 8px; border-radius: 999px; font-size: 10px; font-weight: 800; }
    .status-open, .status-assigned { color: #1d4ed8; background: #dbeafe; }
    .status-en-route, .status-arrived, .status-work-started, .status-in-progress { color: #b45309; background: var(--warning-soft); }
    .status-completed { color: var(--success); background: var(--success-soft); }
    .status-cancelled { color: #475569; background: #e2e8f0; }
    .priority-high, .priority-critical { color: var(--danger); background: var(--danger-soft); }
    .priority-medium { color: #b45309; background: var(--warning-soft); }
    .priority-low { color: var(--success); background: var(--success-soft); }
    .table-state { min-height: 270px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 28px; text-align: center; color: var(--text-muted); }
    .table-state > span { width: 50px; height: 50px; display: grid; place-items: center; margin-bottom: 7px; border-radius: 15px; color: var(--primary); background: var(--primary-soft); }
    .table-state strong { color: var(--text-strong); font-size: .92rem; }
    .table-state p { max-width: 430px; margin: 0 0 8px; font-size: .78rem; }
    .table-state button mat-icon { margin-right: 5px; }
    .error-state > span { color: var(--danger); background: var(--danger-soft); }
    .hover-row {
      cursor: pointer;
    }
.updated-row {
  animation: realtimeFlash 1.2s ease;
}

@keyframes realtimeFlash {
  0% {
    background: #dcfce7;
  }
  100% {
    background: transparent;
  }
}

    .hover-row:hover {
      background: #f8fbff;
    }

    @media (max-width: 760px) {
      h2 { font-size: 1.7rem; }
      .page-header, .filters { align-items: stretch; flex-direction: column; }
      .filter-heading { padding-bottom: 0; }
      .filter-fields { justify-content: stretch; flex-wrap: wrap; }
      .filters mat-form-field { max-width: none; }
      .mat-column-address { display: none; }
      mat-cell, mat-header-cell { padding: 0 10px; }
    }

    @media (max-width: 540px) {
      .mat-column-priority { display: none; }
      .flex.items-center.justify-between { align-items: flex-start; }
      .page-header button { width: 100%; }
    }
  `]
})
export class WorkordersListComponent implements OnInit, AfterViewInit, OnDestroy {

  isTech = false;
  role = '';

  displayedColumns = ['clientName', 'address', 'status', 'priority', 'actions'];

  dataSource = new MatTableDataSource<WorkOrder>([]);

  page = 0;
  size = 10;
  totalElements = 0;

  search = '';
  priorityFilter = '';
  statusFilter = '';
  technicianIdFilter: number | null = null;
  technicianNameFilter = '';

  sortBy = 'id,desc';
  loading = false;
  loadError = false;
  realtimeSub?: Subscription;
  private readonly destroyRef = inject(DestroyRef);
recentlyUpdatedWorkOrderId: number | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private auth: AuthService,
    private realtime: RealtimeService,
    private route: ActivatedRoute,
    private router: Router,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.role = this.auth.getRole() || '';
    this.isTech = this.role === 'TECH';
    this.bindRealtime();

    this.route.queryParamMap.subscribe(params => {
      if (!this.isTech) {
        const technicianId = params.get('technicianId');
        this.technicianIdFilter = technicianId ? Number(technicianId) : null;
        this.technicianNameFilter = params.get('technicianName') ?? '';
      }

      this.loadPage(0);
    });
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(s => {
      this.sortBy = `${s.active},${s.direction || 'asc'}`;
      this.loadPage(0);
    });
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy() {
    if (this.realtimeSub) {
      this.realtimeSub.unsubscribe();
      this.realtimeSub = undefined;
    }
  }

  openDetail(w: WorkOrder) {
    this.router.navigate(['/workorders', w.id]);
  }

  openTimeline(w: WorkOrder) {
  this.dialog.open(WorkorderTimelineDialogComponent, {
    width: '600px',
    data: { workorder: w }
  });
}

openEditDialog(w: WorkOrder) {
  const ref = this.dialog.open(EditWorkOrderDialogComponent, {
    width: '650px',
    data: { workorder: w }
  });

  ref.afterClosed().subscribe(result => {
    if (result === 'updated') {
      this.loadPage(this.page); // refresh list
    }
  });
}

  loadPage(page: number) {
    this.page = page;
    this.loading = true;
    this.loadError = false;

    const params: any = { page: this.page, size: this.size, sort: this.sortBy };

    if (this.isTech) {
      params.technicianId = this.auth.getUserId();
    } else {
      if (this.search) params.search = this.search;
      if (this.priorityFilter) params.priority = this.priorityFilter;
      if (this.statusFilter) params.status = this.statusFilter;
      if (this.technicianIdFilter) params.technicianId = this.technicianIdFilter;
    }

    this.api.getPageAdvanced<WorkOrder>('workorders', params).subscribe({
      next: res => {
        this.dataSource.data = res.content;
        this.totalElements = res.totalElements;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
        this.showError('Failed to load work orders.');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // private bindRealtime() {
  //   this.realtimeSub = this.realtime.dashboardEvents$.subscribe((event) => {
  //     if (!this.shouldRefreshForRealtimeEvent(event)) {
  //       return;
  //     }

  //     this.loadPage(this.page);
  //   });
  // }

  private shouldRefreshForRealtimeEvent(event: RealtimeEventMessage): boolean {
    if (!event?.type || this.loading) {
      return false;
    }

    if (event.type === 'WORK_ORDER_CREATED'
      || event.type === 'WORK_ORDER_ASSIGNED'
      || event.type === 'WORK_ORDER_COMPLETED') {
      return true;
    }

    if (event.type !== 'WORK_ORDER_STATUS_CHANGED') {
      return false;
    }

    const eventKey = String(event.metadata?.eventKey ?? '');
    return eventKey === 'start'
      || eventKey === 'start_travel'
      || eventKey === 'arrive_onsite'
      || eventKey === 'start_work'
      || eventKey === 'returned_to_open'
      || eventKey === 'reopened';
  }

  onSearch(e: any) {
    this.search = e.target.value;
    this.loadPage(0);
  }

  clearSearch() {
    this.search = '';
    this.loadPage(0);
  }

  clearDashboardFilter() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        technicianId: null,
        technicianName: null
      },
      queryParamsHandling: 'merge'
    });
  }

  applyFilters() {
    this.loadPage(0);
  }

  openAddDialog() {
    if (this.isTech) return;
    const ref = this.dialog.open(AddWorkOrderDialogComponent, { width: '450px' });
    ref.afterClosed().subscribe(v => v === 'created' && this.loadPage(0));
  }

  openAssignDialog(w: WorkOrder) {
    if (this.isTech) return;
    const ref = this.dialog.open(AssignTechnicianDialogComponent, { width: '420px', data: { workorder: w } });
    ref.afterClosed().subscribe(v => v === 'assigned' && this.loadPage(0));
  }

  onPageChange(e: any) {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.loadPage(this.page);
  }

  getStatusClass(s: string) {
    const map: any = {
      OPEN: 'status-open',
      ASSIGNED: 'status-assigned',
      EN_ROUTE: 'status-in-progress',
      ARRIVED: 'status-in-progress',
      WORK_STARTED: 'status-in-progress',
      IN_PROGRESS: 'status-in-progress',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled'
    };
    return map[s] || 'status-default';
  }

  getPriorityClass(p: string | null) {
    const map: any = {
      LOW: 'priority-low',
      MEDIUM: 'priority-medium',
      HIGH: 'priority-high',
      CRITICAL: 'priority-critical'
    };
    return map[p || ''] || 'priority-default';
  }

private bindRealtime(): void {
  this.realtime.dashboardEvents$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(event => this.applyWorkOrderRealtimeUpdate(event));

  this.realtime.alertEvents$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(event => this.applySlaRealtimeUpdate(event));
}

private applyWorkOrderRealtimeUpdate(event: RealtimeEventMessage): void {
  if (!event?.workOrderId) {
    return;
  }

  switch (event.type) {
    case 'WORK_ORDER_CREATED':
      this.upsertWorkOrderFromRealtime(event);
      this.showInfo(event.metadata?.activityDescription ?? 'Work order created');
      break;

    case 'WORK_ORDER_ASSIGNED':
      this.upsertWorkOrderFromRealtime(event);
      this.showInfo(event.metadata?.activityDescription ?? 'Work order assigned');
      break;

    case 'WORK_ORDER_COMPLETED':
    case 'WORK_ORDER_STATUS_CHANGED':
      this.updateExistingWorkOrderFromRealtime(event);
      this.showInfo(event.metadata?.activityDescription ?? 'Work order updated');
      break;

    default:
      return;
  }

  this.markRecentlyUpdated(event.workOrderId);
}

private applySlaRealtimeUpdate(event: RealtimeEventMessage): void {
  if (!event || (event.type !== 'SLA_BREACHED' && event.type !== 'SLA_NEAR_BREACH') || !event.workOrderId) {
    return;
  }

  this.updateExistingWorkOrderFromRealtime(event);

  const ref = event.metadata?.workOrderRef ?? `WO-${event.workOrderId}`;

  if (event.type === 'SLA_NEAR_BREACH') {
    this.showInfo(`${ref} is near its SLA deadline.`);
  } else {
    const breachMinutes = Number(event.metadata?.breachMinutes ?? 0);
    this.showError(`${ref} breached SLA${breachMinutes > 0 ? ` by ${breachMinutes} minutes` : ''}.`);
  }

  this.markRecentlyUpdated(event.workOrderId);
}

private upsertWorkOrderFromRealtime(event: RealtimeEventMessage): void {
  const incoming = this.toWorkOrderFromRealtime(event);
  const exists = this.dataSource.data.some(w => w.id === incoming.id);

  if (exists) {
    this.dataSource.data = this.dataSource.data.map(w =>
      w.id === incoming.id ? { ...w, ...incoming } : w
    );
    return;
  }

  this.dataSource.data = [incoming, ...this.dataSource.data];
  this.totalElements += 1;
}

private updateExistingWorkOrderFromRealtime(event: RealtimeEventMessage): void {
  const exists = this.dataSource.data.some(w => w.id === event.workOrderId);

  if (!exists) {
    return;
  }

  this.dataSource.data = this.dataSource.data.map(w => {
    if (w.id !== event.workOrderId) {
      return w;
    }

    return {
      ...w,
      status: event.status ?? event.metadata?.newStatus ?? w.status,
      assignedTechId: event.metadata?.assignedTechId ?? event.technicianId ?? w.assignedTechId,
      assignedTechnicianName: event.metadata?.assignedTechName ?? w.assignedTechnicianName,
      clientName: event.metadata?.clientName ?? event.metadata?.customerName ?? w.clientName,
      description: event.metadata?.description ?? event.metadata?.title ?? w.description,
      scheduledDate: event.metadata?.scheduledDate ?? w.scheduledDate,
      priority: event.metadata?.priority ?? w.priority
    };
  });
}

private toWorkOrderFromRealtime(event: RealtimeEventMessage): WorkOrder {
  return {
    id: event.workOrderId!,
    clientName: event.metadata?.clientName ?? event.metadata?.customerName ?? 'Unknown customer',
    address: '',
    description: event.metadata?.description ?? event.metadata?.title ?? 'No description',
    status: event.status ?? event.metadata?.newStatus ?? 'OPEN',
    assignedTechId: event.metadata?.assignedTechId ?? event.technicianId ?? null,
    assignedTechnicianName: event.metadata?.assignedTechName ?? null,
    scheduledDate: event.metadata?.scheduledDate ?? null,
    priority: event.metadata?.priority ?? 'UNSPECIFIED'
  };
}

private markRecentlyUpdated(workOrderId: number): void {
  this.recentlyUpdatedWorkOrderId = workOrderId;

  window.setTimeout(() => {
    if (this.recentlyUpdatedWorkOrderId === workOrderId) {
      this.recentlyUpdatedWorkOrderId = null;
    }
  }, 1400);
}

private showInfo(message: string): void {
  this.notify.info(message);
}






  private showError(message: string) {
    this.notify.error(message);
  }
}
