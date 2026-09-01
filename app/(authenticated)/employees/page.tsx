"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getEmployeesWithStatus, Employee } from "@/lib/employees";

export default function EmployeesPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !profile) return;

    if (profile.role !== "admin") {
      router.push("/");
      return;
    }

    const load = async () => {
      const data = await getEmployeesWithStatus();
      setEmployees(data);
      setLoading(false);
    };
    load();
  }, [profile, authLoading, router]);

  if (authLoading || loading || profile?.role !== "admin") {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>Employees</h1>
          <p>Everyone on your team.</p>
        </div>
      </header>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>All Employees</h2>
            <p>{employees.length} total</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>POSITION</th>
                <th>TODAY'S STATUS</th>
                <th>CLOCK IN</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 20 }}>
                    No employees yet.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.uid}>
                    <td>
                      <div className="employee">
                        <div className="employee-avatar">{emp.name.charAt(0)}</div>
                        <strong>{emp.name}</strong>
                      </div>
                    </td>
                    <td>{emp.position}</td>
                    <td>
                      <span
                        className={`status ${
                          emp.status === "Working" ? "working" : emp.status === "Late" ? "late" : "absent"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td>{emp.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}