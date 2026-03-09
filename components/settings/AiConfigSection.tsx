"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceConfigForm } from "./ServiceConfigForm";
import { ServiceConfigList } from "./ServiceConfigList";
import { getServiceConfigs } from "@/lib/actions/service-config";
import { ServiceType } from "@prisma/client";
import type { ServiceConfigOutput } from "@/types/service-config";

export function AiConfigSection() {
  const [configs, setConfigs] = useState<ServiceConfigOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentType, setCurrentType] = useState<ServiceType>("LLM");

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    try {
      setLoading(true);
      const data = await getServiceConfigs();
      setConfigs(data);
    } catch (error) {
      console.error("Failed to load configs:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(value: string) {
    setCurrentType(value as ServiceType);
    setShowForm(false);
  }

  const filteredConfigs = configs.filter((c) => c.type === currentType);

  return (
    <Card>
      <CardHeader>
        <CardTitle>服务配置中心</CardTitle>
        <CardDescription>
          配置 AI 服务、视频生成、存储等第三方服务
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentType} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="LLM">AI 模型</TabsTrigger>
            <TabsTrigger value="VIDEO_GENERATION">视频生成</TabsTrigger>
            <TabsTrigger value="STORAGE">存储服务</TabsTrigger>
            <TabsTrigger value="TTS">语音合成</TabsTrigger>
          </TabsList>

          <TabsContent value="LLM" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                配置 OpenAI、Claude 等 LLM 服务用于剧本生成
              </p>
              <Button
                size="sm"
                onClick={() => setShowForm(!showForm)}
                variant={showForm ? "outline" : "default"}
              >
                {showForm ? (
                  <>
                    <X className="mr-2 size-4" />
                    取消
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 size-4" />
                    添加配置
                  </>
                )}
              </Button>
            </div>

            {showForm && (
              <ServiceConfigForm
                type="LLM"
                onSuccess={() => {
                  setShowForm(false);
                  loadConfigs();
                }}
                onCancel={() => setShowForm(false)}
              />
            )}

            <ServiceConfigList
              configs={filteredConfigs}
              loading={loading}
              onUpdate={loadConfigs}
            />
          </TabsContent>

          <TabsContent value="VIDEO_GENERATION" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                配置 Runway、Luma、Pika 等视频生成服务
              </p>
              <Button
                size="sm"
                onClick={() => setShowForm(!showForm)}
                variant={showForm ? "outline" : "default"}
              >
                {showForm ? (
                  <>
                    <X className="mr-2 size-4" />
                    取消
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 size-4" />
                    添加配置
                  </>
                )}
              </Button>
            </div>

            {showForm && (
              <ServiceConfigForm
                type="VIDEO_GENERATION"
                onSuccess={() => {
                  setShowForm(false);
                  loadConfigs();
                }}
                onCancel={() => setShowForm(false)}
              />
            )}

            <ServiceConfigList
              configs={filteredConfigs}
              loading={loading}
              onUpdate={loadConfigs}
            />
          </TabsContent>

          <TabsContent value="STORAGE" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                配置 MinIO、AWS S3 等对象存储服务
              </p>
              <Button
                size="sm"
                onClick={() => setShowForm(!showForm)}
                variant={showForm ? "outline" : "default"}
              >
                {showForm ? (
                  <>
                    <X className="mr-2 size-4" />
                    取消
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 size-4" />
                    添加配置
                  </>
                )}
              </Button>
            </div>

            {showForm && (
              <ServiceConfigForm
                type="STORAGE"
                onSuccess={() => {
                  setShowForm(false);
                  loadConfigs();
                }}
                onCancel={() => setShowForm(false)}
              />
            )}

            <ServiceConfigList
              configs={filteredConfigs}
              loading={loading}
              onUpdate={loadConfigs}
            />
          </TabsContent>

          <TabsContent value="TTS" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                配置 OpenAI TTS、ElevenLabs 等语音合成服务
              </p>
              <Button
                size="sm"
                onClick={() => setShowForm(!showForm)}
                variant={showForm ? "outline" : "default"}
              >
                {showForm ? (
                  <>
                    <X className="mr-2 size-4" />
                    取消
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 size-4" />
                    添加配置
                  </>
                )}
              </Button>
            </div>

            {showForm && (
              <ServiceConfigForm
                type="TTS"
                onSuccess={() => {
                  setShowForm(false);
                  loadConfigs();
                }}
                onCancel={() => setShowForm(false)}
              />
            )}

            <ServiceConfigList
              configs={filteredConfigs}
              loading={loading}
              onUpdate={loadConfigs}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
