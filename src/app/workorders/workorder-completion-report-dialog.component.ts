import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL_IMPORTS } from '../material-imports';

@Component({
  selector: 'app-workorder-completion-report-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Submit Completion Report</h2>

    <mat-dialog-content>
      <div class="dialog-body">
        <div class="summary-box">
          <div><strong>Work Order:</strong> #{{ data?.workorder?.id }}</div>
          <div><strong>Client:</strong> {{ data?.workorder?.clientName }}</div>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>FA Tag / Device</mat-label>
          <input matInput [(ngModel)]="form.faTag" />
        </mat-form-field>

        <mat-slide-toggle [(ngModel)]="form.issueResolved">
          Issue Resolved
        </mat-slide-toggle>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Replacement Needed</mat-label>
          <mat-select [(ngModel)]="form.replacementNeeded">
            <mat-option value="YES">Yes</mat-option>
            <mat-option value="NO">No</mat-option>
            <mat-option value="PROBABLE">Probable</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-slide-toggle [(ngModel)]="form.returnVisitRequired">
          Return Visit Required
        </mat-slide-toggle>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Summary of Work Performed</mat-label>
          <textarea
            matInput
            rows="5"
            [(ngModel)]="form.summaryOfWork"
            placeholder="Describe what was done onsite...">
          </textarea>
        </mat-form-field>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="close()">Cancel</button>
      <button mat-flat-button color="primary" type="button" (click)="submit()">
        Submit Report
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
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 14px;
      color: #374151;
      display: flex;
      flex-direction: column;
      gap: 4px;
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
export class WorkorderCompletionReportDialogComponent {
  form = {
    faTag: '',
    issueResolved: true,
    replacementNeeded: 'NO',
    returnVisitRequired: false,
    summaryOfWork: ''
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { workorder: any },
    private dialogRef: MatDialogRef<WorkorderCompletionReportDialogComponent>
  ) {}

  close() {
    this.dialogRef.close();
  }

  submit() {
    if (!this.form.faTag.trim()) {
      alert('FA Tag / Device is required.');
      return;
    }

    if (!this.form.summaryOfWork.trim()) {
      alert('Summary of Work Performed is required.');
      return;
    }

    this.dialogRef.close({
      faTag: this.form.faTag.trim(),
      issueResolved: this.form.issueResolved,
      replacementNeeded: this.form.replacementNeeded,
      returnVisitRequired: this.form.returnVisitRequired,
      summaryOfWork: this.form.summaryOfWork.trim()
    });
  }
}