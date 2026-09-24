import { AdminGuard } from "@/shared/auth/admin-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
