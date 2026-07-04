import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MATERIAL_IMPORTS } from '../material-imports';
import { AuthService } from '../core/services/auth-service';
import { NotificationService } from '../core/services/notification.service';
import { Timesheet, TimesheetEntry, TimesheetEntryUpdate } from './timesheet.models';
import { TimesheetExportService } from './timesheet-export.service';
import { TimesheetService } from './timesheet.service';

@Component({
  selector: 'app-timesheet-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './timesheet-detail.component.html',
  styleUrl: './timesheet-detail.component.scss',
})
export class TimesheetDetailComponent implements OnInit {
  timesheet: Timesheet | null = null;
  loading = true;
  saving = false;
  loadError = false;
  selectedWeekStart = '';
  signatureText = '';
  readonly role: string | null;
  readonly isTech: boolean;
  readonly isReviewer: boolean;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly timesheets: TimesheetService,
    private readonly exports: TimesheetExportService,
    private readonly notify: NotificationService,
  ) {
    this.role = this.auth.getRole();
    this.isTech = this.role === 'TECH';
    this.isReviewer = this.role === 'ADMIN' || this.role === 'DISPATCH';
  }

  ngOnInit(): void {
    this.load();
  }

  get editable(): boolean {
    return this.isTech && !!this.timesheet && ['DRAFT', 'REJECTED'].includes(this.timesheet.status);
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const request = Number.isFinite(id) && id > 0
      ? this.timesheets.getById(id)
      : this.timesheets.getMyCurrent();

    request.pipe(finalize(() => (this.loading = false))).subscribe({
      next: (timesheet) => this.applyTimesheet(timesheet),
      error: (error: HttpErrorResponse) => this.handleLoadError(error),
    });
  }

  loadWeek(): void {
    if (!this.selectedWeekStart || !this.isTech) return;
    this.loading = true;
    this.loadError = false;
    this.timesheets.getMyForWeek(this.selectedWeekStart)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (timesheet) => this.applyTimesheet(timesheet),
        error: (error: HttpErrorResponse) => this.handleLoadError(error),
      });
  }

  saveDraft(): void {
    if (!this.timesheet || !this.editable) return;
    this.saving = true;
    this.persistEntries()
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (entries) => {
          if (this.timesheet) this.timesheet.entries = entries;
          this.notify.success('Timesheet draft saved');
        },
        error: (error: HttpErrorResponse) => this.notify.error(this.apiMessage(error, 'Unable to save timesheet draft.')),
      });
  }

  submit(): void {
    if (!this.timesheet || !this.editable) return;
    if (!this.signatureText.trim()) {
      this.notify.warn('Enter your technician signature before submitting.');
      return;
    }

    this.saving = true;
    this.persistEntries()
      .pipe(
        switchMap(() => this.timesheets.submit(this.timesheet!.id, this.signatureText.trim())),
        finalize(() => (this.saving = false)),
      )
      .subscribe({
        next: (timesheet) => {
          this.applyTimesheet(timesheet);
          this.notify.success('Timesheet submitted for payroll review');
        },
        error: (error: HttpErrorResponse) => this.notify.error(this.apiMessage(error, 'Unable to submit timesheet.')),
      });
  }

  approve(): void {
    if (!this.timesheet || !this.isReviewer) return;
    this.review(this.timesheets.approve(this.timesheet.id), 'Timesheet approved');
  }

  reject(): void {
    if (!this.timesheet || !this.isReviewer) return;
    this.review(this.timesheets.reject(this.timesheet.id), 'Timesheet returned for correction');
  }

  exportCsv(): void {
    if (!this.timesheet) return;
    this.timesheets.downloadCsv(this.timesheet.id).subscribe({
      next: (blob) => this.download(blob, `a3-fsm-timesheet-${this.timesheet!.weekStartDate}.csv`),
      error: (error: HttpErrorResponse) => this.notify.error(this.apiMessage(error, 'Unable to export CSV.')),
    });
  }

  exportPdf(): void {
    if (this.timesheet) this.exports.exportPdf(this.timesheet);
  }

  goBack(): void {
    this.router.navigate([this.isTech ? '/timesheets/my' : '/timesheets/admin']);
  }

  statusLabel(status: string): string {
    return status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
  }

  site(entry: TimesheetEntry): string {
    const cityState = [entry.city, entry.state, entry.zip].filter(Boolean).join(' ');
    return [entry.siteAddress, cityState].filter(Boolean).join(', ') || 'Site not specified';
  }

  trackEntry(_: number, entry: TimesheetEntry): number {
    return entry.id;
  }

  private persistEntries(): Observable<TimesheetEntry[]> {
    if (!this.timesheet?.entries.length) return of([]);
    return forkJoin(this.timesheet.entries.map((entry) =>
      this.timesheets.updateEntry(entry.id, this.entryUpdate(entry))
    ));
  }

  private entryUpdate(entry: TimesheetEntry): TimesheetEntryUpdate {
    return {
      miles: entry.miles === null || entry.miles === undefined ? null : Number(entry.miles),
      onsiteStartTime: entry.onsiteStartTime || null,
      breakStartTime: entry.breakStartTime || null,
      breakEndTime: entry.breakEndTime || null,
      offsiteEndTime: entry.offsiteEndTime || null,
      comments: entry.comments?.trim() || null,
    };
  }

  private review(request: Observable<Timesheet>, successMessage: string): void {
    this.saving = true;
    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: (timesheet) => {
        this.applyTimesheet(timesheet);
        this.notify.success(successMessage);
      },
      error: (error: HttpErrorResponse) => this.notify.error(this.apiMessage(error, 'Unable to review timesheet.')),
    });
  }

  private applyTimesheet(timesheet: Timesheet): void {
    this.timesheet = {
      ...timesheet,
      entries: timesheet.entries.map((entry) => ({
        ...entry,
        onsiteStartTime: this.inputTime(entry.onsiteStartTime),
        breakStartTime: this.inputTime(entry.breakStartTime),
        breakEndTime: this.inputTime(entry.breakEndTime),
        offsiteEndTime: this.inputTime(entry.offsiteEndTime),
      })),
    };
    this.selectedWeekStart = timesheet.weekStartDate;
    this.signatureText = timesheet.technicianSignatureText ?? '';
  }

  private inputTime(value: string | null): string | null {
    return value ? value.slice(0, 5) : null;
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private handleLoadError(error: HttpErrorResponse): void {
    this.loadError = true;
    console.error('[Timesheets] Detail request failed', {
      status: error.status,
      url: error.url,
      message: error.message,
    });
  }

  private apiMessage(error: HttpErrorResponse, fallback: string): string {
    return typeof error.error?.message === 'string' ? error.error.message : fallback;
  }
}
