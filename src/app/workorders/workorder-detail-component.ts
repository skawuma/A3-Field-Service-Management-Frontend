import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MATERIAL_IMPORTS } from '../material-imports';
import { ApiService } from '../core/services/api-service';
import { AuthService } from '../core/services/auth-service';

@Component({
  selector: 'app-workorder-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ...MATERIAL_IMPORTS],
  template: `
    <div class="detail-container" *ngIf="workorder">

      <!-- HEADER -->
      <div class="header">
        <button mat-icon-button routerLink="/workorders" matTooltip="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>

        <div>
          <h2 class="title">Work Order #{{ workorder.id }}</h2>
          <p class="subtitle">{{ workorder.clientName }}</p>
        </div>

        <span class="status-chip" [ngClass]="statusClass(workorder.status)">
          {{ workorder.status }}
        </span>
      </div>

      <!-- META -->
      <mat-card class="section-card">
        <mat-card-title>Details</mat-card-title>
        <mat-card-content>

          <div class="row">
            <div class="label">Client:</div>
            <div class="value">{{ workorder.clientName }}</div>
          </div>

          <div class="row">
            <div class="label">Address:</div>
            <div class="value">{{ workorder.address }}</div>
          </div>

          <div class="row">
            <div class="label">Assigned Tech:</div>
            <div class="value">
              {{ technicianName || 'Unassigned' }}
            </div>
          </div>

          <div class="row">
            <div class="label">Priority:</div>
            <div class="value">
              <span class="priority-chip" [ngClass]="priorityClass(workorder.priority)">
                {{ workorder.priority }}
              </span>
            </div>
          </div>

          <div class="row">
            <div class="label">Scheduled:</div>
            <div class="value">
              {{ workorder.scheduledDate ? (workorder.scheduledDate | date:'MM/dd/yyyy') : 'None' }}
            </div>
          </div>

        </mat-card-content>
      </mat-card>

      <!-- DESCRIPTION -->
      <mat-card class="section-card">
        <mat-card-title>Technician Notes</mat-card-title>
        <mat-card-content>

          <!-- TECH EDIT AREA -->
          <div *ngIf="isTech">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea
                matInput
                rows="4"
                [(ngModel)]="techForm.description">
              </textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="techForm.status">
                <mat-option value="IN_PROGRESS">In Progress</mat-option>
                <mat-option value="COMPLETED">Completed</mat-option>
              </mat-select>
            </mat-form-field>

            <button
              mat-raised-button
              color="primary"
              (click)="saveTechUpdate()"
              [disabled]="loading">
              <mat-progress-spinner
                *ngIf="loading"
                diameter="18"
                mode="indeterminate"
                class="mr-2">
              </mat-progress-spinner>
              Save
            </button>
          </div>

          <!-- READ-ONLY FOR ADMIN / DISPATCH -->
          <div *ngIf="!isTech">
            <p>{{ workorder.description || 'No technician notes yet.' }}</p>
          </div>

        </mat-card-content>
      </mat-card>

      <!-- ADMIN / DISPATCH FULL CONTROLS -->
      <mat-card class="section-card" *ngIf="!isTech">
        <mat-card-title>Admin / Dispatch Controls</mat-card-title>
        <mat-card-content>

          <button mat-raised-button color="primary" (click)="openEditDialog()">
            <mat-icon>edit</mat-icon>
            Edit Work Order
          </button>

        </mat-card-content>
      </mat-card>

    </div>
  `,
  styles: [`
    .detail-container {
      max-width: 900px;
      margin: 20px auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .title { font-size: 22px; font-weight: 600; }
    .subtitle { margin-top: -4px; color: #555; }

    .status-chip {
      margin-left: auto;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-open { background: #e3f2fd; color:#1565c0; }
    .status-assigned { background:#ede7f6; color:#5e35b1; }
    .status-in-progress { background:#fff3e0; color:#ef6c00; }
    .status-completed { background:#e8f5e9; color:#2e7d32; }

    .section-card {
      padding: 10px;
    }

    .row {
      display: flex;
      margin-bottom: 8px;
    }

    .label { width: 130px; font-weight: 600; }
    .value { flex: 1; }

    .priority-chip {
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .priority-low { background:#e8f5e9; color:#2e7d32; }
    .priority-medium { background:#fffde7; color:#f9a825; }
    .priority-high { background:#fff3e0; color:#ef6c00; }
    .priority-critical { background:#ffebee; color:#c62828; }

    .full-width { width: 100%; }
    .mr-2 { margin-right: 8px; }
  `]
})
export class WorkOrderDetailComponent implements OnInit {

  id!: number;
  workorder: any = null;
  technicianName = '';

  role = '';
  isTech = false;

  loading = false;

  techForm = {
    description: '',
    status: 'IN_PROGRESS'
  };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.role = this.auth.getRole() || '';
    this.isTech = this.role === 'TECH';

    this.load();
  }

  /** LOAD DETAILS */
  load() {
    this.loading = true;

    this.api.getOne('workorders', this.id).subscribe({
      next: (res: any) => {
        this.workorder = res;
        this.techForm.description = res.description;
        this.techForm.status = res.status;

        if (res.assignedTechId) {
          this.loadTechnician(res.assignedTechId);
        }
      },
      error: () => this.router.navigate(['/workorders']),
      complete: () => this.loading = false
    });
  }

  /** LOAD TECH NAME */
loadTechnician(id: number) {
  this.api.get(`technicians/${id}`).subscribe({

      next: (tech: any) => {
        this.technicianName = tech.firstName + ' ' + tech.lastName;
      },
      error: () => this.technicianName = 'Unknown'
    });
  }

  /** TECH UPDATE (limited) */
  saveTechUpdate() {
    this.loading = true;

    const body = {
      clientName: this.workorder.clientName,
      address: this.workorder.address,
      description: this.techForm.description,
      assignedTechId: this.workorder.assignedTechId,
      scheduledDate: this.workorder.scheduledDate,
      priority: this.workorder.priority,
      status: this.techForm.status
    };

    this.api.put(`workorders/${this.id}`, body).subscribe({
      next: () => this.load(),
      complete: () => this.loading = false
    });
  }

  /** OPEN ADMIN/DISPATCH EDIT DIALOG (future) */
  openEditDialog() {
    // You will create this later
    alert('Admin/Dispatch full edit coming next.');
  }

  /* UI HELPERS */
  statusClass(s: string) {
    return {
      OPEN: 'status-open',
      ASSIGNED: 'status-assigned',
      IN_PROGRESS: 'status-in-progress',
      COMPLETED: 'status-completed'
    }[s] || 'status-default';
  }

  priorityClass(p: string) {
    return {
      LOW: 'priority-low',
      MEDIUM: 'priority-medium',
      HIGH: 'priority-high',
      CRITICAL: 'priority-critical'
    }[p] || 'priority-default';
  }

}
