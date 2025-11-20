import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../material-imports';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ApiService, PageResponse } from '../core/services/api-service';
import { AddTechnicianDialogComponent } from './add-technician-dialog.component';


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
    <div class="header-row">
      <h2>Technicians</h2>
      <button mat-fab color="primary" (click)="openAddDialog()">
        <mat-icon>add</mat-icon>
      </button>
    </div>

    <mat-form-field appearance="outline" class="search-bar">
  <mat-label>Search</mat-label>
  <input matInput (input)="applyFilter($event)" placeholder="Search technicians...">
  <mat-icon matSuffix>search</mat-icon>
</mat-form-field>
    <mat-card>
      <mat-table [dataSource]="dataSource" matSort>

        <ng-container matColumnDef="name">
          <mat-header-cell *matHeaderCellDef mat-sort-header> Name </mat-header-cell>
          <mat-cell *matCellDef="let t"> {{ t.firstName }} {{ t.lastName }} </mat-cell>
        </ng-container>

        <ng-container matColumnDef="phone">
          <mat-header-cell *matHeaderCellDef> Phone </mat-header-cell>
          <mat-cell *matCellDef="let t"> {{ t.phone }} </mat-cell>
        </ng-container>

        <ng-container matColumnDef="email">
          <mat-header-cell *matHeaderCellDef> Email </mat-header-cell>
          <mat-cell *matCellDef="let t"> {{ t.email }} </mat-cell>
        </ng-container>

        <ng-container matColumnDef="certifications">
          <mat-header-cell *matHeaderCellDef> Certs </mat-header-cell>
          <mat-cell *matCellDef="let t"> {{ t.certifications }} </mat-cell>
        </ng-container>

        <ng-container matColumnDef="status">
          <mat-header-cell *matHeaderCellDef> Status </mat-header-cell>
          <mat-cell *matCellDef="let t">
            <span [ngClass]="t.status === 'ACTIVE' ? 'status-active' : 'status-inactive'">
              {{ t.status }}
            </span>
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>

      </mat-table>

      <mat-paginator [length]="totalElements"
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
    mat-card {
      padding: 0;
    }
    mat-header-cell, mat-cell {
      padding: 8px 16px;
    }
    .search-bar {
  width: 300px;
  margin-bottom: 16px;
}

    .status-active {
      color: #2e7d32;
      font-weight: 600;
    }
    .status-inactive {
      color: #c62828;
      font-weight: 600;
    }
  `]
})
export class TechniciansListComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['name', 'phone', 'email', 'certifications', 'status'];
  dataSource = new MatTableDataSource<Technician>([]);
  page = 0;
  size = 10;
  totalElements = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private api: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadPage();
  }
  applyFilter(event: any) {
  const value = event.target.value.trim().toLowerCase();
  this.dataSource.filter = value;
}


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

  this.dataSource.filterPredicate = (data: Technician, filter: string) => {
    return (
      data.firstName.toLowerCase().includes(filter) ||
      data.lastName.toLowerCase().includes(filter) ||
      (data.email?.toLowerCase().includes(filter) ?? false) ||
      (data.phone?.toLowerCase().includes(filter) ?? false) ||
      (data.certifications?.toLowerCase().includes(filter) ?? false)
    );
  };

  }

  loadPage() {
    this.api.getPage<Technician>('technicians', this.page, this.size, 'lastName')
      .subscribe({
        next: (res: PageResponse<Technician>) => {
          this.dataSource.data = res.content;
          this.page = res.page;
          this.size = res.size;
          this.totalElements = res.totalElements;
        },
        error: err => console.error('Failed to load technicians', err)
      });
  }

  onPageChange(event: any) {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadPage();
  }

  openAddDialog() {
    const ref = this.dialog.open(AddTechnicianDialogComponent, {
      width: '420px'
    });

    ref.afterClosed().subscribe(result => {
      if (result === 'created') {
        this.loadPage();
      }
    });
  }
}
