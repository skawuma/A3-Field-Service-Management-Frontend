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
  notificationTitle?: string;
  notificationMessage?: string;
  statusLabel?: string;
  completedAt?: string | null;
  slaDueAt?: string | null;
  slaBreached?: boolean;
  breachMinutes?: number;
  minutesRemaining?: number;
  actualCompletionMinutes?: number;
}

export type RealtimeEventType =
  | 'WORK_ORDER_CREATED'
  | 'WORK_ORDER_ASSIGNED'
  | 'WORK_ORDER_STATUS_CHANGED'
  | 'WORK_ORDER_COMPLETED'
  | 'SLA_NEAR_BREACH'
  | 'SLA_BREACHED'
  | 'SLA_MET'
  | 'ALERT_CREATED';

export interface RealtimeEventMessage {
  type: RealtimeEventType;
  message: string;
  workOrderId: number | null;
  technicianId: number | null;
  status: string | null;
  timestamp: string;
  metadata: RealtimeEventMetadata | null;
}
