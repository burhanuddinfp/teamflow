"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getAllAttendance, AttendanceRecord } from "@/lib/attendance";

export default function AttendancePage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !profile) return;

    if (profile.role !== "admin") {
      router.push("/");
      return;
    }

    const load = async () => {
      const data = await getAllAttendance();
      setRecords(data);
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
          <h1>Attendance</h1>
          <p>Full attendance history for your team.</p>
        </div>
      </header>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>All Records</h2>
            <p>{records.length} total entries</p>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>DATE</th>
                <th>CLOCK IN</th>
                <th>CLOCK OUT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                    No attendance records yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.employeeName}</td>
                    <td>{r.date}</td>
                    <td>{r.clockIn}</td>
                    <td>{r.clockOut}</td>
                    <td>
                      <span
                        className={`status ${
                          r.status === "present" ? "working" : r.status === "late" ? "late" : "absent"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
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