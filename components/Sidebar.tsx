"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { UserProfile } from "@/lib/users";

export default function Sidebar({ profile }: { profile: UserProfile | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const isAdmin = profile?.role === "admin";

  const menuItems = isAdmin
    ? [
        { href: "/", icon: "▦", label: "Dashboard" },
        { href: "/attendance", icon: "◷", label: "Attendance" },
        { href: "/tasks", icon: "✓", label: "Tasks" },
        { href: "/employees", icon: "♙", label: "Employees" },
      ]
    : [
        { href: "/", icon: "▦", label: "Dashboard" },
        { href: "/tasks", icon: "✓", label: "My Tasks" },
      ];

  const managementItems = isAdmin
    ? [
        { href: "/reports", icon: "▤", label: "Reports" },
        { href: "/settings", icon: "⚙", label: "Settings" },
      ]
    : [{ href: "/settings", icon: "⚙", label: "Settings" }];

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">T</div>
        <span>TeamFlow</span>
      </div>

      <div className="menu-section">
        <p className="menu-title">MAIN</p>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`menu-item ${pathname === item.href ? "active" : ""}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}

        <p className="menu-title">MANAGEMENT</p>
        {managementItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`menu-item ${pathname === item.href ? "active" : ""}`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="sidebar-bottom">
        <div className="user-avatar">{profile?.name?.charAt(0) ?? "?"}</div>
        <div>
          <strong>{profile?.name ?? "Loading..."}</strong>
          <small>{profile?.position ?? ""}</small>
        </div>
        <button onClick={handleSignOut} className="icon-button" style={{ marginLeft: "auto" }}>
          ⏻
        </button>
      </div>
    </aside>
  );
}