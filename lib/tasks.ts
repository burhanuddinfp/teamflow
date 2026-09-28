import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TaskType = "Reel" | "Post" | "Presentation" | "Shoot" | "Other";

export type Task = {
  id: string;
  title: string;
  employee: string;
  assignedTo: string;
  clientName: string;
  taskType: TaskType;
  otherDescription?: string;
  priority: "Low" | "Medium" | "High";
  progress: number;
  status: "To Do" | "In Progress" | "Completed";
  dueDate: string | null;
  createdAt: string | null;
  completedAt: string | null;
};

export async function getTasks(filterByUid?: string): Promise<Task[]> {
  const tasksRef = collection(db, "tasks");
  const q = filterByUid
    ? query(tasksRef, where("assignedTo", "==", filterByUid))
    : tasksRef;

  const tasksSnap = await getDocs(q as any);

  const tasks = await Promise.all(
    tasksSnap.docs.map(async (taskDoc) => {
      const data = taskDoc.data();

      let employeeName = "Unassigned";
      if (data.assignedTo) {
        const userSnap = await getDoc(doc(db, "users", data.assignedTo));
        if (userSnap.exists()) {
          employeeName = userSnap.data().name;
        }
      }

      return {
        id: taskDoc.id,
        title: data.title,
        employee: employeeName,
        assignedTo: data.assignedTo,
        clientName: data.clientName || "—",
        taskType: data.taskType || "Other",
        otherDescription: data.otherDescription || "",
        priority: data.priority,
        progress: data.progress,
        status: data.status,
        dueDate: data.dueDate || null,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })
          : null,
        completedAt: data.completedAt?.toDate
          ? data.completedAt.toDate().toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })
          : null,
      };
    })
  );

  return tasks;
}

export async function createTask(data: {
  title: string;
  assignedTo: string;
  clientName: string;
  taskType: TaskType;
  otherDescription?: string;
  priority: "Low" | "Medium" | "High";
  status: "To Do" | "In Progress" | "Completed";
  progress: number;
  dueDate: string;
}) {
  await addDoc(collection(db, "tasks"), {
    ...data,
    createdAt: serverTimestamp(),
    completedAt: data.status === "Completed" ? serverTimestamp() : null,
  });
}

export async function updateTaskStatus(
  taskId: string,
  status: "To Do" | "In Progress" | "Completed",
  progress: number
) {
  const ref = doc(db, "tasks", taskId);
  await updateDoc(ref, {
    status,
    progress,
    completedAt: status === "Completed" ? serverTimestamp() : null,
  });
}