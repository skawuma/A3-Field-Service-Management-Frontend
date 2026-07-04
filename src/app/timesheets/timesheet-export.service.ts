import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Timesheet } from './timesheet.models';

@Injectable({ providedIn: 'root' })
export class TimesheetExportService {
  exportPdf(timesheet: Timesheet): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const width = doc.internal.pageSize.getWidth();

    doc.setFillColor(15, 39, 66);
    doc.rect(0, 0, width, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.text('A3 FSM Weekly Timesheet', 14, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Contract completion and payroll record', 14, 21);
    doc.text(`Status: ${this.label(timesheet.status)}`, width - 14, 21, { align: 'right' });

    doc.setTextColor(19, 34, 56);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Tech Name: ${timesheet.technicianName}`, 14, 40);
    doc.text(
      `Week: ${this.date(timesheet.weekStartDate)} - ${this.date(timesheet.weekEndDate)}`,
      14,
      47,
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Project Site Location: ${this.locations(timesheet) || 'No completed project sites'}`, 14, 55, {
      maxWidth: width - 28,
    });

    autoTable(doc, {
      startY: 63,
      head: [['Date', 'Miles', 'Onsite', 'Break start', 'Break end', 'Offsite', 'Comments']],
      body: timesheet.entries.length
        ? timesheet.entries.map((entry) => [
            this.date(entry.workDate),
            entry.miles ?? '',
            this.time(entry.onsiteStartTime),
            this.time(entry.breakStartTime),
            this.time(entry.breakEndTime),
            this.time(entry.offsiteEndTime),
            entry.comments ?? '',
          ])
        : [['No completed work orders for this week', '', '', '', '', '', '']],
      theme: 'grid',
      styles: { fontSize: 7.4, cellPadding: 2.3, textColor: [38, 55, 72], overflow: 'linebreak' },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [246, 249, 252] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 14, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 70 },
      },
      margin: { left: 14, right: 14, bottom: 28 },
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 85;
    const signatureY = Math.min(finalY + 14, 242);
    doc.setTextColor(19, 34, 56);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`Technician Signature: ${timesheet.technicianSignatureText || 'Pending'}`, 14, signatureY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated ${new Date().toLocaleString()}`, 14, signatureY + 7);
    doc.text('A3 Field Service Management | Sprint 13 Payroll Automation', width - 14, 268, {
      align: 'right',
    });

    doc.save(`a3-fsm-timesheet-${timesheet.weekStartDate}-${timesheet.technicianName.replace(/\s+/g, '-')}.pdf`);
  }

  private locations(timesheet: Timesheet): string {
    return [...new Set(timesheet.entries.map((entry) => {
      const cityState = [entry.city, entry.state, entry.zip].filter(Boolean).join(' ');
      return [entry.clientName, entry.siteAddress, cityState].filter(Boolean).join(', ');
    }).filter(Boolean))].join(' | ');
  }

  private date(value: string): string {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
  }

  private time(value: string | null): string {
    return value ? value.slice(0, 5) : '';
  }

  private label(value: string): string {
    return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
