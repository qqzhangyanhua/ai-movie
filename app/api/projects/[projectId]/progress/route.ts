import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await requireAuth();
    const { projectId } = await params;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: session.user.id },
      select: { id: true },
    });

    if (!project) {
      return new Response("Project not found", { status: 404 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: unknown) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        const interval = setInterval(async () => {
          try {
            const [projectData, scenes, video] = await Promise.all([
              prisma.project.findUnique({
                where: { id: projectId },
                select: { id: true, status: true, title: true },
              }),
              prisma.scene.findMany({
                where: { projectId },
                select: {
                  id: true,
                  sceneNumber: true,
                  status: true,
                  progress: true,
                },
                orderBy: { sceneNumber: "asc" },
              }),
              prisma.video.findFirst({
                where: { projectId },
                select: {
                  id: true,
                  status: true,
                  progress: true,
                  videoUrl: true,
                },
              }),
            ]);

            send({
              type: "progress",
              project: projectData,
              scenes,
              video,
            });

            if (
              projectData?.status === "COMPLETED" ||
              projectData?.status === "FAILED"
            ) {
              clearInterval(interval);
              controller.close();
            }
          } catch {
            send({ type: "progress", project: null, scenes: [], video: null });
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
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Progress stream error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
