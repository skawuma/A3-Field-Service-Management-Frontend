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
    <div class="p-4 max-h-[70vh] overflow-y-auto">

      <h3 class="text-lg font-semibold mb-4">Timeline</h3>

      <!-- Loading -->
      <div *ngIf="loading" class="flex items-center gap-3 text-gray-500">
        <mat-spinner diameter="28"></mat-spinner>
        Loading timeline...
      </div>

      <!-- Error -->
      <div *ngIf="error" class="text-red-600 flex flex-col gap-2 items-start">
        <div class="flex items-center gap-2">
          <mat-icon>error_outline</mat-icon>
          {{ error }}
        </div>
        <button mat-stroked-button color="primary" (click)="loadEvents()">Retry</button>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && !error && events.length === 0" class="text-gray-500 flex flex-col items-center gap-2 mt-6">
        <mat-icon>history</mat-icon>
        No events yet.
      </div>

      <!-- Timeline -->
      <div *ngIf="events.length > 0" class="relative border-l border-gray-300 mt-2 pl-6">

        <div
          *ngFor="let ev of events; let last = last"
          class="mb-6 relative">

          <!-- Dot -->
          <div class="w-3 h-3 rounded-full bg-primary absolute -left-[7px] top-1 shadow"></div>

          <!-- Card -->
          <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">

            <!-- Header -->
            <div class="flex items-center justify-between">
              <span class="px-2 py-1 text-xs rounded-full text-white"
                    [ngClass]="getBadgeClass(ev.eventType)">
                {{ ev.eventType }}
              </span>

              <span class="text-xs text-gray-500">
                {{ ev.createdAt | date:'short' }}
              </span>
            </div>

            <div class="mt-2 text-sm">
              {{ ev.message }}
            </div>

            <!-- Meta -->
            <div class="mt-2 text-xs text-gray-600 space-y-1" *ngIf="ev.actor || ev.oldValue || ev.newValue">

              <div *ngIf="ev.actor">
                <strong>By:</strong> {{ ev.actor }}
              </div>

              <div *ngIf="ev.oldValue || ev.newValue">
                <strong>Change:</strong>
                <span *ngIf="ev.oldValue">from "<em>{{ ev.oldValue }}</em>"</span>
                <span *ngIf="ev.newValue">to "<em>{{ ev.newValue }}</em>"</span>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    .bg-primary {
      background-color: #3f51b5;
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
      next: res => {
           console.log(this.events);

              console.log(res);
        this.events = res;
        this.loading = false;
      },
      error: () => {
        console.log(this.events);
        this.error = 'Failed to load events.';
        this.loading = false;
      }
    });
}


  getBadgeClass(type: string) {
    const map: any = {
      CREATED: 'bg-green-600',
      STATUS_CHANGED: 'bg-orange-600',
      ASSIGNED_TECHNICIAN: 'bg-blue-600',
      COMPLETED: 'bg-green-800'
    };
    return map[type] || 'bg-gray-600';
  }
}
