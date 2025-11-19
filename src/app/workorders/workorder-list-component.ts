import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api-service';


interface WorkOrder {
  id: number;
  clientName: string;
  address: string;
  description: string;
  status: string;
  assignedTechId: number | null;
  scheduledDate: string | null;
  priority: string | null;
}

@Component({
  selector: 'app-workorders-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2 class="text-2xl font-semibold mb-4">Work Orders</h2>

    <table class="min-w-full border border-slate-700 text-sm">
      <thead class="bg-slate-800">
        <tr>
          <th class="px-3 py-2 text-left">Client</th>
          <th class="px-3 py-2 text-left">Address</th>
          <th class="px-3 py-2 text-left">Status</th>
          <th class="px-3 py-2 text-left">Scheduled</th>
          <th class="px-3 py-2 text-left">Priority</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let w of workorders" class="border-t border-slate-700">
          <td class="px-3 py-2">{{ w.clientName }}</td>
          <td class="px-3 py-2">{{ w.address }}</td>
          <td class="px-3 py-2">{{ w.status }}</td>
          <td class="px-3 py-2">{{ w.scheduledDate || '-' }}</td>
          <td class="px-3 py-2">{{ w.priority || '-' }}</td>
        </tr>
      </tbody>
    </table>
  `
})
export class WorkordersListComponent implements OnInit {
  workorders: WorkOrder[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<WorkOrder[]>('workorders').subscribe({
      next: data => this.workorders = data,
      error: err => console.error('Failed to load workorders', err)
    });
  }
}
