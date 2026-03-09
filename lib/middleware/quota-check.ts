"use server";

import { requireAuth } from "@/lib/auth-utils";
import { checkStorageQuota, checkVideoQuota } from "@/lib/actions/quota";

export type QuotaCheckResult =
  | { allowed: true }
  | { allowed: false; error: string; remaining?: number; available?: number };

export async function checkQuotaMiddleware(
  userId: string,
  type: "video" | "storage",
  size?: number
): Promise<QuotaCheckResult> {
  const session = await requireAuth();
  if (session.user.id !== userId) {
    return { allowed: false, error: "无权限访问该用户配额" };
  }

  if (type === "video") {
    const { allowed, remaining } = await checkVideoQuota(userId);
    if (!allowed) {
      return {
        allowed: false,
        remaining,
        error: "本月视频额度不足，请升级会员或等待下月重置",
      };
    }
    return { allowed: true };
  }

  if (typeof size !== "number" || !Number.isFinite(size) || size <= 0) {
    return {
      allowed: false,
      error: "存储配额校验缺少有效的文件大小参数",
    };
  }

  const { allowed, available } = await checkStorageQuota(userId, size);
  if (!allowed) {
    return {
      allowed: false,
      available,
      error: "存储空间不足，请释放空间或升级会员",
    };
  }

  return { allowed: true };
}
