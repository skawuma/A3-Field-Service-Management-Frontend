import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MATERIAL_IMPORTS } from '../material-imports';
import { MatSnackBar } from '@angular/material/snack-bar';

import { ApiService } from '../core/services/api-service';
import { AuthService } from '../core/services/auth-service';
import { MatDialog } from '@angular/material/dialog';
import { WorkorderTimelineComponent } from '../workorders/workorder-timeline.component';
import { EditWorkOrderDialogComponent } from '../workorders/workorder-edit-dialog.component';
import { WorkorderCompleteDialogComponent } from '../workorders/workorder-complete-dialog.component';
import { environment } from '../../environments/environment.development';

interface WorkOrderAttachment {
  id: number;
  filename: string;
  size: number;
  contentType?: string | null;
}

interface WorkOrderAttachmentView extends WorkOrderAttachment {
  previewUrl: string | null;
}

@Component({
  selector: 'app-workorder-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    WorkorderTimelineComponent,
    ...MATERIAL_IMPORTS
  ],
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

          <div class="row" *ngIf="workorder.completedAt">
            <div class="label">Completed:</div>
            <div class="value">
              {{ workorder.completedAt | date:'MM/dd/yyyy h:mm a' }}
            </div>
          </div>

        </mat-card-content>
      </mat-card>

      <!-- DESCRIPTION / NOTES -->
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
              </mat-select>
            </mat-form-field>

            <div class="tech-actions">
              <button
                mat-raised-button
                color="primary"
                (click)="saveTechUpdate()"
                [disabled]="loading || workorder.status === 'COMPLETED'">

                <mat-spinner *ngIf="loading" diameter="18"></mat-spinner>
                {{ loading ? 'Saving...' : 'Save' }}
              </button>

              <button
                mat-stroked-button
                color="accent"
                (click)="openCompleteDialog()"
                [disabled]="loading || workorder.status === 'COMPLETED'">

                <mat-icon *ngIf="!loading">draw</mat-icon>
                <mat-spinner *ngIf="loading" diameter="18"></mat-spinner>
                {{ loading ? 'Processing...' : 'Complete & Sign Off' }}
              </button>
            </div>
          </div>

          <!-- READ-ONLY FOR ADMIN / DISPATCH -->
          <div *ngIf="!isTech">
            <p>{{ workorder.description || 'No technician notes yet.' }}</p>
          </div>

          <!-- Completion Notes -->
          <div *ngIf="workorder.completionNotes" class="completion-notes">
            <h4>Completion Notes</h4>
            <p>{{ workorder.completionNotes }}</p>
          </div>

          <!-- Signature Preview -->
          <div *ngIf="signaturePreviewObjectUrl" class="signature-preview">
            <h4>Technician Signature</h4>
            <img
              [src]="signaturePreviewObjectUrl"
              alt="Technician signature"
              class="signature-image" />
          </div>

        </mat-card-content>
      </mat-card>

      <!-- ATTACHMENTS -->
      <mat-card class="section-card">
        <mat-card-title>Attachments</mat-card-title>

        <mat-card-content>

          <div class="upload-row">
            <input
              #fileInput
              type="file"
              (change)="onFileSelected($event)"
              [disabled]="uploading" />

            <span class="selected-file" *ngIf="selectedFile">
              {{ selectedFile.name }}
            </span>

            <button
              mat-raised-button
              color="primary"
              (click)="upload(fileInput)"
              [disabled]="!selectedFile || uploading">
              <mat-spinner *ngIf="uploading" diameter="18"></mat-spinner>
              <span *ngIf="!uploading">Upload</span>
            </button>

            <button
              mat-stroked-button
              color="warn"
              (click)="clearSelectedFile(fileInput)"
              [disabled]="uploading || !selectedFile">
              Clear
            </button>

            <button
              *ngIf="uploading"
              mat-stroked-button
              (click)="cancelUpload(fileInput)">
              Cancel Upload
            </button>
          </div>

          <mat-divider class="my-2"></mat-divider>

          <div *ngIf="attachments.length === 0" class="empty-text">
            No attachments uploaded.
          </div>

          <div class="attachment-list" *ngIf="attachments.length > 0">
            <div class="attachment-item" *ngFor="let att of attachments">

              <img
                *ngIf="att.previewUrl"
                [src]="att.previewUrl"
                class="thumb"
              />

              <div class="meta">
                <div class="name">{{ att.filename }}</div>
                <div class="size">{{ att.size | number }} bytes</div>
              </div>

              <div class="actions">
                <button mat-icon-button color="primary" (click)="download(att)">
                  <mat-icon>download</mat-icon>
                </button>

                <button
                  *ngIf="!isTech"
                  mat-icon-button
                  color="warn"
                  (click)="delete(att)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>

            </div>
          </div>

        </mat-card-content>
      </mat-card>

      <!-- ACTIVITY TIMELINE -->
      <mat-card class="section-card">
        <mat-card-title>Activity Timeline</mat-card-title>
        <mat-card-content>
          <app-workorder-timeline [workorderId]="id"></app-workorder-timeline>
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
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      transition: all 0.3s ease;
      animation: fadeInScale 0.3s ease;
    }

    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.85);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .status-open { background: #e3f2fd; color:#1565c0; }
    .status-assigned { background:#ede7f6; color:#5e35b1; }
    .status-in-progress { background:#fff3e0; color:#ef6c00; }
    .status-completed {
      background:#e8f5e9;
      color:#2e7d32;
      animation: pulseSuccess 0.6s ease;
    }

    @keyframes pulseSuccess {
      0% { transform: scale(1); }
      50% { transform: scale(1.08); }
      100% { transform: scale(1); }
    }

    .section-card { padding: 10px; }

    .row { display: flex; margin-bottom: 8px; }
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

    .tech-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .completion-notes {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }

    .completion-notes h4,
    .signature-preview h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
    }

    .signature-preview {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
    }

    .signature-image {
      max-width: 100%;
      width: 320px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      padding: 8px;
    }

    .upload-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .empty-text {
      color: #777;
      font-style: italic;
    }

    .attachment-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #ddd;
    }

    .thumb {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid #ccc;
    }

    .meta {
      flex: 1;
    }

    .name {
      font-weight: 600;
    }

    .size {
      font-size: 12px;
      color: #777;
    }

    button:hover {
      transform: translateY(-1px);
      transition: all 0.2s ease;
    }

    .selected-file {
      font-size: 13px;
      color: #555;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `]
})
export class WorkOrderDetailComponent implements OnInit, OnDestroy {

