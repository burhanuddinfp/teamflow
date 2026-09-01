import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getSettings } from "@/lib/settings";

export type Employee = {
  uid: string;
  name: string;
  position: string;
  status: "Working" | "Late" | "Absent";
  time: string;
};

function todayString() {
  return new Date().toISOString().split("T")[0];
}

export async function getEmployeesWithStatus(): Promise<Employee[]> {
  const usersSnap = await getDocs(
    query(collection(db, "users"), where("role", "==", "employee"))
  );

  const employees = usersSnap.docs.map((d) => ({
    uid: d.id,
    name: d.data().name,
    position: d.data().position,
  }));

  const attendanceSnap = await getDocs(
    query(collection(db, "attendance"), where("date", "==", todayString()))
  );

  const settings = await getSettings();

  const attendanceByUser: Record<string, any> = {};
  attendanceSnap.docs.forEach((d) => {
    attendanceByUser[d.data().userId] = d.data();
  });

  return employees.map((emp) => {
    const record = attendanceByUser[emp.uid];

    let status: Employee["status"] = "Absent";
    let time = "—";

    if (record && record.clockIn?.toDate) {
      const clockInDate = record.clockIn.toDate();
      const hour = clockInDate.getHours() + clockInDate.getMinutes() / 60;
      status = hour >= settings.lateCutoffHour ? "Late" : "Working";
      time = clockInDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    return {
      uid: emp.uid,
      name: emp.name,
      position: emp.position,
      status: status,
      time: time,
    };
  });
}