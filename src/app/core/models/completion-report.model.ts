export interface WorkOrderCompletionReportRequest {
  faTag: string;
  issueResolved: boolean;
  replacementNeeded: 'YES' | 'NO' | 'PROBABLE';
  returnVisitRequired: boolean;
  summaryOfWork: string;
}

export interface WorkOrderCompletionReportResponse {
  id: number;
  workOrderId: number;
  faTag: string;
  issueResolved: boolean;
  replacementNeeded: 'YES' | 'NO' | 'PROBABLE';
  returnVisitRequired: boolean;
  summaryOfWork: string;
  completedAt: string;
  completedByUserId: number;
}