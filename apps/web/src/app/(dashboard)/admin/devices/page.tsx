import type { Metadata } from "next";
import { DevicesView } from "@/features/devices/devices-view";
export const metadata: Metadata = { title: "Dispositivos IoT" };
export default function AdminDevicesPage() { return <DevicesView />; }
