"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { createProjectSchema } from "@/lib/validations/project";

export async function createProject(formData: FormData) {
  const session = await requireAuth();

  const parsed = createProjectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    redirect("/create?error=invalid");
  }

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
    },
  });

  redirect(`/create/${project.id}?step=characters`);
}

export async function deleteProject(projectId: string) {
  const session = await requireAuth();

  await prisma.project.deleteMany({
    where: { id: projectId, userId: session.user.id },
  });

  revalidatePath("/dashboard");
}
