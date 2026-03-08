"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Users, LayoutGrid, Settings, Plus } from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "我的电影", icon: Film },
  { href: "/dashboard/characters", label: "角色库", icon: Users },
  { href: "/dashboard/templates", label: "模板库", icon: LayoutGrid },
  { href: "/settings", label: "设置", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Film className="size-6 text-primary" />
          <span>AI 微电影</span>
        </Link>
      </div>
      <div className="flex-1 space-y-1 p-4">
        <Link
          href="/create"
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "w-full justify-start gap-2")}
        >
          <Plus className="size-4" />
          创建项目
        </Link>
        <nav className="flex flex-col gap-1 pt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
