import { enqueueTask } from "@/lib/queue";

export interface QuickCreateTaskData extends Record<string, unknown> {
  title: string;
  description: string | null;
  prompt: string;
  photoUrls: string[];
}

export async function enqueueQuickCreatePipeline(
  projectId: string,
  userId: string,
  data: QuickCreateTaskData
) {
  return enqueueTask({
    taskType: "quick-create",
    projectId,
    userId,
    data,
  });
}
