import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../material-imports';
import { ApiService } from '../core/services/api-service';

export interface WorkOrderEvent {
  id: number;
  eventType: string;
  createdAt: string;
  message: string;
  oldValue?: string | null;
  newValue?: string | null;
  actor?: string | null;
}

@Component({
  selector: 'app-workorder-timeline',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="timeline-container">

      <div class="timeline-header">
        <h3 class="timeline-title">Timeline</h3>
        <p class="timeline-subtitle" *ngIf="!loading && !error && events.length > 0">
          {{ events.length }} event{{ events.length === 1 ? '' : 's' }}
        </p>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="state-block">
        <mat-spinner diameter="28"></mat-spinner>
        <span>Loading timeline...</span>
      </div>

      <!-- Error -->
      <div *ngIf="error" class="error-block">
        <div class="error-message">
          <mat-icon>error_outline</mat-icon>
          <span>{{ error }}</span>
        </div>
        <button mat-stroked-button color="primary" (click)="loadEvents()">Retry</button>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && !error && events.length === 0" class="empty-block">
        <mat-icon>history</mat-icon>
        <span>No activity yet.</span>
      </div>

      <!-- Timeline -->
      <div *ngIf="events.length > 0" class="timeline-list">
        <div *ngFor="let ev of events" class="timeline-item">

          <!-- Dot -->
          <div class="timeline-dot" [ngClass]="getDotClass(ev.eventType)"></div>

          <!-- Card -->
          <div class="timeline-card">

            <!-- Header -->
            <div class="timeline-card-header">
              <span class="event-chip" [ngClass]="getBadgeClass(ev.eventType)">
                {{ formatEventType(ev.eventType) }}
              </span>

              <span class="event-date">
                {{ ev.createdAt | date:'MMM d, y • h:mm a' }}
              </span>
            </div>

            <!-- Main message -->
            <div class="event-message">
              {{ ev.message }}
            </div>

            <!-- Meta -->
            <div class="event-meta" *ngIf="ev.actor || ev.oldValue || ev.newValue">

              <div *ngIf="ev.actor" class="meta-row">
                <span class="meta-label">By</span>
                <span class="meta-value">{{ ev.actor }}</span>
              </div>

              <div *ngIf="ev.oldValue || ev.newValue" class="meta-row">
                <span class="meta-label">Change</span>
                <span class="meta-value">
                  <ng-container *ngIf="ev.oldValue">
                    from <em>"{{ ev.oldValue }}"</em>
                  </ng-container>
                  <ng-container *ngIf="ev.newValue">
                    to <em>"{{ ev.newValue }}"</em>
                  </ng-container>
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .timeline-container {
      width: 100%;
    }

    .timeline-header {
      margin-bottom: 14px;
    }

    .timeline-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .timeline-subtitle {
      margin: 4px 0 0;
      font-size: 12px;
      color: #6b7280;
    }

    .state-block,
    .empty-block {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #6b7280;
      padding: 12px 0;
    }

    .empty-block {
      justify-content: center;
      flex-direction: column;
      padding: 24px 0;
    }

    .error-block {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
      color: #b91c1c;
      padding: 12px 0;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .timeline-list {
      position: relative;
      margin-left: 10px;
      padding-left: 24px;
      border-left: 2px solid #e5e7eb;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 18px;
    }

    .timeline-item:last-child {
      margin-bottom: 0;
    }

    .timeline-dot {
      position: absolute;
      left: -31px;
      top: 16px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 0 2px #e5e7eb;
      background: #9ca3af;
    }

    .timeline-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 14px 16px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }

    .timeline-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .event-chip {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: white;
    }

    .event-date {
      font-size: 12px;
      color: #6b7280;
      white-space: nowrap;
    }

    .event-message {
      margin-top: 10px;
      font-size: 14px;
      color: #111827;
      line-height: 1.45;
    }

    .event-meta {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-top: 10px;
      border-top: 1px dashed #e5e7eb;
    }

    .meta-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 12px;
      color: #4b5563;
    }

    .meta-label {
      font-weight: 700;
      color: #374151;
      min-width: 54px;
    }

    .meta-value em {
      font-style: italic;
      color: #111827;
    }

    /* Badge colors */
    .chip-created {
      background: #16a34a;
    }

    .chip-status {
      background: #ea580c;
    }

    .chip-assigned {
      background: #2563eb;
    }

    .chip-updated {
      background: #7c3aed;
    }

    .chip-scheduled {
      background: #0891b2;
    }

    .chip-note {
      background: #4f46e5;
    }

    .chip-completed {
      background: #15803d;
    }

    .chip-default {
      background: #6b7280;
    }

    /* Dot colors */
    .dot-created {
      background: #16a34a;
    }

    .dot-status {
      background: #ea580c;
    }

    .dot-assigned {
      background: #2563eb;
    }

    .dot-updated {
      background: #7c3aed;
    }

    .dot-scheduled {
      background: #0891b2;
    }

    .dot-note {
      background: #4f46e5;
    }

    .dot-completed {
      background: #15803d;
    }

    .dot-default {
      background: #9ca3af;
    }
  `]
})
export class WorkorderTimelineComponent implements OnInit {

  @Input({ required: true }) workorderId!: number;

  events: WorkOrderEvent[] = [];
  loading = false;
  error?: string;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.loading = true;
    this.error = undefined;

    this.api.get<WorkOrderEvent[]>(`workorders/${this.workorderId}/events`)
      .subscribe({
        next: (res) => {
          this.events = res;
          this.loading = false;
        },
        error: () => {
          this.error = 'Failed to load timeline.';
          this.loading = false;
        }
      });
  }

  formatEventType(type: string): string {
    const map: Record<string, string> = {
      CREATED: 'Created',
      STATUS_CHANGED: 'Status Changed',
      ASSIGNED_TECHNICIAN: 'Assigned Technician',
      UNASSIGNED_TECHNICIAN: 'Released For Reassignment',
      REOPENED: 'Reopened',
      UPDATED_DETAILS: 'Updated Details',
      PRIORITY_CHANGED: 'Priority Changed',
      SCHEDULED_DATE_CHANGED: 'Scheduled Date Changed',
      NOTE_ADDED: 'Note Added',
      ATTACHMENT_ADDED: 'Attachment Added',
      COMPLETED: 'Completed'
    };

    return map[type] || type.replaceAll('_', ' ');
  }

  getBadgeClass(type: string): string {
    const map: Record<string, string> = {
      CREATED: 'chip-created',
      STATUS_CHANGED: 'chip-status',
      ASSIGNED_TECHNICIAN: 'chip-assigned',
      UNASSIGNED_TECHNICIAN: 'chip-assigned',
      REOPENED: 'chip-status',
      UPDATED_DETAILS: 'chip-updated',
      PRIORITY_CHANGED: 'chip-updated',
      SCHEDULED_DATE_CHANGED: 'chip-scheduled',
      NOTE_ADDED: 'chip-note',
      ATTACHMENT_ADDED: 'chip-note',
      COMPLETED: 'chip-completed'
    };

    return map[type] || 'chip-default';
  }

  getDotClass(type: string): string {
    const map: Record<string, string> = {
      CREATED: 'dot-created',
      STATUS_CHANGED: 'dot-status',
      ASSIGNED_TECHNICIAN: 'dot-assigned',
      UNASSIGNED_TECHNICIAN: 'dot-assigned',
      REOPENED: 'dot-status',
      UPDATED_DETAILS: 'dot-updated',
      PRIORITY_CHANGED: 'dot-updated',
      SCHEDULED_DATE_CHANGED: 'dot-scheduled',
      NOTE_ADDED: 'dot-note',
      ATTACHMENT_ADDED: 'dot-note',
      COMPLETED: 'dot-completed'
    };

    return map[type] || 'dot-default';
  }
}
