import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../material-imports';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { NotificationService } from '../core/services/notification.service';
import { ApiService } from '../core/services/api-service';

@Component({
  selector: 'app-add-technician-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Add Technician</h2>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>First Name</mat-label>
        <input matInput formControlName="firstName">
        <mat-error *ngIf="form.controls['firstName'].invalid">
          First name is required
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Last Name</mat-label>
        <input matInput formControlName="lastName">
        <mat-error *ngIf="form.controls['lastName'].invalid">
          Last name is required
        </mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Phone</mat-label>
        <input matInput formControlName="phone">
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email">
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Certifications</mat-label>
        <input matInput formControlName="certifications">
      </mat-form-field>

      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading">
          <mat-progress-spinner
            *ngIf="loading"
            mode="indeterminate"
            diameter="18">
          </mat-progress-spinner>
          <span *ngIf="!loading">Save</span>
        </button>
      </div>
    </form>
  `,
  styles: [`
    .full-width { width: 100%; }
    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 300px;
    }
    [mat-dialog-actions] {
      margin-top: 12px;
    }
    mat-progress-spinner {
      margin-right: 8px;
    }
  `]
})
export class AddTechnicianDialogComponent {
  form!: FormGroup;
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<AddTechnicianDialogComponent>,
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService
  ) {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phone: [''],
      email: [''],
      certifications: ['']
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.api.post<any>('technicians', this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Technician created');
        this.dialogRef.close('created');
      },
      error: err => {
        this.loading = false;
        console.error(err);
        this.notify.error('Failed to create technician');
      }
    });
  }
}
