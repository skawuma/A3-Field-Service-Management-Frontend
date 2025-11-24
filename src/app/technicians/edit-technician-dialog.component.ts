import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../material-imports';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ApiService } from '../core/services/api-service';
import { NotificationService } from '../core/services/notification.service';

export interface Technician {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  certifications: string;
  status: 'ACTIVE' | 'INACTIVE';
}

@Component({
  selector: 'app-edit-technician-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Edit Technician</h2>

    <mat-dialog-content class="dialog-body">
      <form [formGroup]="form">
        <!-- Name Row -->
        <div class="row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>First Name</mat-label>
            <input matInput formControlName="firstName">
            <mat-error *ngIf="form.controls['firstName'].hasError('required')">
              First name is required.
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName">
            <mat-error *ngIf="form.controls['lastName'].hasError('required')">
              Last name is required.
            </mat-error>
          </mat-form-field>
        </div>

        <!-- Phone -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone" placeholder="Optional">
          <mat-hint>Format: ###-###-####</mat-hint>
        </mat-form-field>

        <!-- Email -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email">
          <mat-error *ngIf="form.controls['email'].hasError('email')">
            Enter a valid email.
          </mat-error>
        </mat-form-field>

        <!-- Certifications -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Certifications</mat-label>
          <input matInput formControlName="certifications" placeholder="Optional (e.g., A+, Net+)">
        </mat-form-field>

        <!-- Status (Admin-only conceptually, enforced by backend) -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="ACTIVE">Active</mat-option>
            <mat-option value="INACTIVE">Inactive</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="start" class="actions-space-between">

      <button mat-button color="warn" (click)="onDelete()" [disabled]="loading">
        <mat-icon>delete</mat-icon>
        Delete
      </button>

      <div>
        <button mat-button type="button" (click)="dialogRef.close()" [disabled]="loading">
          Cancel
        </button>

        <button mat-raised-button color="primary"
                (click)="onSave()"
                [disabled]="form.invalid || loading">
          <mat-progress-spinner
            *ngIf="loading"
            mode="indeterminate"
            diameter="18"
            class="mr-2">
          </mat-progress-spinner>
          <span *ngIf="!loading">Save</span>
        </button>
      </div>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-body {
      min-width: 380px;
      max-height: 70vh;
      overflow: auto;
    }

    .actions-space-between {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

    .full-width { width: 100%; }
    .half-width { width: 100%; }
    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    @media (min-width: 640px) {
      .half-width { width: calc(50% - 6px); }
    }
    .mr-2 { margin-right: 8px; }
  `]
})
export class EditTechnicianDialogComponent {

  form: FormGroup;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<EditTechnicianDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { technician: Technician },
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService
  ) {
    const t = data.technician;

    this.form = this.fb.group({
      firstName: [t.firstName, Validators.required],
      lastName: [t.lastName, Validators.required],
      phone: [t.phone],
      email: [t.email, Validators.email],
      certifications: [t.certifications],
      status: [t.status || 'ACTIVE']
    });
  }

  onSave() {
    if (this.form.invalid) return;
    this.loading = true;

    const payload = this.form.value;

    this.api.put<any>(`technicians/${this.data.technician.id}`, payload).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Technician updated');
        this.dialogRef.close('updated');
      },
      error: () => {
        this.loading = false;
        this.notify.error('Failed to update technician');
      }
    });
  }

  onDelete() {
    const confirmed = window.confirm('Are you sure you want to delete this technician?');
    if (!confirmed) return;

    this.loading = true;

    this.api.delete<any>(`technicians/${this.data.technician.id}`).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Technician deleted');
        this.dialogRef.close('deleted');
      },
      error: () => {
        this.loading = false;
        this.notify.error('Failed to delete technician');
      }
    });
  }
}
