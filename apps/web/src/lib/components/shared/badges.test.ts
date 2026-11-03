import { describe, expect, it } from "vitest";
import { priorityClass, priorityLabel, statusClass, statusLabel } from "./badges";

describe("statusClass", () => {
  it("colours every ticket status as the old console did", () => {
    expect(statusClass("open")).toBe("bg-blue-100 text-blue-800 hover:bg-blue-100");
    expect(statusClass("in_progress")).toBe("bg-yellow-100 text-yellow-800 hover:bg-yellow-100");
    expect(statusClass("waiting")).toBe("bg-orange-100 text-orange-800 hover:bg-orange-100");
    expect(statusClass("resolved")).toBe("bg-green-100 text-green-800 hover:bg-green-100");
    expect(statusClass("closed")).toBe("bg-gray-100 text-gray-800 hover:bg-gray-100");
  });

  it("leaves an unknown status, or an inherited key, uncoloured", () => {
    expect(statusClass("archived")).toBe("");
    expect(statusClass("")).toBe("");
    expect(statusClass("constructor")).toBe("");
    expect(statusClass("toString")).toBe("");
  });
});

describe("statusLabel", () => {
  it("names a known status in the active locale", () => {
    expect(statusLabel("in_progress")).toBe("In Progress");
    expect(statusLabel("open")).toBe("Open");
  });

  it("replaces every underscore of an unknown status with a space", () => {
    expect(statusLabel("a_b_c")).toBe("a b c");
  });
});

describe("priorityLabel", () => {
  it("names a known priority, and leaves an unknown one as it is", () => {
    expect(priorityLabel("urgent")).toBe("Urgent");
    expect(priorityLabel("critical")).toBe("critical");
  });
});

describe("priorityClass", () => {
  it("colours every ticket priority as the old console did", () => {
    expect(priorityClass("urgent")).toBe("bg-red-100 text-red-800 hover:bg-red-100");
    expect(priorityClass("high")).toBe("bg-orange-100 text-orange-800 hover:bg-orange-100");
    expect(priorityClass("medium")).toBe("bg-yellow-100 text-yellow-800 hover:bg-yellow-100");
    expect(priorityClass("low")).toBe("bg-green-100 text-green-800 hover:bg-green-100");
  });

  it("leaves an unknown priority, or an inherited key, uncoloured", () => {
    expect(priorityClass("critical")).toBe("");
    expect(priorityClass("__proto__")).toBe("");
  });
});