  signaturePreviewObjectUrl: string | null = null;

  baseUrl = environment.apiUrl;

  attachments: WorkOrderAttachmentView[] = [];
  selectedFile: File | null = null;
  uploading = false;
  uploadSub?: Subscription;

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
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.role = this.auth.getRole() || '';
    this.isTech = this.role === 'TECH';

    this.load();
  }

  load() {
    this.loading = true;

    this.api.getOne('workorders', this.id).subscribe({
      next: (res: any) => {
        this.workorder = res;

        this.techForm.description = res.description;
        this.techForm.status = res.status === 'COMPLETED' ? 'IN_PROGRESS' : res.status;

        if (!this.isTech && res.assignedTechId) {
          this.loadTechnician(res.assignedTechId);
        } else if (this.isTech) {
          this.technicianName = 'You';
        }

        this.loadAttachments();
        this.loadSignaturePreview();
      },
      error: () => {
        this.showError('Failed to load work order.');
        this.router.navigate(['/workorders']);
      },
      complete: () => this.loading = false
    });
  }

  loadTechnician(id: number) {
    this.api.get(`technicians/${id}`).subscribe({
      next: (tech: any) => {
        this.technicianName = tech.firstName + ' ' + tech.lastName;
      },
      error: () => {
        this.technicianName = 'Unknown';
      }
    });
  }

  loadAttachments() {
    this.api.get<WorkOrderAttachment[]>(`workorders/${this.id}/attachments`).subscribe({
      next: (files) => {
        this.attachments = files.map((f) => ({
          ...f,
          previewUrl: this.getPreviewUrl(f)
        }));
      },
      error: () => {
        this.attachments = [];
      }
    });
  }

  getPreviewUrl(file: WorkOrderAttachment): string | null {
    if (file.contentType?.startsWith('image/')) {
      return `${this.baseUrl}/workorders/${this.id}/attachments/${file.id}`;
    }
    return null;
  }

  loadSignaturePreview() {
    if (!this.workorder?.signatureUrl) {
      this.signaturePreviewObjectUrl = null;
      return;
    }

    this.api.downloadBlob(`workorders/${this.id}/signature`).subscribe({
      next: (blob) => {
        if (this.signaturePreviewObjectUrl) {
          URL.revokeObjectURL(this.signaturePreviewObjectUrl);
        }
        this.signaturePreviewObjectUrl = URL.createObjectURL(blob);
      },
      error: (err) => {
        console.error('Failed to load signature preview', err);
        this.signaturePreviewObjectUrl = null;
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  clearSelectedFile(fileInput: HTMLInputElement) {
    this.selectedFile = null;
    fileInput.value = '';
  }

  upload(fileInput: HTMLInputElement) {
    if (!this.selectedFile || this.uploading) return;

    this.uploading = true;

    const form = new FormData();
    form.append('file', this.selectedFile);

    this.uploadSub = this.api.post(`workorders/${this.id}/attachments`, form).subscribe({
      next: () => {
        this.selectedFile = null;
        fileInput.value = '';
        this.loadAttachments();
        this.uploading = false;
        this.uploadSub = undefined;
        this.showSuccess('Attachment uploaded successfully.');
      },
      error: (err) => {
        console.error('Upload failed', err);

        if (err.status === 413) {
          this.showError('File is too large. Please upload a smaller file.');
        } else if (err.status === 400) {
          this.showError('Upload failed or was interrupted.');
        } else if (err.status === 403) {
          this.showError('You do not have permission to upload attachments.');
        } else {
          this.showError('Upload failed. Please try again.');
        }

        this.uploading = false;
        this.uploadSub = undefined;
      }
    });
  }

  cancelUpload(fileInput: HTMLInputElement) {
    if (this.uploadSub) {
      this.uploadSub.unsubscribe();
      this.uploadSub = undefined;
    }

    this.uploading = false;
    this.selectedFile = null;
    fileInput.value = '';
    this.showError('Upload cancelled.');
  }

  download(att: WorkOrderAttachmentView) {
    this.api.downloadBlob(`workorders/${this.id}/attachments/${att.id}`).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = att.filename || `attachment-${att.id}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Download failed', err);
        this.showError('Failed to download attachment.');
      }
    });
  }

  delete(att: WorkOrderAttachmentView) {
    this.api.delete(`workorders/${this.id}/attachments/${att.id}`).subscribe({
      next: () => {
        this.loadAttachments();
        this.showSuccess('Attachment deleted successfully.');
      },
      error: () => {
        this.showError('Failed to delete attachment.');
      }
    });
  }

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
      next: () => {
        this.showSuccess('Work order updated successfully.');
        this.load();
      },
      error: () => {
        this.showError('Failed to update work order.');
      },
      complete: () => this.loading = false
    });
  }

  openCompleteDialog() {
    const dialogRef = this.dialog.open(WorkorderCompleteDialogComponent, {
      width: '760px',
      data: { workorder: this.workorder }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      this.loading = true;

      this.api.post(`workorders/${this.id}/complete`, result).subscribe({
        next: () => {
          this.showSuccess('Work order completed successfully.');
          this.load();
        },
        error: (err) => {
          console.error('Completion failed', err);

          if (err.status === 403) {
            this.showError('You are not allowed to complete this work order.');
          } else if (err.status === 400) {
            this.showError('Invalid completion request.');
          } else {
            this.showError('Failed to complete work order.');
          }

          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        }
      });
    });
  }

  openEditDialog() {
    const dialogRef = this.dialog.open(EditWorkOrderDialogComponent, {
      width: '600px',
      data: { workorder: this.workorder }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'updated' || result) {
        this.load();
      }
    });
  }

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

  showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-success']
    });
  }

  showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['snackbar-error']
    });
  }

  ngOnDestroy() {
    if (this.signaturePreviewObjectUrl) {
      URL.revokeObjectURL(this.signaturePreviewObjectUrl);
    }
  }
}