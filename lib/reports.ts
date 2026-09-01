import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getSettings } from "@/lib/settings";

export type EmployeeReport = {
  uid: string;
  name: string;
  position: string;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  attendanceRate: number;
};

export type TaskReport = {
  total: number;
  completed: number;
  inProgress: number;
  toDo: number;
  completionRate: number;
};

export async function getAttendanceReport(): Promise<EmployeeReport[]> {
  const usersSnap = await getDocs(collection(db, "users"));
  const employees = usersSnap.docs
    .map((d) => ({ uid: d.id, ...d.data() } as any))
    .filter((u) => u.role === "employee");

  const attendanceSnap = await getDocs(collection(db, "attendance"));
  const allRecords = attendanceSnap.docs.map((d) => d.data());
  const settings = await getSettings();

  return employees.map((emp) => {
    const empRecords = allRecords.filter((r) => r.userId === emp.uid && r.clockIn?.toDate);

    let presentDays = 0;
    let lateDays = 0;

    empRecords.forEach((r) => {
      const clockInDate = r.clockIn.toDate();
      const hour = clockInDate.getHours() + clockInDate.getMinutes() / 60;
      if (hour >= settings.lateCutoffHour) {
        lateDays++;
      } else {
        presentDays++;
      }
    });

    const totalDays = empRecords.length;

    return {
      uid: emp.uid,
      name: emp.name,
      position: emp.position,
      totalDays,
      presentDays,
      lateDays,
      attendanceRate: totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0,
    };
  });
}

export async function getTaskReport(): Promise<TaskReport> {
  const tasksSnap = await getDocs(collection(db, "tasks"));
  const tasks = tasksSnap.docs.map((d) => d.data());

  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const inProgress = tasks.filter((t) => t.status === "In Progress").length;
  const toDo = tasks.filter((t) => t.status === "To Do").length;

  return {
    total,
    completed,
    inProgress,
    toDo,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}