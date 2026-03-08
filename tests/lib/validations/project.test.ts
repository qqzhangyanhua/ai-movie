import { describe, it, expect } from "vitest";
import { createProjectSchema } from "@/lib/validations/project";

describe("createProjectSchema", () => {
  it("accepts valid input", () => {
    expect(
      createProjectSchema.safeParse({ title: "我的电影" }).success
    ).toBe(true);
  });
  it("accepts title with description", () => {
    expect(
      createProjectSchema.safeParse({
        title: "我的电影",
        description: "一个故事",
      }).success
    ).toBe(true);
  });
  it("rejects empty title", () => {
    expect(createProjectSchema.safeParse({ title: "" }).success).toBe(false);
  });
});
