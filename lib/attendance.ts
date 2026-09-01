import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getSettings } from "@/lib/settings";

function todayString() {
  return new Date().toISOString().split("T")[0];
}

export async function getTodayAttendance(userId: string) {
  const q = query(
    collection(db, "attendance"),
    where("userId", "==", userId),
    where("date", "==", todayString())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as any;
}

// Clock in: we no longer decide status here — we store a raw record,
// and compute "late" vs "present" later from the server-set timestamp.
export async function clockIn(userId: string) {
  const ref = await addDoc(collection(db, "attendance"), {
    userId,
    date: todayString(),
    clockIn: serverTimestamp(),
    clockOut: null,
    status: "pending", // placeholder, resolved on read
  });

  return ref.id;
}

export async function clockOut(attendanceId: string) {
  const ref = doc(db, "attendance", attendanceId);
  await updateDoc(ref, {
    clockOut: serverTimestamp(),
  });
}

// Resolves the real status using the record's server-generated timestamp,
// not anything the client could have manipulated.
export async function resolveStatus(clockInTimestamp: Timestamp | null): Promise<"present" | "late" | "pending"> {
  if (!clockInTimestamp) return "pending";
  const settings = await getSettings();
  const clockInDate = clockInTimestamp.toDate();
  const hour = clockInDate.getHours() + clockInDate.getMinutes() / 60;
  return hour >= settings.lateCutoffHour ? "late" : "present";
}

export type AttendanceRecord = {
  id: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: string;
};

export async function getAllAttendance(): Promise<AttendanceRecord[]> {
  const q = query(collection(db, "attendance"), orderBy("date", "desc"));
  const snap = await getDocs(q);
  const settings = await getSettings();

  const records = await Promise.all(
    snap.docs.map(async (docSnap) => {
      const data = docSnap.data();

      let employeeName = "Unknown";
      const userSnap = await getDoc(doc(db, "users", data.userId));
      if (userSnap.exists()) {
        employeeName = userSnap.data().name;
      }

      let status = "pending";
      if (data.clockIn?.toDate) {
        const hour = data.clockIn.toDate().getHours() + data.clockIn.toDate().getMinutes() / 60;
        status = hour >= settings.lateCutoffHour ? "late" : "present";
      }

      return {
        id: docSnap.id,
        employeeName,
        date: data.date,
        clockIn: data.clockIn?.toDate
          ? data.clockIn.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "—",
        clockOut: data.clockOut?.toDate
          ? data.clockOut.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "—",
        status,
      };
    })
  );

  return records;
}