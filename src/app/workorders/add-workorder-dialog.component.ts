import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../material-imports';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { NotificationService } from '../core/services/notification.service';
import { ApiService } from '../core/services/api-service';

interface Technician {
  id: number;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-add-workorder-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Create Work Order</h2>

    <mat-dialog-content class="dialog-body">

      <form [formGroup]="form">

        <!-- Client Name -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Client Name *</mat-label>
          <input matInput formControlName="clientName">
          <mat-error *ngIf="form.controls['clientName'].invalid">Client name is required</mat-error>
        </mat-form-field>

        <!-- Address -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Address *</mat-label>
          <input matInput formControlName="address">
          <mat-error *ngIf="form.controls['address'].invalid">Address is required</mat-error>
        </mat-form-field>

        <!-- Description -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput rows="3" formControlName="description"></textarea>
        </mat-form-field>

        <!-- Technician -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Assigned Technician</mat-label>
          <mat-select formControlName="assignedTechId">
            <mat-option [value]="null">Unassigned</mat-option>
            <mat-option *ngFor="let t of technicians" [value]="t.id">
              {{ t.firstName }} {{ t.lastName }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Scheduled Date -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Scheduled Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="scheduledDate">
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <!-- Priority -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Priority</mat-label>
          <mat-select formControlName="priority">
            <mat-option value="LOW">Low</mat-option>
            <mat-option value="MEDIUM">Medium</mat-option>
            <mat-option value="HIGH">High</mat-option>
            <mat-option value="CRITICAL">Critical</mat-option>
          </mat-select>
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
        <span *ngIf="!loading">Save</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-body { min-width: 360px; max-height: 70vh; overflow: auto; }
    .full-width { width: 100%; }
    .mr-2 { margin-right: 8px; }
  `]
})
export class AddWorkOrderDialogComponent implements OnInit {

  form!: FormGroup;
  technicians: Technician[] = [];
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<AddWorkOrderDialogComponent>,
    private fb: FormBuilder,
    private api: ApiService,
    private notify: NotificationService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      clientName: ['', Validators.required],
      address: ['', Validators.required],
      description: [''],
      assignedTechId: [null],
      scheduledDate: [null],
      priority: ['MEDIUM']
    });

    this.api.getPage<Technician>('technicians', 0, 100).subscribe({
      next: res => this.technicians = res.content,
      error: () => this.notify.error('Failed to load technicians')
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.api.post('workorders', this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.notify.success('Work Order created');
        this.dialogRef.close('created');
      },
      error: () => {
        this.loading = false;
        this.notify.error('Failed to create Work Order');
      }
    });
  }
}
