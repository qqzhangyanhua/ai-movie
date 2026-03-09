"use client";

import { useRouter } from "next/navigation";
import { Pencil, Users } from "lucide-react";
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
import type { CharacterWithProjects } from "@/components/character/CharacterGrid";

interface CharacterDetailDialogProps {
  character: CharacterWithProjects;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function CharacterDetailDialog({
  character,
  open,
  onOpenChange,
}: CharacterDetailDialogProps) {
  const router = useRouter();

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
