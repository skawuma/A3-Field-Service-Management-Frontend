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

    <form [formGroup]="form" (ngSubmit)="onSubmit()" mat-dialog-content>

      <p class="pb-2">
        Assign technician to:
        <strong>{{ data.workorder.clientName }}</strong>
      </p>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Technician</mat-label>
        <mat-select formControlName="technicianId" required>
          <mat-option *ngFor="let t of technicians" [value]="t.id">
            {{ t.firstName }} {{ t.lastName }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <div mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading">
          <mat-progress-spinner
            *ngIf="loading"
            diameter="18"
            mode="indeterminate">
          </mat-progress-spinner>
          <span *ngIf="!loading">Assign</span>
        </button>
      </div>
    </form>
  `,
  styles: [`
    .full-width { width: 100%; }
    .pb-2 { padding-bottom: 8px; }
  `]
})
export class AssignTechnicianDialogComponent implements OnInit {

  form!: FormGroup;   // <-- Only declare here
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
    // Initialize form properly
    this.form = this.fb.group({
      technicianId: [null, Validators.required]
    });

    // Load list of technicians
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

