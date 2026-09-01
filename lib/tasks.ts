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

export type Task = {
  id: string;
  title: string;
  employee: string;
  priority: "Low" | "Medium" | "High";
  progress: number;
  status: "To Do" | "In Progress" | "Completed";
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
        priority: data.priority,
        progress: data.progress,
        status: data.status,
      };
    })
  );

  return tasks;
}

export async function createTask(data: {
  title: string;
  assignedTo: string;
  priority: "Low" | "Medium" | "High";
  status: "To Do" | "In Progress" | "Completed";
  progress: number;
}) {
  await addDoc(collection(db, "tasks"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}
export async function updateTaskStatus(
  taskId: string,
  status: "To Do" | "In Progress" | "Completed",
  progress: number
) {
  const ref = doc(db, "tasks", taskId);
  await updateDoc(ref, { status, progress });
}