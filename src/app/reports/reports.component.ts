import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MATERIAL_IMPORTS } from '../material-imports';
import { ApiService } from '../core/services/api-service';
import { NotificationService } from '../core/services/notification.service';
import { OperationsReport } from './report.models';
import { ReportExportService } from './report-export.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, ...MATERIAL_IMPORTS],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  from = '';
  to = '';
  loading = false;
  loadError = false;
  report: OperationsReport | null = null;

  statusChartData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  priorityChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  readonly doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
  };
  readonly barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
    plugins: { legend: { display: false } },
  };

  constructor(
    private readonly api: ApiService,
    private readonly exports: ReportExportService,
    private readonly notify: NotificationService,
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    this.to = this.toInputDate(today);
    this.from = this.toInputDate(start);
    this.loadReport();
  }

  loadReport(): void {
    if (!this.from || !this.to || this.from > this.to) {
      this.notify.warn('Choose a valid report date range.');
      return;
    }

    this.loading = true;
    this.loadError = false;
    this.api
      .get<OperationsReport>(`reports/operations?from=${encodeURIComponent(this.from)}&to=${encodeURIComponent(this.to)}`)
      .subscribe({
        next: (report) => {
          this.report = report;
          this.buildCharts(report);
          this.loading = false;
        },
        error: () => {
          this.loadError = true;
          this.loading = false;
          this.notify.error('Unable to load the operations report.');
        },
      });
  }

  exportCsv(): void {
    if (this.report) {
      this.exports.exportCsv(this.report);
    }
  }

  exportPdf(): void {
    if (this.report) {
      this.exports.exportPdf(this.report);
    }
  }

  formatDuration(minutes: number | null): string {
    if (minutes === null || minutes === undefined) {
      return 'Pending';
    }
    return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }

  label(value: string): string {
    return value
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  trackWorkOrder(_: number, workOrder: { id: number }): number {
    return workOrder.id;
  }

  private buildCharts(report: OperationsReport): void {
    this.statusChartData = {
      labels: report.workOrdersByStatus.map((bucket) => bucket.label),
      datasets: [
        {
          data: report.workOrdersByStatus.map((bucket) => bucket.total),
          backgroundColor: ['#2563eb', '#7c3aed', '#0ea5e9', '#f59e0b', '#16a34a', '#dc2626', '#64748b'],
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    };

    this.priorityChartData = {
      labels: report.workOrdersByPriority.map((bucket) => bucket.label),
      datasets: [
        {
          data: report.workOrdersByPriority.map((bucket) => bucket.total),
          backgroundColor: ['#dc2626', '#f97316', '#2563eb', '#16a34a', '#94a3b8'],
          borderRadius: 8,
          maxBarThickness: 48,
        },
      ],
    };
  }

  private toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
