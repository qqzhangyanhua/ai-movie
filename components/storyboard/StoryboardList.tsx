"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Plus, RotateCcw, TriangleAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StoryboardCard } from "./StoryboardCard";
import { StoryboardEditor } from "./StoryboardEditor";
import {
  addStoryboard,
  deleteStoryboard,
  generateStoryboardsFromScript,
  reorderStoryboards,
} from "@/lib/actions/storyboard";
import type { Storyboard } from "@prisma/client";
import {
  getStoryboardRoleIssue,
  summarizeStoryboardRoleIssues,
} from "./storyboard-role-utils";

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

  const totalDuration = storyboards.reduce((sum, storyboard) => sum + storyboard.duration, 0);
  const hasProjectCharacters = projectCharacters.length > 0;
  const roleSummary = hasProjectCharacters
    ? summarizeStoryboardRoleIssues(storyboards, projectCharacters)
    : null;

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
      newOrder.map((storyboard) => storyboard.id)
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
      newOrder.map((storyboard) => storyboard.id)
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

      {!hasProjectCharacters && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Users className="mt-0.5 size-4 shrink-0" />
            <p>当前项目还没有可用角色，分镜阶段暂时无法校验出场角色。</p>
          </div>
        </div>
      )}

      {hasProjectCharacters &&
        roleSummary &&
        roleSummary.issueSceneNumbers.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-2">
                <p>
                  发现 {roleSummary.issueSceneNumbers.length} 个分镜的角色分配需要处理。
                </p>
                <div className="flex flex-wrap gap-2">
                  {roleSummary.missingStoryboardCount > 0 && (
                    <Badge className="bg-amber-600 text-white">
                      未分配角色 {roleSummary.missingStoryboardCount} 个
                    </Badge>
                  )}
                  {roleSummary.unknownStoryboardCount > 0 && (
                    <Badge
                      variant="outline"
                      className="border-destructive/40 bg-background text-destructive"
                    >
                      项目外角色 {roleSummary.unknownStoryboardCount} 个
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-background">
                    场景 {roleSummary.issueSceneNumbers.join("、")}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

      <div className="flex flex-col gap-4">
        {storyboards.map((storyboard, index) => (
          <StoryboardCard
            key={storyboard.id}
            storyboard={storyboard}
            roleIssue={
              hasProjectCharacters
                ? getStoryboardRoleIssue(storyboard, projectCharacters)
                : undefined
            }
            canMoveUp={index > 0}
            canMoveDown={index < storyboards.length - 1}
            onEdit={() => handleEdit(storyboard)}
            onDelete={() => handleDelete(storyboard)}
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
          if (!open) {
            setEditingStoryboard(null);
          }
        }}
      />
    </div>
  );
}
