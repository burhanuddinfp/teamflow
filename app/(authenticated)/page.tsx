"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getTodayAttendance, clockIn, clockOut } from "@/lib/attendance";
import { getEmployeesWithStatus, Employee } from "@/lib/employees";
import { getTasks, createTask, Task } from "@/lib/tasks";
import { getGreeting } from "@/lib/utils";

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<"not_started" | "clocked_in" | "done">("not_started");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [newTaskStatus, setNewTaskStatus] = useState<"To Do" | "In Progress" | "Completed">("To Do");
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    const loadData = async () => {
      const todayRecord = await getTodayAttendance(user.uid);

      if (todayRecord) {
        setAttendanceId(todayRecord.id);

        if (todayRecord.clockIn?.toDate) {
          setClockInTime(
            todayRecord.clockIn.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          );
        }

        if (todayRecord.clockOut) {
          setAttendanceStatus("done");
          setIsClockedIn(false);
          if (todayRecord.clockOut?.toDate) {
            setClockOutTime(
              todayRecord.clockOut.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            );
          }
        } else {
          setAttendanceStatus("clocked_in");
          setIsClockedIn(true);
        }
      } else {
        setAttendanceStatus("not_started");
      }

      if (profile.role === "admin") {
        const employeeList = await getEmployeesWithStatus();
        setEmployees(employeeList);

        const taskList = await getTasks();
        setTasks(taskList);
} else {
  // Employees only see their own tasks — filtered at the query level
  const myTasks = await getTasks(user.uid);
  setTasks(myTasks);
}

      setLoadingData(false);
    };

    loadData();
  }, [user, profile]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskAssignee) return;

    setSavingTask(true);
    try {
      await createTask({
        title: newTaskTitle,
        assignedTo: newTaskAssignee,
        priority: newTaskPriority,
        status: newTaskStatus,
        progress: newTaskStatus === "Completed" ? 100 : 0,
      });

      const updatedTasks = await getTasks();
      setTasks(updatedTasks);

      setNewTaskTitle("");
      setNewTaskAssignee("");
      setNewTaskPriority("Medium");
      setNewTaskStatus("To Do");
      setShowTaskModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create task.");
    } finally {
      setSavingTask(false);
    }
  };

  if (loadingData) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading dashboard...</div>;
  }

  const clockCard = (
    <div className="clock-card">
      <div>
        <p className="clock-label">YOUR ATTENDANCE</p>
        <h2>{isClockedIn ? "You are currently working" : "You are currently clocked out"}</h2>
        <p className="clock-subtitle">
          {attendanceStatus === "done"
            ? `Completed today · ${clockInTime} – ${clockOutTime}`
            : isClockedIn
            ? `Clocked in at ${clockInTime}`
            : "Don't forget to clock in when you start working."}
        </p>
      </div>
      <button
        className={isClockedIn ? "clock-button out" : "clock-button"}
        disabled={attendanceStatus === "done"}
        onClick={async () => {
          if (!user || attendanceStatus === "done") return;

          if (isClockedIn && attendanceId) {
            await clockOut(attendanceId);
            setIsClockedIn(false);
            setAttendanceStatus("done");
            setClockOutTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          } else {
            const id = await clockIn(user.uid);
            setIsClockedIn(true);
            setAttendanceStatus("clocked_in");
            setAttendanceId(id);
            setClockInTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          }
        }}
      >
        {attendanceStatus === "done" ? "Done for Today" : isClockedIn ? "Clock Out" : "Clock In"}
      </button>
    </div>
  );

  // ---------- EMPLOYEE VIEW ----------
  if (!isAdmin) {
    return (
      <>
        <header className="topbar">
          <div>
            <h1>{getGreeting()}, {profile?.name?.split(" ")[0] ?? ""} 👋</h1>
            <p>Here&apos;s your day at a glance.</p>
          </div>
          <div className="top-actions">
            <div className="profile-circle">{profile?.name?.charAt(0) ?? "?"}</div>
          </div>
        </header>

        {clockCard}

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>My Tasks</h2>
              <p>Tasks assigned to you</p>
            </div>
          </div>
          <div className="tasks">
            {tasks.length === 0 ? (
              <p style={{ padding: 20, textAlign: "center", color: "#777d89" }}>No tasks assigned yet.</p>
            ) : (
              tasks.map((task) => (
                <div className="task" key={task.id}>
                  <div className="task-header">
                    <div>
                      <strong>{task.title}</strong>
                    </div>
                    <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                  </div>
                  <div className="progress-row">
                    <div className="progress">
                      <div className="progress-fill" style={{ width: `${task.progress}%` }} />
                    </div>
                    <span>{task.progress}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </>
    );
  }

  // ---------- ADMIN VIEW ----------
  const presentCount = employees.filter((e) => e.status !== "Absent").length;
  const workingCount = employees.filter((e) => e.status === "Working").length;
  const pendingTasksCount = tasks.filter((t) => t.status !== "Completed").length;

  return (
    <>
      <header className="topbar">
        <div>
          <h1>{getGreeting()}, {profile?.name?.split(" ")[0] ?? ""} 👋</h1>
          <p>Here&apos;s what&apos;s happening with your team today.</p>
        </div>
        <div className="top-actions">
          <button className="icon-button">🔔</button>
          <div className="profile-circle">{profile?.name?.charAt(0) ?? "?"}</div>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top"><span>Total Employees</span><div className="stat-icon">♙</div></div>
          <h2>{employees.length}</h2>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span>Present Today</span><div className="stat-icon green">✓</div></div>
          <h2>{presentCount}</h2>
          <p>{employees.length > 0 ? Math.round((presentCount / employees.length) * 100) : 0}% attendance</p>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span>Working Now</span><div className="stat-icon blue">◷</div></div>
          <h2>{workingCount}</h2>
          <p>Currently clocked in</p>
        </div>
        <div className="stat-card">
          <div className="stat-top"><span>Pending Tasks</span><div className="stat-icon orange">✓</div></div>
          <h2>{pendingTasksCount}</h2>
        </div>
      </div>

      {clockCard}

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Today&apos;s Attendance</h2>
              <p>{new Date().toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>EMPLOYEE</th><th>CLOCK IN</th><th>STATUS</th></tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.uid}>
                    <td>
                      <div className="employee">
                        <div className="employee-avatar">{employee.name.charAt(0)}</div>
                        <div>
                          <strong>{employee.name}</strong>
                          <small>{employee.position}</small>
                        </div>
                      </div>
                    </td>
                    <td>{employee.time}</td>
                    <td>
                      <span
                        className={`status ${
                          employee.status === "Working" ? "working" : employee.status === "Late" ? "late" : "absent"
                        }`}
                      >
                        {employee.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Task Overview</h2>
              <p>Recently assigned tasks</p>
            </div>
            <button className="view-button" onClick={() => setShowTaskModal(true)}>
              + Add Task
            </button>
          </div>
          <div className="tasks">
            {tasks.map((task) => (
              <div className="task" key={task.id}>
                <div className="task-header">
                  <div>
                    <strong>{task.title}</strong>
                    <small>Assigned to {task.employee}</small>
                  </div>
                  <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                </div>
                <div className="progress-row">
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${task.progress}%` }} />
                  </div>
                  <span>{task.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Add Task</h2>
            <form onSubmit={handleCreateTask}>
              <label>Task Title</label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. Design homepage banner"
                required
              />

              <label>Assign To</label>
              <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} required>
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.uid} value={emp.uid}>{emp.name}</option>
                ))}
              </select>

              <label>Priority</label>
              <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as any)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>

              <label>Status</label>
              <select value={newTaskStatus} onChange={(e) => setNewTaskStatus(e.target.value as any)}>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={savingTask}>
                  {savingTask ? "Saving..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}