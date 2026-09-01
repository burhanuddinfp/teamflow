import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AppSettings = {
  lateCutoffHour: number; // 24-hour format, e.g. 10 means 10:00 AM
};

const DEFAULT_SETTINGS: AppSettings = {
  lateCutoffHour: 10,
};

export async function getSettings(): Promise<AppSettings> {
  const ref = doc(db, "settings", "app");
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...DEFAULT_SETTINGS, ...snap.data() } as AppSettings;
  }
  return DEFAULT_SETTINGS;
}

export async function updateSettings(settings: Partial<AppSettings>) {
  const ref = doc(db, "settings", "app");
  await setDoc(ref, settings, { merge: true });
}