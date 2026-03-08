import { test, expect } from "@playwright/test";

/**
 * 需要完整后端（数据库 + API）的测试会使用 test.skip() 标记，
 * 在 CI 或数据库未就绪时可跳过。可通过 E2E_FULL_BACKEND=true 启用。
 */
const needsFullBackend = !process.env.E2E_FULL_BACKEND;

async function registerAndLogin(page: import("@playwright/test").Page) {
  const uniqueEmail = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const username = `user_${Date.now()}`;
  const password = "Test123456";

  await page.goto("/register");
  await page.getByLabel("用户名").fill(username);
  await page.getByLabel("邮箱").fill(uniqueEmail);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "注册" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel("邮箱").fill(uniqueEmail);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("核心创作流程", () => {
  test("首页可访问", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=AI 微电影").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "登录" })).toBeVisible();
    await expect(page.getByRole("link", { name: "注册" })).toBeVisible();
  });

  test.skip(needsFullBackend, "注册新用户", async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}@example.com`;
    const username = `user_${Date.now()}`;
    const password = "Test123456";

    await page.goto("/register");

    await page.getByLabel("用户名").fill(username);
    await page.getByLabel("邮箱").fill(uniqueEmail);
    await page.getByLabel("密码").fill(password);
    await page.getByRole("button", { name: "注册" }).click();

    await expect(page).toHaveURL(/\/(login|dashboard)/);
  });

  test.skip(needsFullBackend, "登录", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("邮箱").fill("test@example.com");
    await page.getByLabel("密码").fill("password");
    await page.getByRole("button", { name: "登录" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test.skip(needsFullBackend, "Dashboard 页面", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "我的电影" })).toBeVisible();
    await expect(page.getByRole("link", { name: /创建项目/ })).toBeVisible();
  });

  test.skip(needsFullBackend, "创建项目", async ({ page }) => {
    await page.goto("/create");

    await page.getByLabel("电影名称").fill(`E2E 测试项目 ${Date.now()}`);
    await page.getByRole("button", { name: "开始创作" }).click();

    await expect(page).toHaveURL(/\/create\/[^/]+\?step=characters/);
  });

  test.skip(needsFullBackend, "角色库页面可访问", async ({ page }) => {
    await page.goto("/dashboard/characters");

    await expect(page.getByRole("heading", { name: "角色库" })).toBeVisible();
  });

  test.skip(needsFullBackend, "模板库页面可访问", async ({ page }) => {
    await page.goto("/dashboard/templates");

    await expect(page.getByRole("heading", { name: "模板库" })).toBeVisible();
    await expect(page.getByText("全部").or(page.getByRole("button", { name: "全部" })).toBeVisible();
  });

  test("公开分享页面处理不存在的视频", async ({ page }) => {
    await page.goto("/movie/nonexistent-id");

    await expect(page.getByText("视频不存在")).toBeVisible();
  });
});
