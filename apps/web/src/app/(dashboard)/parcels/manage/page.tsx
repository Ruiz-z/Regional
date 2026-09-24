import type { Metadata } from "next";
import { ManageView } from "@/features/parcels/manage/manage-view";
export const metadata: Metadata = { title: "Gestión de parcelas y zonas" };
export default function ManageParcelsPage() { return <ManageView />; }
