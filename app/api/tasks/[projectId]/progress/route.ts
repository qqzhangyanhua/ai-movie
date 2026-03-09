import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) {
    return new Response("Forbidden", { status: 403 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "connected" });

      const interval = setInterval(async () => {
        try {
          const video = await prisma.video.findFirst({
            where: { projectId },
            orderBy: { createdAt: "desc" },
          });
          const scenes = await prisma.scene.findMany({
            where: { projectId },
            orderBy: { sceneNumber: "asc" },
          });

          send({
            type: "progress",
            video: video
              ? {
                  status: video.status,
                  progress: video.progress,
                  videoUrl: video.videoUrl,
                }
              : null,
            scenes: scenes.map((s) => ({
              id: s.id,
              sceneNumber: s.sceneNumber,
              status: s.status,
              progress: s.progress,
            })),
          });
        } catch {
          send({
            type: "progress",
            video: null,
            scenes: [],
          });
        }
      }, 2000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
