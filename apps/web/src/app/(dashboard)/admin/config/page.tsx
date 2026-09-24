import type { Metadata } from "next";

import { PagePlaceholder } from "@/shared/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Configuración",
};

export default function AdminConfigPage() {
  return (
    <PagePlaceholder
      title="Configuración global"
      subtitle="Umbrales y keys de integraciones (solo Administrador)."
      task="FE-011"
    />
  );
}