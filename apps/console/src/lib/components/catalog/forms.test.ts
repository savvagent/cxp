import { describe, expect, it } from "vitest";
import type { Application, Component, Experience, Page } from "#lib/types.js";
import {
  applicationCreateInput,
  applicationFormValues,
  applicationSchema,
  applicationUpdateInput,
  componentCreateInput,
  componentFormValues,
  componentSchema,
  componentUpdateInput,
  deleteDescription,
  experienceCreateInput,
  experienceFormValues,
  experienceSchema,
  experienceUpdateInput,
  nameOf,
  pageCreateInput,
  pageFormValues,
  pageName,
  pageSchema,
  pageUpdateInput,
  showingLine,
  teamName,
  validate,
} from "./forms";

const base = { metadata: {}, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };

describe("validation", () => {
  it.each([
    ["experience", experienceSchema, experienceFormValues()],
    ["application", applicationSchema, applicationFormValues()],
    ["page", pageSchema, pageFormValues()],
    ["component", componentSchema, componentFormValues()],
  ] as const)("a new %s needs a name", (_, schema, values) => {
    const result = validate(schema, values);
    expect(result).toEqual({ ok: false, errors: { name: "Name is required" } });
  });

  it("accepts a name with every optional field empty", () => {
    const result = validate(applicationSchema, { ...applicationFormValues(), name: "iOS App" });
    expect(result.ok).toBe(true);
  });
});

describe("initial values", () => {
  it("are empty strings for a new record", () => {
    expect(experienceFormValues()).toEqual({ name: "", description: "", team_id: "" });
    expect(applicationFormValues(null)).toEqual({
      experience_id: "",
      team_id: "",
      name: "",
      description: "",
      platform: "",
    });
  });

  it("are the edited record's fields, nulls as empty strings", () => {
    const page: Page = { ...base, id: "p1", applicationId: "a1", teamId: null, name: "Home", path: "/home", description: null };
    expect(pageFormValues(page)).toEqual({
      application_id: "a1",
      team_id: "",
      name: "Home",
      path: "/home",
      description: "",
    });
    const comp: Component = { ...base, id: "c1", pageId: null, teamId: "t1", name: "Hero", componentType: "banner", description: "d" };
    expect(componentFormValues(comp)).toEqual({
      page_id: "",
      team_id: "t1",
      name: "Hero",
      component_type: "banner",
      description: "d",
    });
  });
});

describe("request bodies", () => {
  it("create leaves out empty fields, including an unset team", () => {
    expect(experienceCreateInput({ name: "Web", description: "", team_id: "" })).toEqual({
      name: "Web",
      description: undefined,
      teamId: undefined,
    });
    expect(
      applicationCreateInput({ name: "iOS", experience_id: "e1", team_id: "t1", platform: "ios", description: "" }),
    ).toEqual({ experienceId: "e1", teamId: "t1", name: "iOS", description: undefined, platform: "ios" });
    expect(pageCreateInput({ name: "Home", application_id: "", team_id: "", path: "/home", description: "x" })).toEqual({
      applicationId: undefined,
      teamId: undefined,
      name: "Home",
      path: "/home",
      description: "x",
    });
    expect(componentCreateInput({ name: "Hero", page_id: "p1", team_id: "", component_type: "", description: "" })).toEqual({
      pageId: "p1",
      teamId: undefined,
      name: "Hero",
      componentType: undefined,
      description: undefined,
    });
  });

  it("update sends a cleared team as null and never the parent", () => {
    expect(experienceUpdateInput("e1", { name: "Web", description: "d", team_id: "" })).toEqual({
      id: "e1",
      data: { name: "Web", description: "d", teamId: null },
    });
    expect(
      applicationUpdateInput("a1", { name: "iOS", experience_id: "e2", team_id: "t1", platform: "", description: "" }),
    ).toEqual({ id: "a1", data: { name: "iOS", description: undefined, platform: undefined, teamId: "t1" } });
    expect(pageUpdateInput("p1", { name: "Home", application_id: "a2", team_id: "", path: "", description: "" })).toEqual({
      id: "p1",
      data: { name: "Home", path: undefined, description: undefined, teamId: null },
    });
    expect(
      componentUpdateInput("c1", { name: "Hero", page_id: "p2", team_id: "", component_type: "modal", description: "" }),
    ).toEqual({ id: "c1", data: { name: "Hero", componentType: "modal", description: undefined, teamId: null } });
  });
});

describe("labels", () => {
  const exp: Experience = { ...base, id: "e1", name: "Web", description: null, teamId: null };
  const app: Application = { ...base, id: "a1", experienceId: "e1", teamId: null, name: "iOS", description: null, platform: null };

  it("names a known record and shortens an unknown id", () => {
    expect(nameOf([exp], "e1")).toBe("Web");
    expect(nameOf([app], "0123456789abcdef")).toBe("01234567");
    expect(teamName([{ id: "t1", slug: "core", name: "Core" }], "t1")).toBe("Core");
    expect(teamName([], "t1234567890")).toBe("t1234567");
  });

  it("names a page with its path", () => {
    const pages: Page[] = [
      { ...base, id: "p1", applicationId: null, teamId: null, name: "Home", path: "/home", description: null },
      { ...base, id: "p2", applicationId: null, teamId: null, name: "About", path: null, description: null },
    ];
    expect(pageName(pages, "p1")).toBe("Home (/home)");
    expect(pageName(pages, "p2")).toBe("About");
    expect(pageName(pages, "abcdefghijk")).toBe("abcdefgh");
  });

  it("shows the paging footer only past one page", () => {
    expect(showingLine(20, 20, 20, "pages")).toBeNull();
    expect(showingLine(20, 20, 45, "pages")).toBe("Showing 20 of 45 pages");
  });

  it("quotes the name in the delete confirmation", () => {
    expect(deleteDescription("Web")).toBe('Are you sure you want to delete "Web"? This cannot be undone.');
  });
});
