import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL_IMPORTS } from '../material-imports';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { NotificationService } from '../core/services/notification.service';
import { ApiService } from '../core/services/api-service';

interface Technician {
  id: number;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-assign-technician-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Assign Technician</h2>

    <mat-dialog-content class="dialog-body">

      <p class="mb-4 text-gray-600">
        Assigning technician to:
        <strong class="text-black">{{ data.workorder.clientName }}</strong>
      </p>

      <form [formGroup]="form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Select Technician</mat-label>

          <mat-select formControlName="technicianId" required>
            <mat-option *ngFor="let t of technicians" [value]="t.id">
              {{ t.firstName }} {{ t.lastName }}
            </mat-option>
          </mat-select>

          <mat-error *ngIf="form.controls['technicianId'].invalid">
            Technician is required
          </mat-error>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()" [disabled]="loading">
        Cancel
      </button>

      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="form.invalid || loading">
        <mat-progress-spinner
          *ngIf="loading"
          diameter="18"
          mode="indeterminate"
          class="mr-2">
        </mat-progress-spinner>

        <span *ngIf="!loading">Assign</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .dialog-body { min-width: 360px; }
    .mr-2 { margin-right: 8px; }
    .mb-4 { margin-bottom: 16px; }
  `]
})
export class AssignTechnicianDialogComponent implements OnInit {

  form!: FormGroup;
  technicians: Technician[] = [];
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<AssignTechnicianDialogComponent>,
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      technicianId: [null, Validators.required]
    });

    this.api.getPage<Technician>('technicians', 0, 100).subscribe({
      next: (res) => this.technicians = res.content,
      error: () => this.notify.error('Failed to load technicians')
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    const body = { technicianId: this.form.value.technicianId };

    this.api.post(`workorders/${this.data.workorder.id}/assign`, body).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Technician assigned');
        this.dialogRef.close('assigned');
      },
      error: () => {
        this.loading = false;
        this.notify.error('Assignment failed');
      }
    });
  }
}
