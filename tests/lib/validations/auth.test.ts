import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "@/lib/validations/auth";

describe("registerSchema", () => {
  it("accepts valid input", () => {
    expect(
      registerSchema.safeParse({
        username: "test",
        email: "a@b.com",
        password: "123456",
      }).success
    ).toBe(true);
  });
  it("rejects short username", () => {
    expect(
      registerSchema.safeParse({
        username: "a",
        email: "a@b.com",
        password: "123456",
      }).success
    ).toBe(false);
  });
  it("rejects invalid email", () => {
    expect(
      registerSchema.safeParse({
        username: "test",
        email: "bad",
        password: "123456",
      }).success
    ).toBe(false);
  });
  it("rejects short password", () => {
    expect(
      registerSchema.safeParse({
        username: "test",
        email: "a@b.com",
        password: "12",
      }).success
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid input", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.com", password: "123456" }).success
    ).toBe(true);
  });
  it("rejects invalid email", () => {
    expect(
      loginSchema.safeParse({ email: "bad", password: "123456" }).success
    ).toBe(false);
  });
});
