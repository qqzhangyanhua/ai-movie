"use client";

import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCharacter } from "@/lib/actions/character";
import { cn } from "@/lib/utils";

const PERSONALITY_OPTIONS = [
  { value: "勇敢", label: "勇敢" },
  { value: "冷酷", label: "冷酷" },
  { value: "温柔", label: "温柔" },
  { value: "幽默", label: "幽默" },
  { value: "神秘", label: "神秘" },
];

const STYLE_OPTIONS = [
  { value: "写实", label: "写实" },
  { value: "动漫", label: "动漫" },
  { value: "古装", label: "古装" },
  { value: "科幻", label: "科幻" },
  { value: "赛博朋克", label: "赛博朋克" },
];

interface CharacterUploaderProps {
  onCreated?: () => void;
}

export function CharacterUploader({ onCreated }: CharacterUploaderProps) {
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState<string>("");
  const [style, setStyle] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          const data = await res.json().catch(() => ({}));
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
      personality: personality || undefined,
      style: style || undefined,
    });
    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setName("");
    setPersonality("");
    setStyle("");
    setPhotoUrl("");
    setPhotoFile(null);
    onCreated?.();
  }

  const isLoading = isUploading || isSubmitting;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">新建角色</h3>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photo">角色照片</Label>
            <div className="flex items-center gap-4">
              <label
                htmlFor="photo"
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
                id="photo"
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
            <Label htmlFor="name">角色名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入角色名称"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>性格</Label>
            <Select
              value={personality}
              onValueChange={setPersonality}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择性格" />
              </SelectTrigger>
              <SelectContent>
                {PERSONALITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>风格</Label>
            <Select value={style} onValueChange={setStyle} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="选择风格" />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            创建角色
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
