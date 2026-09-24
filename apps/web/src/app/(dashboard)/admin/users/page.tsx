import type { Metadata } from "next";

import { PagePlaceholder } from "@/shared/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Usuarios",
};

export default function AdminUsersPage() {
  return (
    <PagePlaceholder
      title="Usuarios"
      subtitle="Alta y gestión de Agricultores (solo Administrador)."
      task="FE-009"
    />
  );
}