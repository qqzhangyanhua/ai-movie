import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { QuickCreateResult } from "@/components/quick-create/QuickCreateResult";

type ResultPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ResultPage({ params }: ResultPageProps) {
  const session = await requireAuth();
  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: {
      videos: {
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!project) {
    redirect("/dashboard");
  }

  const video = project.videos[0];

  if (!video || !video.videoUrl) {
    redirect(`/create/${projectId}/progress`);
  }

  return (
    <div className="container py-10">
      <QuickCreateResult
        projectId={project.id}
        videoUrl={video.videoUrl}
        title={project.title}
      />
    </div>
  );
}
