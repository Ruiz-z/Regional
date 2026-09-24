import type { Metadata } from "next";

import { ParcelDetailView } from "@/features/parcels/parcel-detail/parcel-detail-view";

export const metadata: Metadata = {
  title: "Detalle de parcela",
};

export default function ParcelDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <ParcelDetailView parcelId={params.id} />;
}