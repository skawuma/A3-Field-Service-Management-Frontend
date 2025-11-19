import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api-service';


interface Technician {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  certifications: string;
  status: string;
}

@Component({
  selector: 'app-technicians-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2 class="text-2xl font-semibold mb-4">Technicians</h2>

    <table class="min-w-full border border-slate-700 text-sm">
      <thead class="bg-slate-800">
        <tr>
          <th class="px-3 py-2 text-left">Name</th>
          <th class="px-3 py-2 text-left">Phone</th>
          <th class="px-3 py-2 text-left">Email</th>
          <th class="px-3 py-2 text-left">Certifications</th>
          <th class="px-3 py-2 text-left">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let t of technicians" class="border-t border-slate-700">
          <td class="px-3 py-2">{{ t.firstName }} {{ t.lastName }}</td>
          <td class="px-3 py-2">{{ t.phone }}</td>
          <td class="px-3 py-2">{{ t.email }}</td>
          <td class="px-3 py-2">{{ t.certifications }}</td>
          <td class="px-3 py-2">{{ t.status }}</td>
        </tr>
      </tbody>
    </table>
  `
})
export class TechniciansListComponent implements OnInit {
  technicians: Technician[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<Technician[]>('technicians').subscribe({
      next: data => this.technicians = data,
      error: err => console.error('Failed to load technicians', err)
    });
  }
}
