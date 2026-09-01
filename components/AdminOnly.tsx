"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function AdminOnly({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile && profile.role !== "admin") {
      router.push("/");
    }
  }, [profile, loading, router]);

  if (loading || !profile || profile.role !== "admin") {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  }

  return <>{children}</>;
}