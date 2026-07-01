export interface OperationsReportBucket {
  key: string;
  label: string;
  total: number;
}

export interface OperationsReportSummary {
  totalWorkOrders: number;
  activeWorkOrders: number;
  completedWorkOrders: number;
  cancelledWorkOrders: number;
  breachedWorkOrders: number;
  completedWithinSla: number;
  slaCompliancePercent: number;
  averageTimeToAssignMinutes: number | null;
  averageTimeToStartMinutes: number | null;
  averageResolutionMinutes: number | null;
}

export interface OperationsReportTechnician {
  technicianId: number;
  technicianName: string;
  completedCount: number;
  withinSlaCount: number;
  breachedCount: number;
  compliancePercent: number;
  averageCompletionMinutes: number | null;
}

export interface OperationsReportWorkOrder {
  id: number;
  reference: string;
  clientName: string;
  description: string;
  status: string;
  priority: string;
  scheduledDate: string | null;
  technicianName: string;
  slaOutcome: string;
  resolutionMinutes: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface OperationsReport {
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  scope: string;
  summary: OperationsReportSummary;
  workOrdersByStatus: OperationsReportBucket[];
  workOrdersByPriority: OperationsReportBucket[];
  technicianPerformance: OperationsReportTechnician[];
  workOrders: OperationsReportWorkOrder[];
}
