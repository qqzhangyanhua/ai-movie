"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { User, CreditCard, KeyRound, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSection } from "./AccountSection";
import { SubscriptionSection } from "./SubscriptionSection";
import { AiConfigSection } from "./AiConfigSection";
import { HistorySection } from "./HistorySection";
import type { UserPlanInfo } from "@/lib/actions/subscription";
import type { GenerationHistoryItem } from "@/lib/actions/settings";

const TAB_KEYS = ["account", "subscription", "ai", "history"] as const;
type TabKey = (typeof TAB_KEYS)[number];

interface SettingsTabsProps {
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  planInfo: UserPlanInfo;
  historyItems: GenerationHistoryItem[];
}

export function SettingsTabs({
  username,
  email,
  avatarUrl,
  createdAt,
  planInfo,
  historyItems,
}: SettingsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const currentTab: TabKey =
    tabParam && TAB_KEYS.includes(tabParam as TabKey)
      ? (tabParam as TabKey)
      : "account";

  function handleTabChange(value: string) {
    router.push(`/settings?tab=${value}`);
  }

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="mb-6 grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
        <TabsTrigger value="account" className="flex items-center gap-2">
          <User className="size-4" />
          账户信息
        </TabsTrigger>
        <TabsTrigger value="subscription" className="flex items-center gap-2">
          <CreditCard className="size-4" />
          会员管理
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <KeyRound className="size-4" />
          AI 配置
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="size-4" />
          生成记录
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account">
        <AccountSection
          username={username}
          email={email}
          avatarUrl={avatarUrl}
          createdAt={createdAt}
        />
      </TabsContent>

      <TabsContent value="subscription">
        <SubscriptionSection planInfo={planInfo} />
      </TabsContent>

      <TabsContent value="ai">
        <AiConfigSection />
      </TabsContent>

      <TabsContent value="history">
        <HistorySection items={historyItems} />
      </TabsContent>
    </Tabs>
  );
}
