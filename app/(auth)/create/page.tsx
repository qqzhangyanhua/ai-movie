import { requireAuth } from "@/lib/auth-utils";
import { createProject } from "@/lib/actions/project";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Film } from "lucide-react";

export default async function CreateProjectPage() {
  await requireAuth();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-12">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Film className="size-6 text-primary" />
            <CardTitle>创建 AI 微电影</CardTitle>
          </div>
          <CardDescription>填写基本信息，开始您的创作之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">电影名称</Label>
              <Input
                id="title"
                name="title"
                placeholder="请输入电影名称"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">简介（选填）</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="简要描述您的电影创意"
                rows={3}
                maxLength={500}
                className="resize-none"
              />
            </div>
            <Button type="submit" className="w-full">
              开始创作
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
