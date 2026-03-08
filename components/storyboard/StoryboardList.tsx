"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryboardCard } from "./StoryboardCard";
import { StoryboardEditor } from "./StoryboardEditor";
import {
  generateStoryboardsFromScript,
  deleteStoryboard,
  addStoryboard,
  reorderStoryboards,
} from "@/lib/actions/storyboard";
import type { Storyboard } from "@prisma/client";

interface ProjectCharacter {
  id: string;
  name: string;
}

interface StoryboardListProps {
  projectId: string;
  storyboards: Storyboard[];
  projectCharacters: ProjectCharacter[];
}

export function StoryboardList({
  projectId,
  storyboards,
  projectCharacters,
}: StoryboardListProps) {
  const router = useRouter();
  const [editingStoryboard, setEditingStoryboard] = useState<Storyboard | null>(
    null
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [reordering, setReordering] = useState(false);

  const totalDuration = storyboards.reduce((sum, s) => sum + s.duration, 0);

  async function handleRegenerate() {
    setRegenerating(true);
    await generateStoryboardsFromScript(projectId);
    setRegenerating(false);
    router.refresh();
  }

  async function handleDelete(storyboard: Storyboard) {
    await deleteStoryboard(storyboard.id);
    router.refresh();
  }

  function handleEdit(storyboard: Storyboard) {
    setEditingStoryboard(storyboard);
    setEditorOpen(true);
  }

  async function handleAdd() {
    setAdding(true);
    await addStoryboard(projectId, {
      sceneNumber: storyboards.length + 1,
      description: "新场景",
      action: "",
      cameraType: "中景",
      duration: 5,
    });
    setAdding(false);
    router.refresh();
  }

  async function handleMoveUp(index: number) {
    if (index <= 0) return;
    setReordering(true);
    const newOrder = [...storyboards];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    await reorderStoryboards(
      projectId,
      newOrder.map((s) => s.id)
    );
    setReordering(false);
    router.refresh();
  }

  async function handleMoveDown(index: number) {
    if (index >= storyboards.length - 1) return;
    setReordering(true);
    const newOrder = [...storyboards];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    await reorderStoryboards(
      projectId,
      newOrder.map((s) => s.id)
    );
    setReordering(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">分镜列表</h3>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" />
            总时长 {totalDuration} 秒
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={regenerating}
            onClick={handleRegenerate}
          >
            <RotateCcw className="mr-2 size-4" />
            重新生成
          </Button>
          <Button size="sm" disabled={adding} onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            新增分镜
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {storyboards.map((sb, index) => (
          <StoryboardCard
            key={sb.id}
            storyboard={sb}
            canMoveUp={index > 0}
            canMoveDown={index < storyboards.length - 1}
            onEdit={() => handleEdit(sb)}
            onDelete={() => handleDelete(sb)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
          />
        ))}
      </div>

      <StoryboardEditor
        storyboard={editingStoryboard}
        projectCharacters={projectCharacters}
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingStoryboard(null);
        }}
      />
    </div>
  );
}
