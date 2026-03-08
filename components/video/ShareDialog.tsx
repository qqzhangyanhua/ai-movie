"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ShareDialogProps {
  videoId: string;
  trigger?: React.ReactNode;
}

function getShareUrl(videoId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/movie/${videoId}`;
  }
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/movie/${videoId}`;
}

export function ShareDialog({ videoId, trigger }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = getShareUrl(videoId);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("已复制");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline">
            <Copy className="mr-2 size-4" />
            分享
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>分享链接</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <Input
            readOnly
            value={open ? getShareUrl(videoId) : ""}
            className="font-mono text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="size-4 text-green-600" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
