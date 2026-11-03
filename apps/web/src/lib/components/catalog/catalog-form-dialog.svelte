<script lang="ts" generics="T">
  // The create/edit dialog of every catalog level (the React console's
  // ExperienceDialog, ApplicationDialog, PageDialog and ComponentDialog, which
  // differed only in their fields): Team, the parent level, Name, one extra
  // text field, and Description, validated with the level's zod schema.
  import { m } from "#lib/paraglide/messages.js";
  import type { z } from "#lib/zod.js";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Dialog from "#lib/components/ui/dialog/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import * as Select from "#lib/components/ui/select/index.js";
  import { Textarea } from "#lib/components/ui/textarea/index.js";
  import type { MyTeam } from "#lib/types.js";
  import { NONE, fromOptionalSelect, validate, type FieldErrors } from "#lib/forms.js";
  import type { FormValues } from "./forms.js";
  import type { CatalogOption } from "./options.js";

  interface FieldSpec {
    /** The form field (the React form's snake_case name). */
    field: string;
    label: string;
    /** Appended to `idPrefix` for the control's id, e.g. "experience" → "app-experience". */
    idSuffix: string;
  }

  let {
    open,
    onOpenChange,
    title,
    idPrefix,
    schema,
    initial,
    teams,
    parent,
    extra,
    namePlaceholder,
    isEdit,
    pending,
    onSubmit,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    /** The ids' prefix, as the React dialogs used: "exp", "app", "page", "comp". */
    idPrefix: string;
    schema: z.ZodType<T>;
    /** The values the form starts from each time it opens. */
    initial: FormValues;
    teams: readonly MyTeam[];
    /** The optional parent select (none for experiences). */
    parent?: FieldSpec & { options: readonly CatalogOption[] };
    /** The optional extra text field (platform, path, component type). */
    extra?: FieldSpec & { placeholder: string };
    namePlaceholder: string;
    isEdit: boolean;
    pending: boolean;
    /** Called with the validated values. */
    onSubmit: (values: T) => void;
  } = $props();

  let values = $state<FormValues>({});
  let submitted = $state(false);

  // A fresh form each time the dialog opens: the edited record's values, or
  // the empty defaults for a new one.
  $effect(() => {
    if (open) {
      values = { ...initial };
      submitted = false;
    }
  });

  // Like react-hook-form's defaults: no errors until the first submit, then
  // revalidated on every change.
  const errors = $derived.by((): FieldErrors => {
    if (!submitted) return {};
    const result = validate(schema, values);
    return result.ok ? {} : result.errors;
  });

  const teamLabel = $derived.by(() => {
    const id = values.team_id;
    if (!id) return m.catalog_no_team();
    return teams.find((t) => t.id === id)?.name ?? id.slice(0, 8);
  });

  const parentSelected = $derived(
    parent && values[parent.field] ? parent.options.find((o) => o.value === values[parent.field]) : undefined,
  );

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitted = true;
    const result = validate(schema, values);
    if (result.ok) onSubmit(result.data);
  }
</script>

<Dialog.Root bind:open={() => open, (v) => onOpenChange(v)}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>{title}</Dialog.Title>
    </Dialog.Header>
    <form onsubmit={handleSubmit} class="space-y-4" novalidate>
      <div class="space-y-1.5">
        <Label for={`${idPrefix}-team`}>{m.label_team()}</Label>
        <Select.Root
          type="single"
          bind:value={() => values.team_id || NONE, (v) => (values.team_id = fromOptionalSelect(v))}
        >
          <Select.Trigger id={`${idPrefix}-team`} class="w-full">
            <span class="truncate" class:text-muted-foreground={!values.team_id}>{teamLabel}</span>
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={NONE} label={m.catalog_no_team()} />
            {#each teams as t (t.id)}
              <Select.Item value={t.id} label={t.name} />
            {/each}
          </Select.Content>
        </Select.Root>
        {#if errors.team_id}
          <p class="text-xs text-destructive">{errors.team_id}</p>
        {/if}
      </div>

      {#if parent}
        <div class="space-y-1.5">
          <Label for={`${idPrefix}-${parent.idSuffix}`}>{parent.label}</Label>
          <Select.Root
            type="single"
            bind:value={() => values[parent.field] || NONE, (v) => (values[parent.field] = fromOptionalSelect(v))}
          >
            <Select.Trigger id={`${idPrefix}-${parent.idSuffix}`} class="w-full">
              <span class="truncate" class:text-muted-foreground={!values[parent.field]}>
                {#if !values[parent.field]}
                  {m.common_none()}
                {:else if parentSelected}
                  {parentSelected.label}
                  {#if parentSelected.hint}
                    <span class="ml-1 font-mono text-xs text-muted-foreground">{parentSelected.hint}</span>
                  {/if}
                {:else}
                  {values[parent.field].slice(0, 8)}
                {/if}
              </span>
            </Select.Trigger>
            <Select.Content>
              <Select.Item value={NONE} label={m.common_none()} />
              {#each parent.options as o (o.value)}
                <Select.Item value={o.value} label={o.label}>
                  {o.label}
                  {#if o.hint}
                    <span class="ml-1 font-mono text-xs text-muted-foreground">{o.hint}</span>
                  {/if}
                </Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
        </div>
      {/if}

      <div class="space-y-1.5">
        <Label for={`${idPrefix}-name`}>
          {m.label_name()} <span class="text-destructive">*</span>
        </Label>
        <Input
          id={`${idPrefix}-name`}
          placeholder={namePlaceholder}
          bind:value={values.name}
        />
        {#if errors.name}
          <p class="text-xs text-destructive">{errors.name}</p>
        {/if}
      </div>

      {#if extra}
        <div class="space-y-1.5">
          <Label for={`${idPrefix}-${extra.idSuffix}`}>{extra.label}</Label>
          <Input
            id={`${idPrefix}-${extra.idSuffix}`}
            placeholder={extra.placeholder}
            bind:value={values[extra.field]}
          />
        </div>
      {/if}

      <div class="space-y-1.5">
        <Label for={`${idPrefix}-desc`}>{m.label_description()}</Label>
        <Textarea
          id={`${idPrefix}-desc`}
          placeholder={m.common_optional_description()}
          rows={3}
          bind:value={values.description}
        />
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => onOpenChange(false)}>{m.common_cancel()}</Button>
        <Button type="submit" disabled={pending}>
          {pending ? m.common_saving() : isEdit ? m.common_save_changes() : m.common_create()}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
