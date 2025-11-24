import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MATERIAL_IMPORTS } from '../material-imports';
import { MatDialog } from '@angular/material/dialog';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

import { ApiService } from '../core/services/api-service';
import { AssignTechnicianDialogComponent } from './assign-technician-dialog.component';
import { AddWorkOrderDialogComponent } from './add-workorder-dialog.component';

interface WorkOrder {
  id: number;
  clientName: string;
  address: string;
  description: string;
  status: string;
  assignedTechId: number | null;
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

      <button mat-fab color="primary" (click)="openAddDialog()" matTooltip="Create Work Order">
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

      <!-- Priority Filter -->
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

      <!-- Status Filter -->
      <mat-form-field appearance="outline" class="min-w-[160px]">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilters()">
          <mat-option value="">All</mat-option>
          <mat-option value="OPEN">Open</mat-option>
          <mat-option value="ASSIGNED">Assigned</mat-option>
          <mat-option value="IN_PROGRESS">In Progress</mat-option>
          <mat-option value="COMPLETED">Completed</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <mat-card>

      <!-- LOADING BAR -->
      <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>

      <!-- TABLE -->
      <div class="overflow-x-auto">
        <mat-table [dataSource]="dataSource" matSort class="w-full">

          <!-- Client -->
          <ng-container matColumnDef="clientName">
            <mat-header-cell *matHeaderCellDef mat-sort-header="clientName">
              Client
            </mat-header-cell>
            <mat-cell *matCellDef="let w">
              <span class="font-medium">{{ w.clientName }}</span>
            </mat-cell>
          </ng-container>

          <!-- Address -->
          <ng-container matColumnDef="address">
            <mat-header-cell *matHeaderCellDef>
              Address
            </mat-header-cell>
            <mat-cell *matCellDef="let w">
              <span class="text-sm text-gray-700">{{ w.address }}</span>
            </mat-cell>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <mat-header-cell *matHeaderCellDef mat-sort-header="status">
              Status
            </mat-header-cell>
            <mat-cell *matCellDef="let w">
              <span class="badge" [ngClass]="getStatusClass(w.status)">
                {{ w.status | titlecase }}
              </span>
            </mat-cell>
          </ng-container>

          <!-- Scheduled -->
          <ng-container matColumnDef="scheduledDate">
            <mat-header-cell *matHeaderCellDef mat-sort-header="scheduledDate">
              Scheduled
            </mat-header-cell>
            <mat-cell *matCellDef="let w">
              <span class="text-sm text-gray-700">
                {{ w.scheduledDate ? (w.scheduledDate | date : 'MM/dd/yyyy') : '-' }}
              </span>
            </mat-cell>
          </ng-container>

          <!-- Priority -->
          <ng-container matColumnDef="priority">
            <mat-header-cell *matHeaderCellDef mat-sort-header="priority">
              Priority
            </mat-header-cell>
            <mat-cell *matCellDef="let w">
              <span class="badge" [ngClass]="getPriorityClass(w.priority)">
                {{ w.priority || 'N/A' }}
              </span>
            </mat-cell>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
            <mat-cell *matCellDef="let w">
              <button
                mat-icon-button
                color="primary"
                matTooltip="Assign Technician"
                (click)="openAssignDialog(w)">
                <mat-icon>person_add</mat-icon>
              </button>
            </mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
          <mat-row
            *matRowDef="let row; columns: displayedColumns;"
            class="hover-row">
          </mat-row>

        </mat-table>
      </div>

      <!-- EMPTY STATE -->
      <div
        *ngIf="!loading && dataSource.data.length === 0"
        class="flex flex-col items-center justify-center py-10 text-gray-500">
        <mat-icon class="mb-2">inbox</mat-icon>
        <p class="mb-1">No work orders found.</p>
        <p class="text-xs">
          Try adjusting your filters or create a new work order.
        </p>
      </div>

