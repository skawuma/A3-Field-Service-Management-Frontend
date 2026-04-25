export interface RealtimeEventMetadata {
  eventKey?: string;
  workOrderRef?: string;
  clientName?: string;
  customerName?: string;
  title?: string;
  description?: string;
  scheduledDate?: string | null;
  priority?: string;
  assignedTechId?: number | null;
  assignedTechName?: string | null;
  previousTechnicianId?: number | null;
  previousTechnicianName?: string | null;
  previousStatus?: string | null;
  newStatus?: string | null;
  overdueDays?: number;
  reason?: string | null;
  reasonProvided?: boolean;
  hadSignature?: boolean;
  faTag?: string | null;
  activityTitle?: string;
  activityDescription?: string;
  statusLabel?: string;
  completedAt?: string | null;
}

export interface RealtimeEventMessage {
  type: string;
  message: string;
  workOrderId: number | null;
  technicianId: number | null;
  status: string | null;
  timestamp: string;
  metadata: RealtimeEventMetadata | null;
}
