"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, changePassword } from "@/lib/actions/settings";

interface AccountSectionProps {
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
}

export function AccountSection({
  username,
  email,
  avatarUrl,
  createdAt,
}: AccountSectionProps) {
  const router = useRouter();
  const [usernameValue, setUsernameValue] = useState(username);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function handleSaveUsername() {
    setUsernameError(null);
    setUsernameSaving(true);
    try {
      const result = await updateProfile({ username: usernameValue });
      if (result.success) {
        router.refresh();
      } else if (result.error) {
        setUsernameError(result.error);
      }
    } finally {
      setUsernameSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordSaving(true);
    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (result.success) {
        setPasswordSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else if (result.error) {
        setPasswordError(result.error);
      }
    } finally {
      setPasswordSaving(false);
    }
  }

  const formattedDate = new Date(createdAt).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>管理您的个人资料和账户安全</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={username} />
              ) : null}
              <AvatarFallback>
                <User className="size-8 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-muted-foreground">头像</p>
              <p className="text-sm font-medium">默认头像</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <div className="flex gap-2">
              <Input
                id="username"
                value={usernameValue}
                onChange={(e) => setUsernameValue(e.target.value)}
                placeholder="请输入用户名"
                className="max-w-xs"
              />
              <Button
                onClick={handleSaveUsername}
                disabled={usernameSaving || usernameValue === username}
              >
                {usernameSaving ? "保存中..." : "保存"}
              </Button>
            </div>
            {usernameError && (
              <p className="text-sm text-destructive">{usernameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <Input
                id="email"
                value={email}
                readOnly
                disabled
                className="max-w-xs bg-muted"
              />
            </div>
            <p className="text-xs text-muted-foreground">邮箱不可修改</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4" />
            <span>注册时间：{formattedDate}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5" />
            修改密码
          </CardTitle>
          <CardDescription>定期修改密码以保护账户安全</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">当前密码</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="请输入当前密码"
                required
                className="max-w-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少 6 位）"
                required
                minLength={6}
                className="max-w-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                required
                className="max-w-xs"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-green-600">密码修改成功</p>
            )}
            <Button type="submit" disabled={passwordSaving}>
              {passwordSaving ? "修改中..." : "修改密码"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
