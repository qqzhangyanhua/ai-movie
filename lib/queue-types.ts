export type TaskType =
  | "character:generate"
  | "script:generate"
  | "storyboard:generate"
  | "storyboard:preview"
  | "video:clip"
  | "voice:generate"
  | "music:generate"
  | "poster:generate"
  | "video:compose";

export interface TaskPayload {
  taskType: TaskType;
  projectId: string;
  userId: string;
  data: Record<string, unknown>;
}

export interface TaskResult {
  taskType: TaskType;
  status: "completed" | "failed";
  data?: Record<string, unknown>;
  error?: string;
}
