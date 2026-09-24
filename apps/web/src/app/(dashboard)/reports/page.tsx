import type { Metadata } from "next";

import { PagePlaceholder } from "@/shared/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Histórico y reportes",
};

export default function ReportsPage() {
  return (
    <PagePlaceholder
      title="Histórico y reportes"
      subtitle="Consumo, ahorro y timeline de intervenciones."
      task="FE-008"
    />
  );
}