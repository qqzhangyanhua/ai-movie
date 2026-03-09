import { QuickCreateProgress } from "@/components/quick-create/QuickCreateProgress";

type ProgressPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProgressPage({ params }: ProgressPageProps) {
  const { projectId } = await params;

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-10">
      <QuickCreateProgress projectId={projectId} />
    </div>
  );
}
