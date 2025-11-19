import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from '../../services/api-service';
import { MATERIAL_IMPORTS } from '../../../material-imports';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="dashboard-container">
      <h2 class="title">Dashboard</h2>

      <div class="cards-grid">
        <mat-card class="dashboard-card">
          <mat-card-title>Total Technicians</mat-card-title>
          <mat-card-content>
            <h1>{{ totalTechnicians }}</h1>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-title>Active Technicians</mat-card-title>
          <mat-card-content>
            <h1>{{ activeTechnicians }}</h1>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-title>Total Work Orders</mat-card-title>
          <mat-card-content>
            <h1>{{ totalWorkOrders }}</h1>
          </mat-card-content>
        </mat-card>

        <mat-card class="dashboard-card">
          <mat-card-title>Open Work Orders</mat-card-title>
          <mat-card-content>
            <h1>{{ openWorkOrders }}</h1>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 16px;
    }

    .title {
      margin-bottom: 20px;
      font-size: 24px;
      font-weight: 600;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 20px;
    }

    .dashboard-card {
      padding: 16px;
      text-align: center;
    }

    mat-card-title {
      font-size: 16px;
    }

    h1 {
      margin: 0;
      font-size: 40px;
      font-weight: 700;
      text-align: center;
    }
  `]
})
export class DashboardComponent implements OnInit {

  totalTechnicians = 0;
  activeTechnicians = 0;

  totalWorkOrders = 0;
  openWorkOrders = 0;

  constructor(
    private api: ApiService
  ) {}

  ngOnInit() {
    this.loadTechnicians();
    this.loadWorkOrders();
  }

  loadTechnicians() {
    // this.api.getPage<any>('technicians', 0, 1000).subscribe({
    //   next: (res) => {
    //     this.totalTechnicians = res.totalElements;
    //     this.activeTechnicians = res.content.filter((t: any) => t.status === 'ACTIVE').length;
    //   },
    //   error: (err) => console.error('Failed to load technicians', err)
    // });
  }

  loadWorkOrders() {
    // this.api.getPage<any>('workorders', 0, 1000).subscribe({
    //   next: (res) => {
    //     this.totalWorkOrders = res.totalElements;
    //     this.openWorkOrders = res.content.filter((wo: any) => wo.status === 'OPEN').length;
    //   },
    //   error: (err) => console.error('Failed to load work orders', err)
    // });
  }
}

