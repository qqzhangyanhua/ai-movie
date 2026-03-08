"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Character } from "@prisma/client";

interface CharacterCardProps {
  character: Character;
  selected?: boolean;
  showDelete?: boolean;
  projectCount?: number;
  onSelect?: () => void;
  onDelete?: () => void;
}

export function CharacterCard({
  character,
  selected = false,
  showDelete = false,
  projectCount,
  onSelect,
  onDelete,
}: CharacterCardProps) {
  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow",
        onSelect && "cursor-pointer hover:shadow-md",
        selected && "ring-2 ring-primary"
      )}
    >
      <div className="aspect-square overflow-hidden">
        <img
          src={character.photoUrl}
          alt={character.name}
          className="aspect-square w-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-2 p-3">
        <p className="font-medium">{character.name}</p>
        <div className="flex flex-wrap gap-1">
          {character.personality && (
            <Badge variant="secondary" className="text-xs">
              {character.personality}
            </Badge>
          )}
          {character.style && (
            <Badge variant="outline" className="text-xs">
              {character.style}
            </Badge>
          )}
          {projectCount !== undefined && projectCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {projectCount} 项目
            </Badge>
          )}
        </div>
      </div>
      {showDelete && onDelete && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="删除角色"
        >
          <Trash2 className="size-4" />
        </Button>
      )}
    </div>
  );
}
