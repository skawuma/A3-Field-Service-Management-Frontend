import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../material-imports';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ApiService, PageResponse } from '../core/services/api-service';
import { AddTechnicianDialogComponent } from './add-technician-dialog.component';
import { EditTechnicianDialogComponent } from './edit-technician-dialog.component';

interface Technician {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  certifications: string;
  status: string;
}

@Component({
  selector: 'app-technicians-list',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_IMPORTS],
  template: `
    <!-- HEADER -->
    <div class="header-row">
      <div>
        <h2 class="title">Technicians</h2>
        <p class="subtitle">Manage field technicians and contact information.</p>
      </div>

      <button
        mat-fab
        color="primary"
        (click)="openAddDialog()"
        matTooltip="Add Technician">
        <mat-icon>add</mat-icon>
      </button>
    </div>

    <!-- SEARCH BAR -->
    <mat-form-field appearance="outline" class="search-bar">
      <mat-label>Search technicians</mat-label>
      <input
        matInput
        (input)="applyFilter($event)"
        placeholder="Search by name, email, phone or certs..." />
      <button
        *ngIf="searchValue"
        mat-icon-button
        matSuffix
        aria-label="Clear"
        (click)="clearFilter()">
        <mat-icon>close</mat-icon>
      </button>
      <mat-icon matSuffix *ngIf="!searchValue">search</mat-icon>
    </mat-form-field>

    <mat-card>

      <!-- LOADING BAR -->
      <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>

      <!-- TABLE -->
      <div class="table-wrapper">
        <mat-table [dataSource]="dataSource" matSort>

          <!-- Name -->
          <ng-container matColumnDef="name">
            <mat-header-cell *matHeaderCellDef mat-sort-header="lastName">
              Name
            </mat-header-cell>
            <mat-cell *matCellDef="let t">
              <span class="font-medium">{{ t.firstName }} {{ t.lastName }}</span>
            </mat-cell>
          </ng-container>

          <!-- Phone -->
          <ng-container matColumnDef="phone">
            <mat-header-cell *matHeaderCellDef>Phone</mat-header-cell>
            <mat-cell *matCellDef="let t">
              <span class="text-sm text-gray-700">{{ t.phone }}</span>
            </mat-cell>
          </ng-container>

          <!-- Email -->
          <ng-container matColumnDef="email">
            <mat-header-cell *matHeaderCellDef>Email</mat-header-cell>
            <mat-cell *matCellDef="let t">
              <span class="text-sm text-gray-700">{{ t.email }}</span>
            </mat-cell>
          </ng-container>

          <!-- Certifications -->
          <ng-container matColumnDef="certifications">
            <mat-header-cell *matHeaderCellDef>Certifications</mat-header-cell>
            <mat-cell *matCellDef="let t">
              <span class="text-sm text-gray-700">
                {{ t.certifications || '-' }}
              </span>
            </mat-cell>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
            <mat-cell *matCellDef="let t">
              <span class="badge" [ngClass]="getStatusClass(t.status)">
                {{ t.status | titlecase }}
              </span>
            </mat-cell>
          </ng-container>

          <!-- Actions -->
<ng-container matColumnDef="actions">
  <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
  <mat-cell *matCellDef="let t">
    <button
      mat-icon-button
      color="primary"
      matTooltip="Edit technician"
      (click)="openEditDialog(t)">
      <mat-icon>edit</mat-icon>
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
        class="empty-state">
        <mat-icon class="mb-2">engineering</mat-icon>
        <p class="mb-1">No technicians found.</p>
        <p class="text-xs">Try adjusting your search or add a new technician.</p>
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
    .header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .title {
      font-size: 22px;
      font-weight: 600;
      margin: 0;
    }

    .subtitle {
      margin: 0;
      font-size: 13px;
      color: #6b7280;
    }

    .search-bar {
      width: 320px;
      max-width: 100%;
      margin-bottom: 16px;
    }

    mat-card {
      padding: 0;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    mat-header-cell, mat-cell {
      padding: 8px 16px;
    }

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

    .status-active {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-inactive {
      background: #ffebee;
      color: #c62828;
    }

    .hover-row:hover {
      background: #f5f5f5;
      cursor: pointer;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      color: #6b7280;
    }

    .mb-1 { margin-bottom: 4px; }
    .mb-2 { margin-bottom: 8px; }
    .text-xs { font-size: 11px; }
    .text-sm { font-size: 13px; }
    .text-gray-700 { color: #374151; }
    .font-medium { font-weight: 500; }
  `]
})
export class TechniciansListComponent implements OnInit, AfterViewInit {
displayedColumns: string[] = ['name', 'phone', 'email', 'certifications', 'status', 'actions'];

  dataSource = new MatTableDataSource<Technician>([]);

  page = 0;
  size = 10;
  totalElements = 0;

  // backend sort (matches TechnicianService getPage signature: sort = "field,direction")
  sortBy: string = 'lastName,asc';

  // UI state
  loading = false;
  searchValue = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private api: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadPage();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;

    // client-side filter across fields on the current page
    this.dataSource.filterPredicate = (data: Technician, filter: string) => {
      const value = filter.trim().toLowerCase();
      return (
        data.firstName.toLowerCase().includes(value) ||
        data.lastName.toLowerCase().includes(value) ||
        (data.email?.toLowerCase().includes(value) ?? false) ||
        (data.phone?.toLowerCase().includes(value) ?? false) ||
        (data.certifications?.toLowerCase().includes(value) ?? false)
      );
    };

    // backend sorting via sortBy, consistent with WorkOrders
    this.sort.sortChange.subscribe(sortEvent => {
      const field = sortEvent.active === 'name' ? 'lastName' : sortEvent.active;
      const direction = sortEvent.direction || 'asc';
      this.sortBy = `${field},${direction}`;
      this.page = 0; // reset to first page when sorting changes
      this.loadPage();
    });
  }

  loadPage() {
    this.loading = true;

    this.api.getPage<Technician>('technicians', this.page, this.size, this.sortBy)
      .subscribe({
        next: (res: PageResponse<Technician>) => {
          this.dataSource.data = res.content;
          this.page = res.page;
          this.size = res.size;
          this.totalElements = res.totalElements;
        },
        error: err => {
          console.error('Failed to load technicians', err);
        },
        complete: () => {
          this.loading = false;
        }
      });
  }



  openEditDialog(technician: Technician) {
  const ref = this.dialog.open(EditTechnicianDialogComponent, {
    width: '460px',
    data: { technician }
  });

  ref.afterClosed().subscribe(result => {
    if (result === 'updated' || result === 'deleted') {
      this.page = 0;
      this.loadPage();
    }
  });
}

  onPageChange(event: any) {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadPage();
  }

  applyFilter(event: any) {
    const value = event.target.value || '';
    this.searchValue = value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  clearFilter() {
    this.searchValue = '';
    this.dataSource.filter = '';
  }

  openAddDialog() {
    const ref = this.dialog.open(AddTechnicianDialogComponent, {
      width: '420px'
    });

    ref.afterClosed().subscribe(result => {
      if (result === 'created') {
        this.page = 0;
        this.loadPage();
      }
    });
  }

  getStatusClass(status: string | null | undefined): string {
    return status === 'ACTIVE' ? 'status-active' : 'status-inactive';
  }
}
