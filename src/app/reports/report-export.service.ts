import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { OperationsReport } from './report.models';

@Injectable({ providedIn: 'root' })
export class ReportExportService {
  exportCsv(report: OperationsReport): void {
    const rows = [
      [
        'Work Order',
        'Client',
        'Description',
        'Status',
        'Priority',
        'Scheduled Date',
        'Technician',
        'SLA Outcome',
        'Resolution Minutes',
        'Created At',
        'Completed At',
      ],
      ...report.workOrders.map((workOrder) => [
        workOrder.reference,
        workOrder.clientName,
        workOrder.description,
        this.label(workOrder.status),
        this.label(workOrder.priority),
        workOrder.scheduledDate ?? '',
        workOrder.technicianName,
        this.label(workOrder.slaOutcome),
        workOrder.resolutionMinutes ?? '',
        workOrder.createdAt,
        workOrder.completedAt ?? '',
      ]),
    ];

    const csv = rows.map((row) => row.map((value) => this.csvCell(value)).join(',')).join('\r\n');
    this.download(
      new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }),
      this.filename(report, 'csv'),
    );
  }

  exportPdf(report: OperationsReport): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const summary = report.summary;

    doc.setFillColor(17, 54, 91);
    doc.rect(0, 0, pageWidth, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('A3 FSM Operations Report', 14, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${this.formatDate(report.periodStart)} - ${this.formatDate(report.periodEnd)} | ${report.scope}`, 14, 22);
    doc.text(`Generated ${this.formatDateTime(report.generatedAt)}`, pageWidth - 14, 22, { align: 'right' });

    const metrics = [
      ['Total work orders', summary.totalWorkOrders],
      ['Active', summary.activeWorkOrders],
      ['Completed', summary.completedWorkOrders],
      ['SLA compliance', `${summary.slaCompliancePercent.toFixed(1)}%`],
      ['SLA breached', summary.breachedWorkOrders],
      ['Avg. resolution', this.duration(summary.averageResolutionMinutes)],
    ];

    autoTable(doc, {
      startY: 39,
      head: [metrics.map(([label]) => label)],
      body: [metrics.map(([, value]) => String(value))],
      theme: 'grid',
      styles: { halign: 'center', cellPadding: 3.5, fontSize: 9 },
      headStyles: { fillColor: [231, 240, 249], textColor: [45, 68, 90], fontStyle: 'bold' },
      bodyStyles: { textColor: [15, 38, 60], fontStyle: 'bold', fontSize: 12 },
      margin: { left: 14, right: 14 },
    });

    let nextY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
    doc.setTextColor(15, 38, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Technician SLA performance', 14, nextY + 10);

    autoTable(doc, {
      startY: nextY + 14,
      head: [['Technician', 'Completed', 'Within SLA', 'Breached', 'Compliance', 'Avg. execution']],
      body: report.technicianPerformance.length
        ? report.technicianPerformance.map((technician) => [
            technician.technicianName,
            technician.completedCount,
            technician.withinSlaCount,
            technician.breachedCount,
            `${technician.compliancePercent.toFixed(1)}%`,
            this.duration(technician.averageCompletionMinutes),
          ])
        : [['No completed technician work in this period', '', '', '', '', '']],
      theme: 'striped',
      styles: { cellPadding: 2.5, fontSize: 8.5, textColor: [38, 55, 72] },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [246, 249, 252] },
      margin: { left: 14, right: 14 },
    });

    nextY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? nextY + 30;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Work-order detail', 14, nextY + 10);

    autoTable(doc, {
      startY: nextY + 14,
      head: [['WO', 'Client', 'Description', 'Status', 'Priority', 'Scheduled', 'Technician', 'SLA', 'Resolution']],
      body: report.workOrders.map((workOrder) => [
        workOrder.reference,
        workOrder.clientName,
        workOrder.description,
        this.label(workOrder.status),
        this.label(workOrder.priority),
        workOrder.scheduledDate ? this.formatDate(workOrder.scheduledDate) : '-',
        workOrder.technicianName,
        this.label(workOrder.slaOutcome),
        this.duration(workOrder.resolutionMinutes),
      ]),
      theme: 'striped',
      styles: { cellPadding: 2.2, fontSize: 7.2, overflow: 'linebreak', textColor: [38, 55, 72] },
      headStyles: { fillColor: [17, 54, 91], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [246, 249, 252] },
      columnStyles: {
        0: { cellWidth: 14 },
        1: { cellWidth: 31 },
        2: { cellWidth: 58 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18 },
        5: { cellWidth: 21 },
        6: { cellWidth: 31 },
        7: { cellWidth: 20 },
        8: { cellWidth: 23 },
      },
      margin: { left: 14, right: 14, bottom: 14 },
      didDrawPage: () => {
        const page = doc.getNumberOfPages();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text('A3 Field Service Management | Sprint 12 Product Polish', 14, 203);
        doc.text(`Page ${page}`, pageWidth - 14, 203, { align: 'right' });
      },
    });

    doc.save(this.filename(report, 'pdf'));
  }

  private csvCell(value: string | number): string {
    return `"${String(value).replace(/"/g, '""')}"`;
  }

  private filename(report: OperationsReport, extension: 'csv' | 'pdf'): string {
    return `a3-fsm-operations-${report.periodStart}-to-${report.periodEnd}.${extension}`;
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private duration(minutes: number | null): string {
    if (minutes === null || minutes === undefined) {
      return 'Pending';
    }
    if (minutes < 60) {
      return `${minutes}m`;
    }
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  }

  private label(value: string): string {
    return value
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
  }

  private formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  }
}
