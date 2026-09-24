import type { Metadata } from "next";

import { PagePlaceholder } from "@/shared/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Gestionar parcelas y zonas",
};

export default function ManageParcelsPage() {
  return (
    <PagePlaceholder
      title="Gestionar parcelas y zonas"
      subtitle="CRUD de parcelas y zonas."
      task="FE-012"
    />
  );
}