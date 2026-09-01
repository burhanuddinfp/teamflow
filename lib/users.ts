import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserProfile = {
  name: string;
  email: string;
  role: "admin" | "employee";
  position: string;
};

export async function getUserProfile(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(
  uid: string,
  data: Omit<UserProfile, never>
) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  });
}