      <!-- PAGINATOR -->
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
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .status-open {
      background: #e3f2fd;
      color: #1565c0;
    }
    .status-assigned {
      background: #ede7f6;
      color: #5e35b1;
    }
    .status-in-progress {
      background: #fff3e0;
      color: #ef6c00;
    }
    .status-completed {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .status-default {
      background: #eceff1;
      color: #455a64;
    }

    .priority-low {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .priority-medium {
      background: #fffde7;
      color: #f9a825;
    }
    .priority-high {
      background: #fff3e0;
      color: #ef6c00;
    }
    .priority-critical {
      background: #ffebee;
      color: #c62828;
    }
    .priority-default {
      background: #eceff1;
      color: #455a64;
    }

    .hover-row:hover {
      background: #f5f5f5;
      cursor: pointer;
    }
  `]
})
export class WorkordersListComponent implements OnInit, AfterViewInit {

  displayedColumns = [
    'clientName',
    'address',
    'status',
    'scheduledDate',
    'priority',
    'actions'
  ];

  dataSource = new MatTableDataSource<WorkOrder>([]);

  // pagination
  page = 0;
  size = 10;
  totalElements = 0;

  // filters
  search = '';
  priorityFilter = '';
  statusFilter = '';

  // sorting
  sortBy: string = 'id,desc';

  // loading
  loading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private api: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadPage(0);
  }

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(sortEvent => {
      const field = sortEvent.active;
      const direction = sortEvent.direction || 'asc';
      this.sortBy = `${field},${direction}`;
      this.loadPage(0);
    });

    this.dataSource.paginator = this.paginator;
  }

loadPage(page: number) {
  this.page = page;
  this.loading = true;

  // Build params safely
  const params: any = {
    page: this.page,
    size: this.size,
    sort: this.sortBy
  };

  // Only include search if non-empty
  if (this.search && this.search.trim() !== '') {
    params.search = this.search.trim();
  }

  // Only include priority if selected
  if (this.priorityFilter) {
    params.priority = this.priorityFilter;
  }

  // Only include status if selected
  if (this.statusFilter) {
    params.status = this.statusFilter;
  }

  this.api.getPageAdvanced<WorkOrder>('workorders', params)
    .subscribe({
      next: res => {
        this.dataSource.data = res.content;
        this.totalElements = res.totalElements;
      },
      error: err => {
        console.error('Failed to load workorders', err);
      },
      complete: () => {
        this.loading = false;
      }
    });
}


  onSearch(evt: any) {
    this.search = evt.target.value;
    this.loadPage(0);
  }

  clearSearch() {
    this.search = '';
    this.loadPage(0);
  }

  applyFilters() {
    this.loadPage(0);
  }

  openAddDialog() {
    const ref = this.dialog.open(AddWorkOrderDialogComponent, { width: '450px' });
    ref.afterClosed().subscribe(r => {
      if (r === 'created') this.loadPage(0);
    });
  }

  openAssignDialog(workorder: WorkOrder) {
    const ref = this.dialog.open(AssignTechnicianDialogComponent, {
      width: '420px',
      data: { workorder }
    });

    ref.afterClosed().subscribe(r => {
      if (r === 'assigned') this.loadPage(0);
    });
  }

  onPageChange(event: any) {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadPage(this.page);
  }

  // ====== UI helpers for badge classes ======
  getStatusClass(status: string | null | undefined): string {
    switch (status) {
      case 'OPEN': return 'status-open';
      case 'ASSIGNED': return 'status-assigned';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'COMPLETED': return 'status-completed';
      default: return 'status-default';
    }
  }

  getPriorityClass(priority: string | null | undefined): string {
    switch (priority) {
      case 'LOW': return 'priority-low';
      case 'MEDIUM': return 'priority-medium';
      case 'HIGH': return 'priority-high';
      case 'CRITICAL': return 'priority-critical';
      default: return 'priority-default';
    }
  }
}
