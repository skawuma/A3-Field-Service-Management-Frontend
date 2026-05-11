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
    <!-- HEADER -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-xl font-semibold">Work Orders</h2>
        <p class="text-sm text-gray-500">
          Manage, assign and track field work orders.
        </p>
      </div>

      <!-- 🔥 DISABLE FOR TECH -->
      <button
        mat-fab
        color="primary"
        (click)="openAddDialog()"
        *ngIf="!isTech"
        matTooltip="Create Work Order">
        <mat-icon>add</mat-icon>
      </button>
    </div>

    <!-- FILTER BAR -->
    <div class="filters flex flex-wrap gap-4 mb-4 items-center">

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
            <mat-option value="IN_PROGRESS">In Progress</mat-option>
            <mat-option value="COMPLETED">Completed</mat-option>
            <mat-option value="CANCELLED">Cancelled</mat-option>
          </mat-select>
        </mat-form-field>

      </ng-container>

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

    <mat-card>
      <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <mat-table [dataSource]="dataSource" matSort class="w-full">

          <!-- Client -->
          <ng-container matColumnDef="clientName">
            <mat-header-cell *matHeaderCellDef mat-sort-header="clientName">Client</mat-header-cell>
            <mat-cell *matCellDef="let w">{{ w.clientName }}</mat-cell>
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
                (click)="openDetail(w)">
                <mat-icon>visibility</mat-icon>
              </button>

              <!-- 🔥 Only Admin / Dispatch -->
              <button
                *ngIf="!isTech"
                mat-icon-button
                matTooltip="Assign Technician"
                (click)="openAssignDialog(w)">
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

      <mat-paginator
        [length]="totalElements"
        [pageIndex]="page"
        [pageSize]="size"
        [pageSizeOptions]="[5, 10, 20]"
        (page)="onPageChange($event)">
      </mat-paginator>

    </mat-card>
  `,

  styles: [`
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
      background: #f5f5f5;
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
  if (!event || event.type !== 'SLA_BREACHED' || !event.workOrderId) {
    return;
  }

  this.updateExistingWorkOrderFromRealtime(event);

  const overdueDays = Number(event.metadata?.overdueDays ?? 0);
  const ref = event.metadata?.workOrderRef ?? `WO-${event.workOrderId}`;

  this.showError(
    `${ref} is overdue${overdueDays > 0 ? ` by ${overdueDays} day${overdueDays === 1 ? '' : 's'}` : ''}.`
  );

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
