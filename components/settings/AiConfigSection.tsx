"use client";

import { useState } from "react";
import { KeyRound, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AiConfigSection() {
  const [apiKey, setApiKey] = useState("");
  const [maskedKey, setMaskedKey] = useState("sk-****");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSaveApiKey(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      // 当前简化为展示 UI，实际存储需加密
      // 这里仅做占位，不真正写入数据库
      await new Promise((r) => setTimeout(r, 500));
      setMaskedKey(`sk-****${apiKey.slice(-4)}`);
      setApiKey("");
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5" />
          OpenAI API Key
        </CardTitle>
        <CardDescription>
          配置您的 OpenAI API Key 可不受免费额度限制
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSaveApiKey} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={maskedKey}
              autoComplete="off"
              className="max-w-md font-mono"
            />
            <p className="text-xs text-muted-foreground">
              已保存的 Key 会显示为：{maskedKey}
            </p>
          </div>
          <Button type="submit" disabled={saving || !apiKey.trim()}>
            {saving ? "保存中..." : "保存 API Key"}
          </Button>
          {saved && (
            <p className="text-sm text-green-600">API Key 已保存（仅 UI 演示）</p>
          )}
        </form>

        <div className="flex gap-2 rounded-lg border border-muted bg-muted/50 p-4">
          <Info className="size-5 shrink-0 text-muted-foreground" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              配置自己的 API Key 可以不受免费额度限制，使用更多 AI 功能。
            </p>
            <p className="text-xs">
              注意：当前为 UI 演示，实际存储需加密。请勿在生产环境输入真实
              API Key，除非已实现安全存储。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
