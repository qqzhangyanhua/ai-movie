"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { generateAiScript } from "@/lib/actions/ai-script";

interface ScriptGeneratorProps {
  projectId: string;
  onGenerated?: () => void;
}

export function ScriptGenerator({
  projectId,
  onGenerated,
}: ScriptGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("请输入故事描述");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await generateAiScript(projectId, trimmed);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onGenerated?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="ai-prompt">故事描述</Label>
        <Textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想要的微电影故事，例如：一个关于两个好朋友在毕业季告别的温馨故事"
          className="min-h-[120px]"
          disabled={loading}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 size-4" />
        )}
        AI 生成剧本
      </Button>
    </div>
  );
}
