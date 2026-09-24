import type { Metadata } from "next";

import { PagePlaceholder } from "@/shared/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Dispositivos",
};

export default function AdminDevicesPage() {
  return (
    <PagePlaceholder
      title="Dispositivos IoT"
      subtitle="ESP32 y servicio de visión: online/offline y API keys (solo Administrador)."
      task="FE-010"
    />
  );
}