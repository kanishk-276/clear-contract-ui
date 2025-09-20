import { getDatabase, ref, push } from "firebase/database";
import app from "@/integrations/firebase/config";

export async function saveSummaryToFirebase(
  userId: string,
  fileName: string,
  summary: string,
  riskTag: "high risk" | "low risk"
): Promise<string> {
  const db = getDatabase(app);
  const summariesRef = ref(db, `/users/${userId}/summaries`);
  const now = new Date();
  const data = {
    fileName,
    summary,
    riskTag,
    createdAt: now.toISOString(),
  };
  const newRef = await push(summariesRef, data);
  return newRef.key!;
}
