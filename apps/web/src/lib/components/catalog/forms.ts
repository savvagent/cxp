// The catalog pages' create/edit forms: the same zod schemas, defaults and
// request bodies as the React console's react-hook-form dialogs, framework-free
// so they are tested on their own.
import { z } from "#lib/zod.js";
import type {
  CreateApplicationInput,
  CreateComponentInput,
  CreateExperienceInput,
  CreatePageInput,
  UpdateApplicationInput,
  UpdateComponentInput,
  UpdateExperienceInput,
  UpdatePageInput,
} from "#lib/queries/index.js";
import type { Application, Component, Experience, MyTeam, Page } from "#lib/types.js";

export const experienceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  team_id: z.string().optional(),
});

export const applicationSchema = z.object({
  experience_id: z.string().optional(),
  team_id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  platform: z.string().optional(),
});

export const pageSchema = z.object({
  application_id: z.string().optional(),
  team_id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  path: z.string().optional(),
  description: z.string().optional(),
});

export const componentSchema = z.object({
  page_id: z.string().optional(),
  team_id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  component_type: z.string().optional(),
  description: z.string().optional(),
});

export type ExperienceForm = z.infer<typeof experienceSchema>;
export type ApplicationForm = z.infer<typeof applicationSchema>;
export type PageForm = z.infer<typeof pageSchema>;
export type ComponentForm = z.infer<typeof componentSchema>;

/** A form's values as the dialog edits them: every field a string. */
export type FormValues = Record<string, string>;
/** The first message for each invalid field. */
export type FormErrors = Partial<Record<string, string>>;

/** Validates `values`; on failure, the first message per field. */
export function validate<T>(
  schema: z.ZodType<T>,
  values: FormValues,
): { ok: true; data: T } | { ok: false; errors: FormErrors } {
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };
  const errors: FormErrors = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (!(key in errors)) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

// Initial values: an edited record's fields, or the React forms' defaults
// (empty strings) for a new one.

export function experienceFormValues(editing?: Experience | null): FormValues {
  return {
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    team_id: editing?.teamId ?? "",
  };
}

export function applicationFormValues(editing?: Application | null): FormValues {
  return {
    experience_id: editing?.experienceId ?? "",
    team_id: editing?.teamId ?? "",
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    platform: editing?.platform ?? "",
  };
}

export function pageFormValues(editing?: Page | null): FormValues {
  return {
    application_id: editing?.applicationId ?? "",
    team_id: editing?.teamId ?? "",
    name: editing?.name ?? "",
    path: editing?.path ?? "",
    description: editing?.description ?? "",
  };
}

export function componentFormValues(editing?: Component | null): FormValues {
  return {
    page_id: editing?.pageId ?? "",
    team_id: editing?.teamId ?? "",
    name: editing?.name ?? "",
    component_type: editing?.componentType ?? "",
    description: editing?.description ?? "",
  };
}

// Request bodies, exactly as the React dialogs built them: an empty optional
// field is left out, a cleared team is `null` on update (unassigns it) and left
// out on create, and an update never moves a record to another parent.

export function experienceCreateInput(v: ExperienceForm): CreateExperienceInput {
  return { name: v.name, description: v.description || undefined, teamId: v.team_id || undefined };
}

export function experienceUpdateInput(id: string, v: ExperienceForm): UpdateExperienceInput {
  return { id, data: { name: v.name, description: v.description || undefined, teamId: v.team_id || null } };
}

export function applicationCreateInput(v: ApplicationForm): CreateApplicationInput {
  return {
    experienceId: v.experience_id || undefined,
    teamId: v.team_id || undefined,
    name: v.name,
    description: v.description || undefined,
    platform: v.platform || undefined,
  };
}

export function applicationUpdateInput(id: string, v: ApplicationForm): UpdateApplicationInput {
  return {
    id,
    data: {
      name: v.name,
      description: v.description || undefined,
      platform: v.platform || undefined,
      teamId: v.team_id || null,
    },
  };
}

export function pageCreateInput(v: PageForm): CreatePageInput {
  return {
    applicationId: v.application_id || undefined,
    teamId: v.team_id || undefined,
    name: v.name,
    path: v.path || undefined,
    description: v.description || undefined,
  };
}

export function pageUpdateInput(id: string, v: PageForm): UpdatePageInput {
  return {
    id,
    data: {
      name: v.name,
      path: v.path || undefined,
      description: v.description || undefined,
      teamId: v.team_id || null,
    },
  };
}

export function componentCreateInput(v: ComponentForm): CreateComponentInput {
  return {
    pageId: v.page_id || undefined,
    teamId: v.team_id || undefined,
    name: v.name,
    componentType: v.component_type || undefined,
    description: v.description || undefined,
  };
}

export function componentUpdateInput(id: string, v: ComponentForm): UpdateComponentInput {
  return {
    id,
    data: {
      name: v.name,
      componentType: v.component_type || undefined,
      description: v.description || undefined,
      teamId: v.team_id || null,
    },
  };
}

// Table labels.

/** A named record's name, else the first eight characters of its id. */
export function nameOf(items: readonly { id: string; name: string }[], id: string): string {
  return items.find((i) => i.id === id)?.name ?? id.slice(0, 8);
}

/** A team's name, else the first eight characters of its id. */
export function teamName(teams: readonly MyTeam[], id: string): string {
  return nameOf(teams, id);
}

/** A page as the components table shows it: "Home (/home)", else its short id. */
export function pageName(pages: readonly Page[], id: string): string {
  const pg = pages.find((p) => p.id === id);
  return pg ? `${pg.name}${pg.path ? ` (${pg.path})` : ""}` : id.slice(0, 8);
}

/** The "Showing n of total" footer, shown only past one page (as React did). */
export function showingLine(pageSize: number, shown: number, total: number, noun: string): string | null {
  return total > pageSize ? `Showing ${Math.min(pageSize, shown)} of ${total} ${noun}` : null;
}

/** The delete confirmation's text. */
export function deleteDescription(name: string | undefined): string {
  return `Are you sure you want to delete "${name}"? This cannot be undone.`;
}
