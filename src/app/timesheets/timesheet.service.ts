import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../core/services/api-service';
import {
  Timesheet,
  TimesheetEntry,
  TimesheetEntryUpdate,
  TimesheetFilters,
} from './timesheet.models';

@Injectable({ providedIn: 'root' })
export class TimesheetService {
  constructor(private readonly api: ApiService) {}

  getMyCurrent(): Observable<Timesheet> {
    return this.api.get<Timesheet>('timesheets/my/current');
  }

  getMyForWeek(weekStart: string): Observable<Timesheet> {
    return this.api.get<Timesheet>(`timesheets/my?weekStart=${encodeURIComponent(weekStart)}`);
  }

  getById(id: number): Observable<Timesheet> {
    return this.api.get<Timesheet>(`timesheets/${id}`);
  }

  getAll(filters: TimesheetFilters = {}): Observable<Timesheet[]> {
    const params = new URLSearchParams();
    if (filters.weekStart) params.set('weekStart', filters.weekStart);
    if (filters.technicianId) params.set('technicianId', String(filters.technicianId));
    if (filters.status) params.set('status', filters.status);
    const query = params.toString();
    return this.api.get<Timesheet[]>(`timesheets${query ? `?${query}` : ''}`);
  }

  updateEntry(entryId: number, update: TimesheetEntryUpdate): Observable<TimesheetEntry> {
    return this.api.put<TimesheetEntry>(`timesheets/entries/${entryId}`, update);
  }

  submit(id: number, technicianSignatureText: string): Observable<Timesheet> {
    return this.api.post<Timesheet>(`timesheets/${id}/submit`, { technicianSignatureText });
  }

  approve(id: number): Observable<Timesheet> {
    return this.api.post<Timesheet>(`timesheets/${id}/approve`, {});
  }

  reject(id: number): Observable<Timesheet> {
    return this.api.post<Timesheet>(`timesheets/${id}/reject`, {});
  }

  downloadCsv(id: number): Observable<Blob> {
    return this.api.downloadBlob(`timesheets/${id}/export/csv`);
  }
}
