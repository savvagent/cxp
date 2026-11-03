// What makes one catalog level's list page different from the others. The
// four pages (experiences, applications, pages, components) are one component,
// `catalog-list-page.svelte`, driven by one of these.
import type { Accessor, CreateMutationResult, CreateQueryResult } from "@tanstack/svelte-query";
import type { Component } from "svelte";
import type { z } from "#lib/zod.js";
import type { PaginatedResponse } from "#lib/types.js";
import type { FormValues } from "./forms.js";
import type { CatalogOption } from "./options.js";

/** What every catalog record has. */
export interface CatalogRecord {
  id: string;
  name: string;
  teamId: string | null;
  description: string | null;
  createdAt: string;
}

/** The queries a level's page runs (`catalogEntity`'s wrappers). */
export interface CatalogQueries<T, ListParams, CreateInput, UpdateData> {
  list: (params: Accessor<ListParams | undefined>) => CreateQueryResult<PaginatedResponse<T>, Error>;
  create: () => CreateMutationResult<T, Error, CreateInput>;
  update: () => CreateMutationResult<T, Error, { id: string; data: UpdateData }>;
  remove: () => CreateMutationResult<{ deleted: boolean }, Error, string>;
}

/** A table column between "Team" and "Description". */
export interface CatalogColumn<T, P> {
  head: string;
  /** The header cell's classes (its responsive visibility). */
  headClass: string;
  /** The body cells' classes. */
  cellClass: string;
  /** The cell's text, given the parent level's records. */
  text: (item: T, parents: readonly P[]) => string;
}

/** A level's parent: the list's filter, the dialog's select, and its records. */
export interface CatalogParent<P> {
  /** The URL parameter the filter keeps its value in (`experience_id`, …). */
  param: string;
  /** The parent level's list, read whole (200 records) for the filter and the dialog. */
  list: (params: Accessor<{ limit: number }>) => CreateQueryResult<PaginatedResponse<P>, Error>;
  options: (items: readonly P[]) => CatalogOption[];
  filter: { allLabel: string; ariaLabel: string; class?: string };
  /** The dialog's parent select. */
  field: { field: string; label: string; idSuffix: string };
}

/**
 * A level's words, each a whole message in the active locale. Never built by
 * joining a noun into a phrase ("New " + "Application"): the phrase's grammar
 * depends on the noun's gender in most of the console's languages.
 */
export interface CatalogText {
  /** The page heading, e.g. "Applications". */
  title: string;
  /** "New Application": the header button, the empty state's and the create dialog's title. */
  create: string;
  /** "Edit Application": the edit dialog's title. */
  edit: string;
  /** "Delete Application": the delete confirmation's title. */
  delete: string;
  created: string;
  updated: string;
  deleted: string;
  /** "Edit application", "Delete application": the row buttons' accessible names. */
  editAria: string;
  deleteAria: string;
  /** "No applications yet". */
  empty: string;
  emptyDescription: string;
  /** "Showing {shown} of {total} applications", given the formatted counts. */
  showing: (counts: { shown: string; total: string }) => string;
}

export interface CatalogListConfig<T extends CatalogRecord, F, ListParams, CreateInput, UpdateData, P> {
  /** Built when the page's component is, so after the locale is resolved. */
  text: CatalogText;
  icon: Component;
  queries: CatalogQueries<T, ListParams, CreateInput, UpdateData>;
  /** What the list asks for, given its paging and the parent filter's value. */
  listParams: (paging: { limit: number; offset: number }, parentId: string | undefined) => ListParams;
  parent?: CatalogParent<P>;
  columns: readonly CatalogColumn<T, P>[];
  /** The description column's classes: experiences show it from `md`, the others from `lg`. */
  description: { headClass: string; cellClass: string };
  form: {
    /** The dialog's ids' prefix: "exp", "app", "page", "comp". */
    idPrefix: string;
    schema: z.ZodType<F>;
    initial: (editing: T | null) => FormValues;
    createInput: (values: F) => CreateInput;
    updateInput: (id: string, values: F) => { id: string; data: UpdateData };
    namePlaceholder: string;
    /** The extra text field (platform, path, component type). */
    extra?: { field: string; label: string; idSuffix: string; placeholder: string };
  };
}
