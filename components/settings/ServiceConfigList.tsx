"use client";

import { useState } from "react";
import { Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteServiceConfig,
} from "@/lib/actions/service-config";
import { toast } from "sonner";
import type { ServiceConfigOutput } from "@/types/service-config";

interface ServiceConfigListProps {
  configs: ServiceConfigOutput[];
  loading: boolean;
  onUpdate: () => void;
}

export function ServiceConfigList({
  configs,
  loading,
  onUpdate,
}: ServiceConfigListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  async function handleToggle(id: string) {
    setToggling(id);
    try {
      toast.info("ServiceConfig 功能已废弃，请使用环境变量配置");
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "操作失败");
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;

    try {
      await deleteServiceConfig();
      toast.success("配置已删除");
      onUpdate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除失败");
    } finally {
      setDeleteId(null);
    }
  }

  function maskSensitiveData(value: string | undefined | null): string {
    if (!value) return "-";
    if (value.length <= 8) return "****";
    return `${value.slice(0, 4)}****${value.slice(-4)}`;
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">暂无配置</p>
          <p className="mt-1 text-xs text-muted-foreground">
            点击上方"添加配置"按钮创建第一个配置
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {configs.map((config) => (
          <Card key={config.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {config.name}
                    {config.isActive && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        <Check className="mr-1 size-3" />
                        启用中
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>{config.provider}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.isActive}
                    onCheckedChange={() => handleToggle(config.id)}
                    disabled={toggling === config.id}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteId(config.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {config.type === "LLM" && (
                  <>
                    <div>
                      <dt className="font-medium text-muted-foreground">
                        API Key
                      </dt>
                      <dd className="mt-1 font-mono">
                        {maskSensitiveData(config.baseUrl)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-muted-foreground">
                        模型
                      </dt>
                      <dd className="mt-1">{config.model || "-"}</dd>
                    </div>
                    {config.baseUrl && (
                      <div className="col-span-2">
                        <dt className="font-medium text-muted-foreground">
                          Base URL
                        </dt>
                        <dd className="mt-1 truncate">{config.baseUrl}</dd>
                      </div>
                    )}
                  </>
                )}

                {config.type === "VIDEO_GENERATION" && (
                  <>
                    <div>
                      <dt className="font-medium text-muted-foreground">
                        API Key
                      </dt>
                      <dd className="mt-1 font-mono">
                        {maskSensitiveData(config.baseUrl)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-muted-foreground">
                        模型
                      </dt>
                      <dd className="mt-1">{config.model || "-"}</dd>
                    </div>
                    {config.baseUrl && (
                      <div className="col-span-2">
                        <dt className="font-medium text-muted-foreground">
                          Base URL
                        </dt>
                        <dd className="mt-1 truncate">{config.baseUrl}</dd>
                      </div>
                    )}
                  </>
                )}

                {config.type === "STORAGE" && (
                  <>
                    <div>
                      <dt className="font-medium text-muted-foreground">
                        Endpoint
                      </dt>
                      <dd className="mt-1 truncate">{config.endpoint}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-muted-foreground">
                        Bucket
                      </dt>
                      <dd className="mt-1">{config.bucket}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-muted-foreground">
                        Region
                      </dt>
                      <dd className="mt-1">{config.region || "-"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-muted-foreground">
                        Access Key
                      </dt>
                      <dd className="mt-1 font-mono">
                        {maskSensitiveData(config.region)}
                      </dd>
                    </div>
                  </>
                )}

                {config.type === "TTS" && (
                  <>
                    <div>
                      <dt className="font-medium text-muted-foreground">
                        API Key
                      </dt>
                      <dd className="mt-1 font-mono">
                        {maskSensitiveData(config.baseUrl)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-muted-foreground">
                        模型
                      </dt>
                      <dd className="mt-1">{config.model || "-"}</dd>
                    </div>
                    {config.baseUrl && (
                      <div className="col-span-2">
                        <dt className="font-medium text-muted-foreground">
                          Base URL
                        </dt>
                        <dd className="mt-1 truncate">{config.baseUrl}</dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。删除后，使用此配置的功能将无法正常工作。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" size="default">取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" size="default" onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
