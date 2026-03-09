"use client";

import { useState } from "react";
import { ServiceType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createServiceConfig } from "@/lib/actions/service-config";
import { toast } from "sonner";

interface ServiceConfigFormProps {
  type: ServiceType;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ServiceConfigForm({
  type,
  onSuccess,
  onCancel,
}: ServiceConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    provider: "",
    apiKey: "",
    baseUrl: "",
    model: "",
    endpoint: "",
    bucket: "",
    region: "",
    accessKey: "",
    secretKey: "",
    isActive: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await createServiceConfig({
        type,
        ...formData,
      });
      toast.success("配置已保存");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setLoading(false);
    }
  }

  function renderFields() {
    switch (type) {
      case "LLM":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">配置名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例如：OpenAI GPT-4"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">服务商</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) =>
                  setFormData({ ...formData, provider: e.target.value })
                }
                placeholder="例如：OpenAI"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                placeholder="sk-..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL（可选）</Label>
              <Input
                id="baseUrl"
                value={formData.baseUrl}
                onChange={(e) =>
                  setFormData({ ...formData, baseUrl: e.target.value })
                }
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">模型</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="gpt-4"
                required
              />
            </div>
          </>
        );

      case "VIDEO_GENERATION":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">配置名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例如：Runway Gen-3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">服务商</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) =>
                  setFormData({ ...formData, provider: e.target.value })
                }
                placeholder="例如：Runway"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL（可选）</Label>
              <Input
                id="baseUrl"
                value={formData.baseUrl}
                onChange={(e) =>
                  setFormData({ ...formData, baseUrl: e.target.value })
                }
                placeholder="https://api.runwayml.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">模型（可选）</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="gen3"
              />
            </div>
          </>
        );

      case "STORAGE":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">配置名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例如：MinIO 本地存储"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">服务商</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) =>
                  setFormData({ ...formData, provider: e.target.value })
                }
                placeholder="例如：MinIO"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                value={formData.endpoint}
                onChange={(e) =>
                  setFormData({ ...formData, endpoint: e.target.value })
                }
                placeholder="http://localhost:9000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bucket">Bucket</Label>
              <Input
                id="bucket"
                value={formData.bucket}
                onChange={(e) =>
                  setFormData({ ...formData, bucket: e.target.value })
                }
                placeholder="ai-movie"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region（可选）</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                placeholder="us-east-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessKey">Access Key</Label>
              <Input
                id="accessKey"
                value={formData.accessKey}
                onChange={(e) =>
                  setFormData({ ...formData, accessKey: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                value={formData.secretKey}
                onChange={(e) =>
                  setFormData({ ...formData, secretKey: e.target.value })
                }
                required
              />
            </div>
          </>
        );

      case "TTS":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">配置名称</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例如：OpenAI TTS"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">服务商</Label>
              <Input
                id="provider"
                value={formData.provider}
                onChange={(e) =>
                  setFormData({ ...formData, provider: e.target.value })
                }
                placeholder="例如：OpenAI"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL（可选）</Label>
              <Input
                id="baseUrl"
                value={formData.baseUrl}
                onChange={(e) =>
                  setFormData({ ...formData, baseUrl: e.target.value })
                }
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">模型（可选）</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="tts-1"
              />
            </div>
          </>
        );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>添加配置</CardTitle>
        <CardDescription>填写服务配置信息</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFields()}

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">设为启用</Label>
              <p className="text-sm text-muted-foreground">
                启用后将作为默认配置使用
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存配置"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
