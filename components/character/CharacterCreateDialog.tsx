"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCharacter } from "@/lib/actions/character";
import { cn } from "@/lib/utils";

interface CharacterCreateDialogProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CharacterCreateDialog({
  children,
  open,
  onOpenChange,
  onCreated,
}: CharacterCreateDialogProps) {
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [style, setStyle] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setName("");
    setPersonality("");
    setStyle("");
    setPhotoUrl("");
    setPhotoFile(null);
    setError(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }

    setError(null);
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("请输入角色名称");
      return;
    }

    let finalPhotoUrl = photoUrl;

    if (photoFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.set("file", photoFile);
        formData.set("type", "characters");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "上传失败");
        }

        const data = (await res.json()) as { url: string };
        finalPhotoUrl = data.url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "上传失败");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    if (!finalPhotoUrl) {
      setError("请上传角色照片");
      return;
    }

    setIsSubmitting(true);
    const result = await createCharacter({
      name: name.trim(),
      photoUrl: finalPhotoUrl,
      personality: personality.trim() || undefined,
      style: style.trim() || undefined,
    });
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    resetForm();
    onOpenChange(false);
    onCreated?.();
  }

  const isLoading = isUploading || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新建角色</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="create-photo">角色照片</Label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="create-photo"
                className={cn(
                  "flex aspect-square w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                  photoUrl
                    ? "border-primary/50 bg-muted/30"
                    : "border-muted-foreground/30 hover:border-primary/50"
                )}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="预览"
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ) : (
                  <Upload className="size-8 text-muted-foreground" />
                )}
              </label>
              <input
                id="create-photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <span className="text-sm text-muted-foreground">
                {photoFile ? photoFile.name : "点击选择图片"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-name">角色名称</Label>
            <Input
              id="create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入角色名称"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-personality">性格（可选）</Label>
            <Input
              id="create-personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="如：勇敢、温柔"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-style">风格（可选）</Label>
            <Input
              id="create-style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="如：写实、动漫"
              disabled={isLoading}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              创建
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
