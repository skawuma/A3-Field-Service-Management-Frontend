import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL_IMPORTS } from '../material-imports';
import { CommonModule } from '@angular/common';
import { WorkorderTimelineComponent } from './workorder-timeline.component';

@Component({
  selector: 'app-workorder-timeline-dialog',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_IMPORTS, WorkorderTimelineComponent],
  template: `
    <h2 mat-dialog-title>Timeline - Work Order #{{ data.workorder.id }}</h2>

    <mat-dialog-content class="p-0">
      <app-workorder-timeline [workorderId]="data.workorder.id"></app-workorder-timeline>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `
})
export class WorkorderTimelineDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<WorkorderTimelineDialogComponent>
  ) {}
}
