"use client";

import { AuthProvider, useAuth } from "@/lib/AuthContext";
import Sidebar from "@/components/Sidebar";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Loading...
      </div>
    );
  }

  return (
    <main className="app">
      <Sidebar profile={profile} />
      <section className="content">{children}</section>
    </main>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}