"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Pencil, Loader2, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateCharacterViews } from "@/lib/actions/character";
import type { CharacterWithProjects } from "@/components/character/CharacterGrid";

interface CharacterDetailDialogProps {
  character: CharacterWithProjects;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

function ViewPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted/50">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs text-muted-foreground/70">待生成</span>
    </div>
  );
}

export function CharacterDetailDialog({
  character,
  open,
  onOpenChange,
}: CharacterDetailDialogProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const hasAllViews =
    character.frontViewUrl && character.sideViewUrl && character.backViewUrl;

  async function handleGenerateViews() {
    setIsGenerating(true);
    try {
      const result = await generateCharacterViews(character.id);
      if (result.success) {
        onOpenChange(false);
        router.refresh();
      }
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{character.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-lg border">
              <Image
                src={character.photoUrl}
                alt={character.name}
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap gap-1">
                {character.personality && (
                  <Badge variant="secondary">{character.personality}</Badge>
                )}
                {character.style && (
                  <Badge variant="outline">{character.style}</Badge>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-fit" disabled>
                <Pencil className="mr-2 size-4" />
                编辑（预留）
              </Button>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">三视图</h4>
            <div className="grid grid-cols-3 gap-2">
              {character.frontViewUrl ? (
                <div className="relative aspect-square overflow-hidden rounded-lg border">
                  <Image
                    src={character.frontViewUrl}
                    alt="正面"
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
              ) : (
                <ViewPlaceholder label="正面" />
              )}
              {character.sideViewUrl ? (
                <div className="relative aspect-square overflow-hidden rounded-lg border">
                  <Image
                    src={character.sideViewUrl}
                    alt="侧面"
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
              ) : (
                <ViewPlaceholder label="侧面" />
              )}
              {character.backViewUrl ? (
                <div className="relative aspect-square overflow-hidden rounded-lg border">
                  <Image
                    src={character.backViewUrl}
                    alt="背面"
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
              ) : (
                <ViewPlaceholder label="背面" />
              )}
            </div>
            {!hasAllViews && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleGenerateViews}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <ImagePlus className="mr-2 size-4" />
                )}
                生成三视图
              </Button>
            )}
          </div>

          {character.projects.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Users className="size-4" />
                关联项目
              </h4>
              <ul className="space-y-1">
                {character.projects.map((pc) => (
                  <li key={pc.id}>
                    <Link
                      href={`/create/${pc.projectId}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {pc.project.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
