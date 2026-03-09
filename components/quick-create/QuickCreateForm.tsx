"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function QuickCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(files: FileList | null) {
    if (!files) return;

    const newFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (newFiles.length === 0) {
      toast.error("请选择图片文件");
      return;
    }

    setPhotos((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("请输入项目标题");
      return;
    }

    if (photos.length === 0) {
      toast.error("请至少上传一张照片");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }
      photos.forEach((photo) => {
        formData.append("photos", photo);
      });

      const response = await fetch("/api/projects/quick-create", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "创建失败");
      }

      toast.success("项目创建成功，正在生成视频...");
      router.push(`/create/${data.projectId}/progress`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建失败，请重试");
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>快速创建视频</CardTitle>
        <CardDescription>
          上传照片，AI 将自动生成精彩视频
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              项目标题 <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：我的旅行回忆"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              项目描述（可选）
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述一下这个视频的主题..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              上传照片 <span className="text-destructive">*</span>
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25"
              }`}
            >
              <Upload className="mx-auto size-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                拖拽照片到这里，或
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="ml-1 text-primary hover:underline"
                  disabled={isSubmitting}
                >
                  点击选择
                </button>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                disabled={isSubmitting}
              />
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                {previews.map((preview, index) => (
                  <div key={index} className="group relative aspect-square">
                    <img
                      src={preview}
                      alt={`预览 ${index + 1}`}
                      className="size-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      disabled={isSubmitting}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !title.trim() || photos.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                创建中...
              </>
            ) : (
              "开始创建"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
