import type { Metadata } from "next";
import { ConfigView } from "@/features/config/config-view";
export const metadata: Metadata = { title: "Configuración" };
export default function AdminConfigPage() { return <ConfigView />; }
