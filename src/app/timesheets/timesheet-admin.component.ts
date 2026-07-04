import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MATERIAL_IMPORTS } from '../material-imports';
import { NotificationService } from '../core/services/notification.service';
import { Timesheet, TimesheetStatus } from './timesheet.models';
import { TimesheetExportService } from './timesheet-export.service';
import { TimesheetService } from './timesheet.service';

@Component({
  selector: 'app-timesheet-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './timesheet-admin.component.html',
  styleUrl: './timesheet-admin.component.scss',
})
export class TimesheetAdminComponent implements OnInit {
  timesheets: Timesheet[] = [];
  loading = true;
  loadError = false;
  weekStart = '';
  technicianId: number | null = null;
  status: TimesheetStatus | '' = '';
  technicians: Array<{ id: number; name: string }> = [];
  readonly statuses: TimesheetStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPORTED'];

  constructor(
    private readonly router: Router,
    private readonly timesheetService: TimesheetService,
    private readonly exports: TimesheetExportService,
    private readonly notify: NotificationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.timesheetService.getAll({
      weekStart: this.weekStart || undefined,
      technicianId: this.technicianId,
      status: this.status,
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (timesheets) => {
        this.timesheets = timesheets;
        const options = new Map(this.technicians.map((technician) => [technician.id, technician.name]));
        timesheets.forEach((timesheet) => options.set(timesheet.technicianId, timesheet.technicianName));
        this.technicians = [...options.entries()]
          .map(([id, name]) => ({ id, name }))
          .sort((left, right) => left.name.localeCompare(right.name));
      },
      error: (error: HttpErrorResponse) => {
        this.loadError = true;
        console.error('[Timesheets] Payroll queue request failed', {
          status: error.status,
          url: error.url,
          message: error.message,
        });
      },
    });
  }

  clearFilters(): void {
    this.weekStart = '';
    this.technicianId = null;
    this.status = '';
    this.load();
  }

  open(timesheet: Timesheet): void {
    this.router.navigate(['/timesheets', timesheet.id]);
  }

  exportCsv(timesheet: Timesheet, event: Event): void {
    event.stopPropagation();
    this.timesheetService.downloadCsv(timesheet.id).subscribe({
      next: (blob) => this.download(blob, `a3-fsm-timesheet-${timesheet.weekStartDate}.csv`),
      error: (error: HttpErrorResponse) => this.notify.error(this.apiMessage(error, 'Unable to export CSV.')),
    });
  }

  exportPdf(timesheet: Timesheet, event: Event): void {
    event.stopPropagation();
    this.exports.exportPdf(timesheet);
  }

  statusLabel(value: string): string {
    return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
  }

  totalMiles(timesheet: Timesheet): number {
    return timesheet.entries.reduce((total, entry) => total + (Number(entry.miles) || 0), 0);
  }

  trackTimesheet(_: number, timesheet: Timesheet): number {
    return timesheet.id;
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private apiMessage(error: HttpErrorResponse, fallback: string): string {
    return typeof error.error?.message === 'string' ? error.error.message : fallback;
  }
}
