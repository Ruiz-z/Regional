import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/shared/contexts/AuthContext";
export default function DetailLayout() {
  const { session, isLoading } = useAuth();
  if (isLoading) return null;
  if (!session || session.role !== "AGRICULTOR")
    return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerTitle: "Mis parcelas" }} />;
}
