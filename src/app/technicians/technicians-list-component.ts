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
import { AuthService } from '../core/services/auth-service';  // 🔥 NEW

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
        <span class="page-eyebrow">Team directory</span>
        <h2 class="title">Technicians</h2>
        <p class="subtitle">Manage field technicians, availability, and service credentials.</p>
      </div>

      <!-- Add Technician: ADMIN only -->
      <button
        *ngIf="isAdmin"
        mat-raised-button
        color="primary"
        (click)="openAddDialog()">
        <mat-icon>add</mat-icon>
        Add Technician
      </button>
    </div>

    <div class="search-panel">
      <div class="search-copy"><span><mat-icon>engineering</mat-icon></span><div><strong>Technician directory</strong><small>{{ totalElements }} team member{{ totalElements === 1 ? '' : 's' }}</small></div></div>
      <mat-form-field appearance="outline" class="search-bar">
        <mat-label>Search technicians</mat-label>
        <input
          matInput
          (input)="applyFilter($event)"
          placeholder="Name, email, phone or certification" />
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
    </div>

    <mat-card>

      <!-- LOADING BAR -->
      <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>

      <div *ngIf="!loading && loadError" class="empty-state error-state">
        <span class="state-icon"><mat-icon>cloud_off</mat-icon></span>
        <strong>Unable to load technicians</strong>
        <p>The team directory is temporarily unavailable.</p>
        <button mat-stroked-button type="button" (click)="loadPage()"><mat-icon>refresh</mat-icon> Retry</button>
      </div>

      <!-- TABLE -->
      <div class="table-wrapper" *ngIf="!loadError && (loading || dataSource.data.length)">
        <mat-table [dataSource]="dataSource" matSort>

          <!-- Name -->
          <ng-container matColumnDef="name">
            <mat-header-cell *matHeaderCellDef mat-sort-header="lastName">
              Name
            </mat-header-cell>
            <mat-cell *matCellDef="let t">
              <span class="tech-identity"><i>{{ t.firstName.charAt(0) }}{{ t.lastName.charAt(0) }}</i><span><strong>{{ t.firstName }} {{ t.lastName }}</strong><small>Technician #{{ t.id }}</small></span></span>
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

          <!-- Actions (ADMIN only buttons) -->
          <ng-container matColumnDef="actions">
            <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
            <mat-cell *matCellDef="let t">
              <button
                *ngIf="isAdmin"
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
        *ngIf="!loading && !loadError && dataSource.data.length === 0"
        class="empty-state">
        <span class="state-icon"><mat-icon>engineering</mat-icon></span>
        <strong>No technicians found</strong>
        <p>{{ searchValue ? 'Try a different name, contact detail, or certification.' : 'Add your first field technician to begin building the team.' }}</p>
        <button *ngIf="isAdmin && !searchValue" mat-raised-button color="primary" type="button" (click)="openAddDialog()"><mat-icon>add</mat-icon> Add technician</button>
      </div>

      <!-- PAGINATOR -->
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
    .header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; margin-bottom: 20px; }
    .page-eyebrow { color: var(--primary); font-size: var(--font-xs); font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
    .title { margin: 4px 0 6px; color: var(--text-strong); font-size: clamp(1.85rem, 3vw, 2.35rem); line-height: 1.12; letter-spacing: -.04em; }
    .subtitle { margin: 0; color: var(--text-muted); }
    .header-row button mat-icon { margin-right: 6px; }
    .search-panel { display: flex; align-items: center; justify-content: space-between; gap: var(--space-5); margin-bottom: var(--space-5); padding: 16px 18px 0; border: 1px solid var(--border); border-radius: var(--radius-lg); background: linear-gradient(105deg, var(--surface), #f8fbff); box-shadow: var(--shadow-sm); }
    .search-copy { display: flex; align-items: center; gap: 11px; padding-bottom: 16px; }
    .search-copy > span { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 11px; color: var(--primary); background: var(--primary-soft); }
    .search-copy > div { display: grid; gap: 2px; }
    .search-copy strong { color: var(--text-strong); font-size: .8rem; }
    .search-copy small { color: var(--text-muted); font-size: .68rem; }
    .search-bar { width: min(100%, 460px); }
    mat-card { border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
    .table-wrapper { overflow-x: auto; }
    mat-header-row { min-height: 48px; background: var(--surface-muted); }
    mat-header-cell { color: var(--text-muted); font-size: 11px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
    mat-row { min-height: 60px; border-color: var(--border); }
    mat-cell { color: var(--text); font-size: 13px; }
    .tech-identity { min-width: 190px; display: flex; align-items: center; gap: 10px; }
    .tech-identity > i { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 10px; color: var(--primary); background: var(--primary-soft); font-size: .65rem; font-style: normal; font-weight: 800; }
    .tech-identity > span { display: grid; gap: 2px; }
    .tech-identity strong { color: var(--text-strong); font-size: .78rem; }
    .tech-identity small { color: var(--text-muted); font-size: .65rem; }
    .badge { display: inline-flex; padding: 4px 9px; border-radius: 999px; font-size: 10px; font-weight: 800; }
    .status-active { color: var(--success); background: var(--success-soft); }
    .status-inactive { color: #475569; background: #e2e8f0; }
    .hover-row:hover { background: #f8fbff; }
    .empty-state { min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 28px; color: var(--text-muted); text-align: center; }
    .state-icon { width: 50px; height: 50px; display: grid; place-items: center; margin-bottom: 7px; border-radius: 15px; color: var(--primary); background: var(--primary-soft); }
    .empty-state strong { color: var(--text-strong); font-size: .92rem; }
    .empty-state p { max-width: 420px; margin: 0 0 8px; font-size: .78rem; }
    .empty-state button mat-icon { margin-right: 5px; }
    .error-state .state-icon { color: var(--danger); background: var(--danger-soft); }
    @media (max-width: 760px) {
      .title { font-size: 1.7rem; }
      .search-panel { align-items: stretch; flex-direction: column; }
      .search-copy { padding-bottom: 0; }
      .mat-column-phone, .mat-column-certifications { display: none; }
      mat-cell, mat-header-cell { padding: 0 10px; }
    }
    @media (max-width: 520px) {
      .header-row { align-items: stretch; flex-direction: column; }
      .header-row button { width: 100%; }
      .mat-column-email { display: none; }
    }
  `]
})

export class TechniciansListComponent implements OnInit, AfterViewInit {

  /** ---------- Role Flags ---------- **/
  isAdmin = false;
  isDispatch = false;
  isTech = false;

  /** ---------- Columns ---------- **/
  displayedColumns: string[] = [];

  /** ---------- Table & Paging ---------- **/
  dataSource = new MatTableDataSource<Technician>([]);
  page = 0;
  size = 10;
  totalElements = 0;
  sortBy: string = 'lastName,asc';

  /** ---------- UI State ---------- **/
  loading = false;
  loadError = false;
  searchValue = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private auth: AuthService
  ) {}

  /** ------------------------------------------
   * ngOnInit → SAFE place to read AuthService
   * -------------------------------------------*/
  ngOnInit() {
    // ROLE CHECKS (SAFE)
    const role = this.auth.getRole();
    this.isAdmin = role === 'ADMIN';
    this.isDispatch = role === 'DISPATCH';
    this.isTech = role === 'TECH';

    // COLUMNS BASED ON ROLE
    this.displayedColumns = this.isTech
      ? ['name', 'phone', 'email', 'certifications', 'status']
      : ['name', 'phone', 'email', 'certifications', 'status', 'actions'];

    this.loadPage();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;

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

    // Backend sorting
    this.sort.sortChange.subscribe(sortEvent => {
      const field = sortEvent.active === 'name' ? 'lastName' : sortEvent.active;
      const direction = sortEvent.direction || 'asc';
      this.sortBy = `${field},${direction}`;
      this.page = 0;
      this.loadPage();
    });
  }

  /** ---------------- PAGE LOAD ---------------- **/
  loadPage() {
    this.loading = true;
    this.loadError = false;

    this.api.getPage<Technician>('technicians', this.page, this.size, this.sortBy)
      .subscribe({
        next: (res: PageResponse<Technician>) => {
          this.dataSource.data = res.content;
          this.page = res.page;
          this.size = res.size;
          this.totalElements = res.totalElements;
        },
        error: err => {
          this.loading = false;
          this.loadError = true;
          console.error('Failed to load technicians', err);
        },
        complete: () => this.loading = false
      });
  }

  /** ---------------- ACTIONS ---------------- **/
  openEditDialog(technician: Technician) {
    if (!this.isAdmin) return; // UI safety

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

  openAddDialog() {
    if (!this.isAdmin) return;

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

  /** ---------------- Searching & Paging ---------------- **/
  applyFilter(event: any) {
    const value = event.target.value || '';
    this.searchValue = value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  clearFilter() {
    this.searchValue = '';
    this.dataSource.filter = '';
  }

  onPageChange(event: any) {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadPage();
  }

  /** ---------------- UI Helpers ---------------- **/
  getStatusClass(status: string) {
    return status === 'ACTIVE' ? 'status-active' : 'status-inactive';
  }
}
