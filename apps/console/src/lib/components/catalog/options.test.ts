import { describe, expect, it } from "vitest";
import { namedOptions, pageOptions } from "./options";

describe("catalog select options", () => {
  it("maps named records to value and label", () => {
    expect(namedOptions([{ id: "t1", name: "Core" }])).toEqual([{ value: "t1", label: "Core" }]);
  });

  it("gives pages their path as a hint", () => {
    const meta = { metadata: {}, createdAt: "", updatedAt: "", applicationId: null, teamId: null, description: null };
    expect(
      pageOptions([
        { ...meta, id: "p1", name: "Home", path: "/home" },
        { ...meta, id: "p2", name: "About", path: null },
      ]),
    ).toEqual([
      { value: "p1", label: "Home", hint: "/home" },
      { value: "p2", label: "About", hint: null },
    ]);
  });
});
