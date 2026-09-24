export type NotificationSeverity = "CRITICA" | "INFORMATIVA";

export interface NotificationItem {
  id: string;
  severity: NotificationSeverity;
  read: boolean;
  title: string;
  meta: string;
  parcelId: string;
}