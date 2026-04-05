import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MATERIAL_IMPORTS } from '../material-imports';

@Component({
  selector: 'app-workorder-complete-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MATERIAL_IMPORTS],
  template: `
    <h2 mat-dialog-title>Complete & Sign Off</h2>

    <mat-dialog-content>
      <div class="dialog-body">

        <div class="summary-box">
          <div><strong>Work Order:</strong> #{{ data?.workorder?.id }}</div>
          <div><strong>Client:</strong> {{ data?.workorder?.clientName }}</div>
        </div>

        <p class="helper-text">
          Complete the structured report, add final notes, and sign below to close this work order.
        </p>

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
            rows="4"
            [(ngModel)]="form.summaryOfWork"
            placeholder="Describe what was done onsite...">
          </textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Completion Notes</mat-label>
          <textarea
            matInput
            rows="3"
            [(ngModel)]="form.completionNotes"
            placeholder="Optional final sign-off notes...">
          </textarea>
        </mat-form-field>

        <div class="signature-section">
          <div class="signature-header">
            <span class="signature-label">Technician Signature</span>

            <button
              mat-stroked-button
              color="warn"
              type="button"
              (click)="clearSignature()"
              [disabled]="submitting">
              Clear
            </button>
          </div>

          <canvas
            #signatureCanvas
            class="signature-canvas"
            width="700"
            height="220"
            (mousedown)="startDraw($event)"
            (mousemove)="draw($event)"
            (mouseup)="endDraw()"
            (mouseleave)="endDraw()"
            (touchstart)="startTouch($event)"
            (touchmove)="moveTouch($event)"
            (touchend)="endDraw()">
          </canvas>

          <p class="signature-hint">
            Use your mouse or finger to sign.
          </p>
        </div>

      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button
        mat-stroked-button
        type="button"
        (click)="close()"
        [disabled]="submitting">
        Cancel
      </button>

      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="submitting"
        (click)="submit()">
        <mat-spinner *ngIf="submitting" diameter="18"></mat-spinner>
        <span *ngIf="!submitting">Complete Work Order</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 680px;
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

    .helper-text {
      margin: 0;
      color: #4b5563;
      font-size: 14px;
    }

    .full-width {
      width: 100%;
    }

    .signature-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .signature-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .signature-label {
      font-weight: 600;
      color: #1f2937;
    }

    .signature-canvas {
      width: 100%;
      max-width: 100%;
      border: 2px dashed #cbd5e1;
      border-radius: 10px;
      background: #ffffff;
      touch-action: none;
      cursor: crosshair;
      box-sizing: border-box;
    }

    .signature-hint {
      margin: 0;
      font-size: 12px;
      color: #6b7280;
    }

    @media (max-width: 768px) {
      .dialog-body {
        min-width: unset;
      }
    }
  `]
})
export class WorkorderCompleteDialogComponent implements AfterViewInit {
  @ViewChild('signatureCanvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  submitting = false;

  form = {
    faTag: '',
    issueResolved: true,
    replacementNeeded: 'NO',
    returnVisitRequired: false,
    summaryOfWork: '',
    completionNotes: ''
  };

  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private hasSignature = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { workorder: any },
    private dialogRef: MatDialogRef<WorkorderCompleteDialogComponent>
  ) {}

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not initialize signature canvas.');
    }

    this.ctx = ctx;
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#111827';

    this.fillCanvasBackground();
  }

  private fillCanvasBackground() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  private getCoordinates(event: MouseEvent | Touch): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  startDraw(event: MouseEvent) {
    this.drawing = true;
    const { x, y } = this.getCoordinates(event);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  draw(event: MouseEvent) {
    if (!this.drawing) return;

    const { x, y } = this.getCoordinates(event);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.hasSignature = true;
  }

  startTouch(event: TouchEvent) {
    event.preventDefault();

    if (!event.touches.length) return;

    this.drawing = true;
    const { x, y } = this.getCoordinates(event.touches[0]);
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  moveTouch(event: TouchEvent) {
    event.preventDefault();

    if (!this.drawing || !event.touches.length) return;

    const { x, y } = this.getCoordinates(event.touches[0]);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.hasSignature = true;
  }

  endDraw() {
    if (!this.ctx) return;
    this.drawing = false;
    this.ctx.closePath();
  }

  clearSignature() {
    if (this.submitting) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.fillCanvasBackground();
    this.hasSignature = false;
  }

  close() {
    if (this.submitting) return;
    this.dialogRef.close();
  }

  submit() {
    if (this.submitting) return;

    if (!this.form.faTag.trim()) {
      alert('FA Tag / Device is required.');
      return;
    }

    if (!this.form.summaryOfWork.trim()) {
      alert('Summary of Work Performed is required.');
      return;
    }

    if (!this.hasSignature) {
      alert('Signature is required before completion.');
      return;
    }

    this.submitting = true;

    const signatureDataUrl = this.canvasRef.nativeElement.toDataURL('image/png');

    this.dialogRef.close({
      faTag: this.form.faTag.trim(),
      issueResolved: this.form.issueResolved,
      replacementNeeded: this.form.replacementNeeded,
      returnVisitRequired: this.form.returnVisitRequired,
      summaryOfWork: this.form.summaryOfWork.trim(),
      completionNotes: this.form.completionNotes?.trim() || '',
      signatureDataUrl
    });
  }
}
