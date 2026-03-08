import { requireAuth } from "@/lib/auth-utils";
import { TemplateGallery } from "@/components/template/TemplateGallery";
import { scriptTemplates } from "@/lib/data/script-templates";

export default async function TemplatesPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">模板库</h1>
        <p className="text-muted-foreground">
          浏览并选择剧本模板，快速开始您的微电影创作
        </p>
      </div>
      <TemplateGallery templates={scriptTemplates} />
    </div>
  );
}
