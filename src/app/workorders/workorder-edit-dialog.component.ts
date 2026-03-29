import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../material-imports';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ApiService } from '../core/services/api-service';
import { NotificationService } from '../core/services/notification.service';

@Component({
  selector: 'app-edit-workorder-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ...MATERIAL_IMPORTS
  ],
  template: `
    <h2 mat-dialog-title>Edit Work Order</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 py-2">

        <!-- CLIENT NAME -->
        <mat-form-field appearance="outline">
          <mat-label>Client Name</mat-label>
          <input matInput formControlName="clientName" />
        </mat-form-field>

        <!-- ADDRESS -->
        <mat-form-field appearance="outline">
          <mat-label>Address</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>

        <!-- DESCRIPTION -->
        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>

        <!-- PRIORITY -->
        <mat-form-field appearance="outline">
          <mat-label>Priority</mat-label>
          <mat-select formControlName="priority">
            <mat-option value="LOW">Low</mat-option>
            <mat-option value="MEDIUM">Medium</mat-option>
            <mat-option value="HIGH">High</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- STATUS -->
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="OPEN">Open</mat-option>
            <mat-option value="IN_PROGRESS">In Progress</mat-option>
            <mat-option value="COMPLETED">Completed</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- SCHEDULED DATE -->
        <mat-form-field appearance="outline">
          <mat-label>Scheduled Date</mat-label>
          <input matInput type="date" formControlName="scheduledDate" />
        </mat-form-field>

        <!-- ASSIGNED TECH ID -->
        <mat-form-field appearance="outline">
          <mat-label>Assigned Technician ID</mat-label>
          <input matInput type="number" formControlName="assignedTechId" />
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="close()">Cancel</button>

      <button mat-flat-button color="primary"
              [disabled]="form.invalid || loading"
              (click)="save()">
        <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
        <span *ngIf="!loading">Save</span>
      </button>
    </mat-dialog-actions>
  `
})
export class EditWorkOrderDialogComponent implements OnInit {

  form!: FormGroup;
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,   // contains workorder
    private dialogRef: MatDialogRef<EditWorkOrderDialogComponent>,
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService
  ) {
    // 🔥 fb is available here, so this is valid
    this.form = this.fb.group({
      clientName: ['', Validators.required],
      address: ['', Validators.required],
      description: ['', Validators.required],
      priority: ['LOW', Validators.required],
      status: ['OPEN', Validators.required],
      scheduledDate: [''],
      assignedTechId: [null]
    });
  }

  ngOnInit() {
    const w = this.data.workorder;

    this.form.patchValue({
      clientName: w.clientName,
      address: w.address,
      description: w.description,
      priority: w.priority,
      status: w.status,
      scheduledDate: w.scheduledDate ? w.scheduledDate : '',
      assignedTechId: w.assignedTechId
    });
  }

  save() {
    if (this.form.invalid) return;

    this.loading = true;

    const body = {
      ...this.form.value,
      scheduledDate:
        this.form.value.scheduledDate === '' ? null : this.form.value.scheduledDate
    };

    this.api.put(`workorders/${this.data.workorder.id}`, body).subscribe({
      next: (res) => {
        this.notify.success('Work order updated!');
        this.dialogRef.close(res);
      },
      error: () => {
        this.notify.error('Failed to update work order');
        this.loading = false;
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}
