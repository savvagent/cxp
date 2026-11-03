import { describe, expect, it } from "vitest";
import { z } from "./zod.js";
import { ALL, NONE, fromFilterSelect, fromOptionalSelect, validate } from "./forms";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  name: z.string().min(1, "Name is required").min(3, "Too short"),
  note: z.string().optional(),
});

describe("validate", () => {
  it("returns the parsed values", () => {
    const values = { email: "ada@example.com", name: "Ada" };
    expect(validate(schema, values)).toEqual({ ok: true, data: values });
  });

  it("returns the first message of each invalid field", () => {
    expect(validate(schema, { email: "nope", name: "" })).toEqual({
      ok: false,
      errors: { email: "Enter a valid email address", name: "Name is required" },
    });
  });

  it("leaves out issues that belong to no field", () => {
    const refined = schema.refine(() => false, "whole form");
    expect(validate(refined, { email: "ada@example.com", name: "Ada" })).toEqual({ ok: false, errors: {} });
  });
});

describe("select sentinels", () => {
  it("are distinct and never empty", () => {
    expect(ALL).not.toBe(NONE);
    expect(ALL).not.toBe("");
    expect(NONE).not.toBe("");
  });

  it("the all item is no filter", () => {
    expect(fromFilterSelect(ALL)).toBeUndefined();
    expect(fromFilterSelect("")).toBeUndefined();
    expect(fromFilterSelect(undefined)).toBeUndefined();
    expect(fromFilterSelect("open")).toBe("open");
  });

  it("the none item is an unset field", () => {
    expect(fromOptionalSelect(NONE)).toBe("");
    expect(fromOptionalSelect("chat")).toBe("chat");
    expect(fromOptionalSelect("")).toBe("");
  });
});
