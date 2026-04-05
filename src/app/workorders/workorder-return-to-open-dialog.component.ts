import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL_IMPORTS } from '../material-imports';

@Component({
  selector: 'app-workorder-return-to-open-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Return Work Order to Open</h2>

    <mat-dialog-content>
      <div class="dialog-body">
        <div class="summary-box">
          <div><strong>Work Order:</strong> #{{ data?.workorder?.id }}</div>
          <div><strong>Client:</strong> {{ data?.workorder?.clientName }}</div>
          <div><strong>Current Status:</strong> {{ data?.workorder?.status }}</div>
        </div>

        <p class="helper-text">
          This will remove the work order from your assignments and return it to
          <strong>OPEN</strong> so dispatch can reassign it.
        </p>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason</mat-label>
          <textarea
            matInput
            rows="4"
            [(ngModel)]="reason"
            placeholder="Optional reason for returning this work order to Open...">
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
        <span *ngIf="!submitting">Return to Open</span>
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
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 14px;
      color: #1e3a8a;
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
export class WorkorderReturnToOpenDialogComponent {
  reason = '';
  submitting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { workorder: any },
    private dialogRef: MatDialogRef<WorkorderReturnToOpenDialogComponent>
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