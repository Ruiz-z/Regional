import type { ToneKind } from "@/shared/components/ui/tone-badge";
import type { ZoneSnapshot } from "@/features/zones/components/zone-cell";

export type ZonePestState = "NORMAL" | "MONITOREO" | "INTERVENCION";

export interface LabelTone {
  tone: ToneKind;
  label: string;
}

export interface ZoneHistoryEvent {
  id: string;
  time: string;
  tone: ToneKind;
  title: string;
  detail?: string;
}

export interface ZoneDetail {
  id: string;
  cell: ZoneSnapshot;
  size: string;
  targetPct: number;
  temperatureC: number | null;
  irrigation: LabelTone;
  pest: {
    tone: ToneKind;
    label: string;
    detections?: number;
  };
  pestState: ZonePestState;
  cooldownUntil: string | null;
  history: ZoneHistoryEvent[];
}

export interface ParcelDetail {
  id: string;
  name: string;
  crop: string;
  area: string;
  zonesCount: number;
  badge: { tone: ToneKind; label: string } | null;
  ownerId: string;
  zones: ZoneDetail[];
}