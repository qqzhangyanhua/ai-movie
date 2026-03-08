"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryboardCard } from "./StoryboardCard";
import { StoryboardEditor } from "./StoryboardEditor";
import {
  generateStoryboardsFromScript,
  deleteStoryboard,
  addStoryboard,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">分镜列表</h3>
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

      <div className="space-y-4">
        {storyboards.map((sb) => (
          <StoryboardCard
            key={sb.id}
            storyboard={sb}
            onEdit={() => handleEdit(sb)}
            onDelete={() => handleDelete(sb)}
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
