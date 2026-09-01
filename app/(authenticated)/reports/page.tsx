"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getAttendanceReport, getTaskReport, EmployeeReport, TaskReport } from "@/lib/reports";

export default function ReportsPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [attendanceReport, setAttendanceReport] = useState<EmployeeReport[]>([]);
  const [taskReport, setTaskReport] = useState<TaskReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !profile) return;

    if (profile.role !== "admin") {
      router.push("/");
      return;
    }

    const load = async () => {
      const [attendance, tasks] = await Promise.all([getAttendanceReport(), getTaskReport()]);
      setAttendanceReport(attendance);
      setTaskReport(tasks);
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
          <h1>Reports</h1>
          <p>Team performance at a glance.</p>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top"><span>Total Tasks</span></div>
          <h2>{taskReport?.total ?? 0}</h2>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span>Completed</span></div>
          <h2>{taskReport?.completed ?? 0}</h2>
          <p>{taskReport?.completionRate ?? 0}% completion rate</p>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span>In Progress</span></div>
          <h2>{taskReport?.inProgress ?? 0}</h2>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span>To Do</span></div>
          <h2>{taskReport?.toDo ?? 0}</h2>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>Attendance by Employee</h2>
            <p>Based on all-time records</p>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>DAYS PRESENT</th>
                <th>DAYS LATE</th>
                <th>TOTAL RECORDS</th>
                <th>ATTENDANCE RATE</th>
              </tr>
            </thead>
            <tbody>
              {attendanceReport.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 20 }}>
                    No data yet.
                  </td>
                </tr>
              ) : (
                attendanceReport.map((emp) => (
                  <tr key={emp.uid}>
                    <td>
                      <div className="employee">
                        <div className="employee-avatar">{emp.name.charAt(0)}</div>
                        <strong>{emp.name}</strong>
                      </div>
                    </td>
                    <td>{emp.presentDays}</td>
                    <td>{emp.lateDays}</td>
                    <td>{emp.totalDays}</td>
                    <td>{emp.attendanceRate}%</td>
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