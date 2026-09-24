"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/auth/auth-context";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { session, isReady } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (isReady && session?.role !== "ADMIN") router.replace(session ? "/dashboard" : "/login");
  }, [isReady, session?.role, router, session]);
  if (!isReady || session?.role !== "ADMIN") return null;
  return <>{children}</>;
}
