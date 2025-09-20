import { getDatabase, ref, get } from "firebase/database";
import app from "@/integrations/firebase/config";

export async function fetchUserSummaries(userId: string) {
  const db = getDatabase(app);
  const summariesRef = ref(db, `/users/${userId}/summaries`);
  const snapshot = await get(summariesRef);
  if (!snapshot.exists()) return [];
  const data = snapshot.val();
  // Convert {autoId: {...}} to array
  return Object.entries(data).map(([id, value]: [string, any]) => ({ id, ...value }));
}
