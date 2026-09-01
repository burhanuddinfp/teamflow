"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getTasks, createTask, updateTaskStatus, Task } from "@/lib/tasks";
import { getEmployeesWithStatus, Employee } from "@/lib/employees";

export default function TasksPage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [newTaskStatus, setNewTaskStatus] = useState<"To Do" | "In Progress" | "Completed">("To Do");
  const [savingTask, setSavingTask] = useState(false);

  const loadData = async () => {
    if (!user || !profile) return;

    if (profile.role === "admin") {
      const [taskList, employeeList] = await Promise.all([getTasks(), getEmployeesWithStatus()]);
      setTasks(taskList);
      setEmployees(employeeList);
    } else {
      const myTasks = await getTasks(user.uid);
      setTasks(myTasks);
    }
    setLoading(false);
  };

  useEffect(() => {
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

      await loadData();

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

  const handleStatusChange = async (taskId: string, newStatus: "To Do" | "In Progress" | "Completed") => {
    const progress = newStatus === "Completed" ? 100 : newStatus === "To Do" ? 0 : 50;
    await updateTaskStatus(taskId, newStatus, progress);
    await loadData();
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading tasks...</div>;
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>{isAdmin ? "Tasks" : "My Tasks"}</h1>
          <p>{isAdmin ? "All tasks assigned across your team." : "Tasks assigned to you."}</p>
        </div>
      </header>

      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>{isAdmin ? "All Tasks" : "Your Tasks"}</h2>
            <p>{tasks.length} total</p>
          </div>
          {isAdmin && (
            <button className="view-button" onClick={() => setShowTaskModal(true)}>
              + Add Task
            </button>
          )}
        </div>

        <div className="tasks">
          {tasks.length === 0 ? (
            <p style={{ padding: 20, textAlign: "center", color: "#777d89" }}>No tasks yet.</p>
          ) : (
            tasks.map((task) => (
              <div className="task" key={task.id}>
                <div className="task-header">
                  <div>
                    <strong>{task.title}</strong>
                    {isAdmin && <small>Assigned to {task.employee}</small>}
                  </div>
                  <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                </div>
                <div className="progress-row">
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${task.progress}%` }} />
                  </div>
                  <span>{task.progress}%</span>
                </div>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                  style={{ marginTop: 10, padding: "6px 10px", borderRadius: 6, border: "1px solid #e0e1e6" }}
                >
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            ))
          )}
        </div>
      </div>

      {isAdmin && showTaskModal && (
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