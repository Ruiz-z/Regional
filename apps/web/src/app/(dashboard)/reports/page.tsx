import type { Metadata } from "next";

import { ReportsView } from "@/features/reports/reports-view";

export const metadata: Metadata = {
  title: "Histórico y reportes",
};

export default function ReportsPage() {
  return <ReportsView />;
}