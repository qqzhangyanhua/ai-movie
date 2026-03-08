"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { TemplateCard } from "./TemplateCard";
import type { ScriptTemplate } from "@/lib/data/script-templates";

const CATEGORIES = ["全部", "爱情", "校园", "科幻", "悬疑", "武侠", "冒险"];

type TemplateGalleryProps = {
  templates: ScriptTemplate[];
};

export function TemplateGallery({ templates }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory =
        selectedCategory === "全部" || t.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索模板名称或描述…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <LayoutGrid className="mx-auto size-12 text-muted-foreground" />
          <p className="mt-4 text-center font-medium">暂无匹配的模板</p>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {searchQuery || selectedCategory !== "全部"
              ? "尝试更换筛选条件或搜索关键词"
              : "模板库为空"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
