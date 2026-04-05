import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL_IMPORTS } from '../material-imports';

@Component({
  selector: 'app-workorder-reopen-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Reopen Work Order</h2>

    <mat-dialog-content>
      <div class="dialog-body">
        <div class="summary-box">
          <div><strong>Work Order:</strong> #{{ data?.workorder?.id }}</div>
          <div><strong>Client:</strong> {{ data?.workorder?.clientName }}</div>
          <div><strong>Current Status:</strong> {{ data?.workorder?.status }}</div>
        </div>

        <p class="helper-text">
          Reopening this work order will return it to <strong>OPEN</strong>, clear completion data,
          remove the signature, and make it available for reassignment.
        </p>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason for reopening</mat-label>
          <textarea
            matInput
            rows="4"
            [(ngModel)]="reason"
            placeholder="Optional reason for reopening this work order...">
          </textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button
        mat-stroked-button
        type="button"
        (click)="close()">
        Cancel
      </button>

      <button
        mat-flat-button
        color="warn"
        type="button"
        [disabled]="submitting"
        (click)="confirm()">
        <mat-spinner *ngIf="submitting" diameter="18"></mat-spinner>
        <span *ngIf="!submitting">Reopen Work Order</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 560px;
      max-width: 100%;
      padding-top: 6px;
    }

    .summary-box {
      background: #fff7ed;
      border: 1px solid #fdba74;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 14px;
      color: #7c2d12;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .helper-text {
      margin: 0;
      color: #4b5563;
      font-size: 14px;
      line-height: 1.5;
    }

    .full-width {
      width: 100%;
    }

    @media (max-width: 768px) {
      .dialog-body {
        min-width: unset;
      }
    }
  `]
})
export class WorkorderReopenDialogComponent {
  reason = '';
  submitting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { workorder: any },
    private dialogRef: MatDialogRef<WorkorderReopenDialogComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }

  confirm() {
    this.submitting = true;

    this.dialogRef.close({
      reason: this.reason.trim() || undefined
    });
  }
}