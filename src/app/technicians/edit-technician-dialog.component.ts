import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../material-imports';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { ApiService } from '../core/services/api-service';
import { NotificationService } from '../core/services/notification.service';
import { AuthService } from '../core/services/auth-service';

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
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName">
          </mat-form-field>
        </div>

        <!-- Phone -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Phone</mat-label>
          <input matInput formControlName="phone">
        </mat-form-field>

        <!-- Email -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email">
        </mat-form-field>

        <!-- Certifications -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Certifications</mat-label>
          <input matInput formControlName="certifications">
        </mat-form-field>

        <!-- STATUS (Admin-only editable, Dispatch read-only) -->
        <mat-form-field
          appearance="outline"
          class="full-width"
          *ngIf="canEditStatus"
        >
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="ACTIVE">Active</mat-option>
            <mat-option value="INACTIVE">Inactive</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- READ-ONLY status for dispatch -->
        <div class="readonly-status" *ngIf="!canEditStatus">
          <strong>Status:</strong> {{ form.value.status }}
        </div>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="start" class="actions-space-between">

      <!-- DELETE button: Admin ONLY -->
      <button
        mat-button
        color="warn"
        (click)="onDelete()"
        [disabled]="loading"
        *ngIf="canDelete"
      >
        <mat-icon>delete</mat-icon>
        Delete
      </button>

      <div>
        <button mat-button (click)="dialogRef.close()" [disabled]="loading">
          Cancel
        </button>

        <button
          mat-raised-button
          color="primary"
          (click)="onSave()"
          [disabled]="form.invalid || loading"
        >
          <mat-progress-spinner
            *ngIf="loading"
            mode="indeterminate"
            diameter="18"
            class="mr-2"
          ></mat-progress-spinner>
          <span *ngIf="!loading">Save</span>
        </button>
      </div>

    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-body { min-width: 380px; max-height: 70vh; overflow: auto; }
    .actions-space-between { display: flex; justify-content: space-between; width: 100%; }
    .full-width { width: 100%; }
    .half-width { width: 100%; }
    .row { display: flex; flex-wrap: wrap; gap: 12px; }
    @media (min-width: 640px) { .half-width { width: calc(50% - 6px); } }
    .readonly-status { margin-top: 8px; font-size: 14px; color: #555; }
  `]
})
export class EditTechnicianDialogComponent {

  form: FormGroup;
  loading = false;

  canEditStatus = false;
  canDelete = false;

  constructor(
    public dialogRef: MatDialogRef<EditTechnicianDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { technician: Technician },
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService,
    private auth: AuthService
  ) {

    // Role checks
    this.canEditStatus = this.auth.isAdmin();  // only admin
    this.canDelete = this.auth.isAdmin();      // only admin

    // Prevent TECH users entirely
    if (this.auth.isTech()) {
      this.notify.error("You don't have permission to edit technicians");
      this.dialogRef.close();
    }

    const t = data.technician;

    this.form = this.fb.group({
      firstName: [t.firstName, Validators.required],
      lastName: [t.lastName, Validators.required],
      phone: [t.phone],
      email: [t.email, Validators.email],
      certifications: [t.certifications],
      status: [t.status]
    });
  }

  onSave() {
    if (this.form.invalid) return;

    this.loading = true;
    let payload = this.form.value;

    // If not admin → remove status from payload
    if (!this.canEditStatus) {
      delete payload.status;
    }

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
    if (!this.canDelete) return;

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
