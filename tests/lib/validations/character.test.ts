import { describe, it, expect } from "vitest";
import { createCharacterSchema } from "@/lib/validations/character";

describe("createCharacterSchema", () => {
  it("accepts valid input", () => {
    expect(
      createCharacterSchema.safeParse({
        name: "角色A",
        photoUrl: "/photo.jpg",
      }).success
    ).toBe(true);
  });
  it("accepts full input", () => {
    expect(
      createCharacterSchema.safeParse({
        name: "角色A",
        photoUrl: "/photo.jpg",
        personality: "勇敢",
        style: "写实",
      }).success
    ).toBe(true);
  });
  it("rejects empty name", () => {
    expect(
      createCharacterSchema.safeParse({ name: "", photoUrl: "/photo.jpg" })
        .success
    ).toBe(false);
  });
  it("rejects missing photoUrl", () => {
    expect(
      createCharacterSchema.safeParse({ name: "角色A" }).success
    ).toBe(false);
  });
});
