import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../material-imports';
import { MatDialog } from '@angular/material/dialog';
import { AddWorkOrderDialogComponent } from './add-workorder-dialog.component';


import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ApiService, PageResponse } from '../core/services/api-service';
import { AssignTechnicianDialogComponent } from './assign-technician-dialog.component';

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
  imports: [CommonModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="header-row">
      <h2>Work Orders</h2>
      <button mat-fab color="primary" (click)="openAddDialog()">
        <mat-icon>add</mat-icon>
      </button>
    </div>

    <mat-card>
      <mat-table [dataSource]="dataSource" matSort>

        <ng-container matColumnDef="clientName">
          <mat-header-cell *matHeaderCellDef mat-sort-header> Client </mat-header-cell>
          <mat-cell *matCellDef="let w"> {{ w.clientName }} </mat-cell>
        </ng-container>

        <ng-container matColumnDef="address">
          <mat-header-cell *matHeaderCellDef> Address </mat-header-cell>
          <mat-cell *matCellDef="let w"> {{ w.address }} </mat-cell>
        </ng-container>

        <ng-container matColumnDef="status">
          <mat-header-cell *matHeaderCellDef> Status </mat-header-cell>
          <mat-cell *matCellDef="let w"> {{ w.status }} </mat-cell>
        </ng-container>

        <ng-container matColumnDef="scheduledDate">
          <mat-header-cell *matHeaderCellDef> Scheduled </mat-header-cell>
          <mat-cell *matCellDef="let w"> {{ w.scheduledDate || '-' }} </mat-cell>
        </ng-container>

        <ng-container matColumnDef="priority">
          <mat-header-cell *matHeaderCellDef> Priority </mat-header-cell>
          <mat-cell *matCellDef="let w"> {{ w.priority || '-' }} </mat-cell>
        </ng-container>

        <ng-container matColumnDef="actions">
  <mat-header-cell *matHeaderCellDef> Actions </mat-header-cell>
  <mat-cell *matCellDef="let w">
    <button mat-icon-button color="primary" (click)="openAssignDialog(w)">
      <mat-icon>person_add</mat-icon>
    </button>
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
  `]
})
export class WorkordersListComponent implements OnInit, AfterViewInit {
 displayedColumns: string[] = ['clientName', 'address', 'status', 'scheduledDate', 'priority', 'actions'];

  dataSource = new MatTableDataSource<WorkOrder>([]);
  page = 0;
  size = 10;
  totalElements = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private api: ApiService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadPage();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadPage() {
    this.api.getPage<WorkOrder>('workorders', this.page, this.size, 'createdAt')
      .subscribe({
        next: (res: PageResponse<WorkOrder>) => {
          this.dataSource.data = res.content;
          this.page = res.page;
          this.size = res.size;
          this.totalElements = res.totalElements;
        },
        error: err => console.error('Failed to load workorders', err)
      });
  }

  openAddDialog() {
  const ref = this.dialog.open(AddWorkOrderDialogComponent, {
    width: '450px'
  });

  ref.afterClosed().subscribe(result => {
    if (result === 'created') {
      this.loadPage();
    }
  });
}
openAssignDialog(workorder: WorkOrder) {
  const ref = this.dialog.open(AssignTechnicianDialogComponent, {
    width: '420px',
    data: { workorder }
  });

  ref.afterClosed().subscribe(result => {
    if (result === 'assigned') {
      this.loadPage();
    }
  });
}


  onPageChange(event: any) {
    this.page = event.pageIndex;
    this.size = event.pageSize;
    this.loadPage();
  }
}

