"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CharacterCard } from "@/components/character/CharacterCard";
import { CharacterDetailDialog } from "@/components/character/CharacterDetailDialog";
import { CharacterCreateDialog } from "@/components/character/CharacterCreateDialog";
import { deleteCharacter } from "@/lib/actions/character";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import type { Character, Project, ProjectCharacter } from "@prisma/client";

export type CharacterWithProjects = Character & {
  projects: (ProjectCharacter & { project: Project })[];
};

interface CharacterGridProps {
  characters: CharacterWithProjects[];
}

export function CharacterGrid({ characters }: CharacterGridProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailCharacter, setDetailCharacter] = useState<CharacterWithProjects | null>(null);
  const [deleteCharacterState, setDeleteCharacterState] = useState<CharacterWithProjects | null>(null);

  const filteredCharacters = useMemo(() => {
    if (!search.trim()) return characters;
    const q = search.trim().toLowerCase();
    return characters.filter((c) => c.name.toLowerCase().includes(q));
  }, [characters, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索角色名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <CharacterCreateDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={() => router.refresh()}
        >
          <Button className={cn(buttonVariants(), "inline-flex items-center gap-2")}>
            <Plus className="size-4" />
            新建角色
          </Button>
        </CharacterCreateDialog>
      </div>

      {filteredCharacters.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <CardHeader>
            <Users className="mx-auto size-12 text-muted-foreground" />
            <CardTitle className="text-center">
              {characters.length === 0 ? "还没有角色" : "未找到匹配的角色"}
            </CardTitle>
            <CardDescription className="text-center">
              {characters.length === 0
                ? "创建您的第一个角色，上传照片后可生成三视图用于微电影制作"
                : `没有找到包含「${search}」的角色，请尝试其他关键词`}
            </CardDescription>
          </CardHeader>
          {characters.length === 0 && (
            <CardContent>
              <CharacterCreateDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onCreated={() => router.refresh()}
              >
                <Button className={cn(buttonVariants(), "inline-flex items-center gap-2")}>
                  <Plus className="size-4" />
                  新建角色
                </Button>
              </CharacterCreateDialog>
            </CardContent>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              showDelete
              projectCount={character.projects.length}
              onSelect={() => setDetailCharacter(character)}
              onDelete={() => setDeleteCharacterState(character)}
            />
          ))}
        </div>
      )}

      {detailCharacter && (
        <CharacterDetailDialog
          character={detailCharacter}
          open={!!detailCharacter}
          onOpenChange={(open) => !open && setDetailCharacter(null)}
          onDeleted={() => setDetailCharacter(null)}
        />
      )}

      <Dialog
        open={!!deleteCharacterState}
        onOpenChange={(open) => !open && setDeleteCharacterState(null)}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除角色「{deleteCharacterState?.name}」吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCharacterState(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteCharacterState) return;
                await deleteCharacter(deleteCharacterState.id);
                setDeleteCharacterState(null);
                router.refresh();
              }}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
