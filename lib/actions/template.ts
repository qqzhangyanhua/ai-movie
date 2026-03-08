"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { scriptTemplates } from "@/lib/data/script-templates";
import { applyScriptTemplate } from "@/lib/actions/script";

export async function cloneTemplateToProject(templateId: string) {
  const session = await requireAuth();

  const template = scriptTemplates.find((t) => t.id === templateId);
  if (!template) {
    return { error: "模板不存在" };
  }

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      title: template.title,
      description: template.description,
    },
  });

  const result = await applyScriptTemplate(project.id, templateId);
  if (result.error) {
    await prisma.project.delete({ where: { id: project.id } });
    return { error: result.error };
  }

  return { projectId: project.id };
}
