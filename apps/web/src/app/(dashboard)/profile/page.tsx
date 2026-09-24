import type { Metadata } from "next";

import { PagePlaceholder } from "@/shared/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Perfil",
};

export default function ProfilePage() {
  return (
    <PagePlaceholder
      title="Perfil"
      subtitle="Datos de cuenta y cambio de contraseña."
      task="fuera del alcance FE-001…FE-012"
    />
  );
}