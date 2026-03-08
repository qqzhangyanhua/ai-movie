"use client";

import { useEffect, useState, useRef } from "react";

interface ClipProgress {
  id: string;
  sceneNumber: number;
  status: string;
  progress: number;
}

interface VideoProgress {
  status: string;
  progress: number;
  videoUrl?: string | null;
}

interface ProgressData {
  video: VideoProgress | null;
  clips: ClipProgress[];
}

export function useTaskProgress(projectId: string, enabled = true) {
  const [data, setData] = useState<ProgressData>({ video: null, clips: [] });
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !projectId) return;

    const es = new EventSource(`/api/tasks/${projectId}/progress`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as { type: string; video?: VideoProgress | null; clips?: ClipProgress[] };
      if (parsed.type === "progress") {
        setData({
          video: parsed.video ?? null,
          clips: parsed.clips ?? [],
        });
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [projectId, enabled]);

  return { data, connected };
}
