import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { CharacterGrid } from "@/components/character/CharacterGrid";

export default async function CharactersPage() {
  const session = await requireAuth();

  const characters = await prisma.character.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      projects: {
        include: {
          project: {
            include: {
              script: true,
              scenes: {
                orderBy: { sceneNumber: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">角色库</h1>
        <p className="text-muted-foreground">
          管理您的角色，上传照片后可生成三视图用于微电影制作
        </p>
      </div>
      <CharacterGrid characters={characters} />
    </div>
  );
}
