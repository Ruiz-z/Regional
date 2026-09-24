import type { Metadata } from "next";

import { ParcelListView } from "@/features/parcels/parcel-list-view";

export const metadata: Metadata = {
  title: "Mis parcelas",
};

export default function ParcelsPage() {
  return <ParcelListView />;
}