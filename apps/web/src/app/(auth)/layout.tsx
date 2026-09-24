import type { ReactNode } from "react";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return children;
}