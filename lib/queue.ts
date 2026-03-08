import { Queue } from "bullmq";
import type { TaskPayload } from "./queue-types";

function getConnectionOptions(): { host: string; port: number; maxRetriesPerRequest: null; lazyConnect: boolean } {
  const url = process.env.REDIS_URL || "redis://localhost:6379/0";
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "localhost",
      port: parseInt(parsed.port || "6379", 10),
      maxRetriesPerRequest: null,
      lazyConnect: true,
    };
  } catch {
    return {
      host: "localhost",
      port: 6379,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    };
  }
}

let queue: Queue | null = null;

export function getAiTaskQueue(): Queue {
  if (!queue) {
    queue = new Queue("ai-tasks", {
      connection: getConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 3600 * 24 },
        removeOnFail: { age: 3600 * 24 * 7 },
      },
    });
  }
  return queue;
}

export async function enqueueTask(payload: TaskPayload) {
  const q = getAiTaskQueue();
  return q.add(payload.taskType, payload, {
    jobId: `${payload.taskType}:${payload.projectId}:${Date.now()}`,
  });
}
