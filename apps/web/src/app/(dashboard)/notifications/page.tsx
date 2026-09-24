import type { Metadata } from "next";

import { PagePlaceholder } from "@/shared/components/layout/page-placeholder";

export const metadata: Metadata = {
  title: "Notificaciones",
};

export default function NotificationsPage() {
  return (
    <PagePlaceholder
      title="Notificaciones"
      subtitle="Alertas informativas y críticas de tus parcelas."
      task="FE-007"
    />
  );
}