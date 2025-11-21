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
    <div class="header-row">
      <button mat-fab color="primary" (click)="openAddDialog()">
        <mat-icon>add</mat-icon>
      </button>
    </div>

    <!-- FILTER BAR -->
    <div class="filters flex flex-wrap gap-4 mb-4">
      <!-- Search -->
      <mat-form-field appearance="outline">
        <mat-label>Search</mat-label>
        <input matInput (keyup)="onSearch($event)" placeholder="Search...">
      </mat-form-field>

      <!-- Priority Filter -->
      <mat-form-field appearance="outline">
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
      <mat-form-field appearance="outline">
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
      <mat-table [dataSource]="dataSource" matSort>

        <ng-container matColumnDef="clientName">
          <mat-header-cell *matHeaderCellDef mat-sort-header="clientName">
            Client
          </mat-header-cell>
          <mat-cell *matCellDef="let w">{{ w.clientName }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="address">
          <mat-header-cell *matHeaderCellDef>
            Address
          </mat-header-cell>
          <mat-cell *matCellDef="let w">{{ w.address }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="status">
          <mat-header-cell *matHeaderCellDef mat-sort-header="status">
            Status
          </mat-header-cell>
          <mat-cell *matCellDef="let w">{{ w.status }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="scheduledDate">
          <mat-header-cell *matHeaderCellDef mat-sort-header="scheduledDate">
            Scheduled
          </mat-header-cell>
          <mat-cell *matCellDef="let w">{{ w.scheduledDate || '-' }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="priority">
          <mat-header-cell *matHeaderCellDef mat-sort-header="priority">
            Priority
          </mat-header-cell>
          <mat-cell *matCellDef="let w">{{ w.priority || '-' }}</mat-cell>
        </ng-container>

        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
          <mat-cell *matCellDef="let w">
            <button mat-icon-button color="primary" (click)="openAssignDialog(w)">
              <mat-icon>person_add</mat-icon>
            </button>
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>

      </mat-table>

      <mat-paginator
        [length]="totalElements"
        [pageIndex]="page"
        [pageSize]="size"
        [pageSizeOptions]="[5, 10, 20]"
        (page)="onPageChange($event)">
      </mat-paginator>
    </mat-card>
  `
})
export class WorkordersListComponent implements OnInit, AfterViewInit {

  displayedColumns = ['clientName', 'address', 'status', 'scheduledDate', 'priority', 'actions'];
  dataSource = new MatTableDataSource<WorkOrder>([]);

  page = 0;
  size = 10;
  totalElements = 0;

  search = '';
  priorityFilter = '';
  statusFilter = '';

  sortBy: string = 'id,desc';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private api: ApiService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadPage(0);
  }

  // ✅ ADD SORT EVENT LISTENER HERE
  ngAfterViewInit() {
    this.sort.sortChange.subscribe(sortEvent => {
      const field = sortEvent.active;
      const direction = sortEvent.direction || 'asc';   // fallback
      this.sortBy = `${field},${direction}`;
      this.loadPage(0);
    });
  }

  loadPage(page: number) {
    this.page = page;

    const params = {
      search: this.search || null,
      priority: this.priorityFilter || null,
      status: this.statusFilter || null,
      sort: this.sortBy
    };

    this.api.getPageAdvanced<WorkOrder>('workorders', params)
      .subscribe(res => {
        this.dataSource.data = res.content;
        this.totalElements = res.totalElements;
      });
  }

  onSearch(event: any) {
    this.search = event.target.value;
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
    const ref = this.dialog.open(AssignTechnicianDialogComponent, { width: '420px', data: { workorder }});
    ref.afterClosed().subscribe(r => {
      if (r === 'assigned') this.loadPage(0);
    });
  }

  onPageChange(event: any) {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadPage(this.page);
  }
}
