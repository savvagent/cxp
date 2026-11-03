<script lang="ts">
  // The surveys list's "New Survey" dialog: the same fields, zod validation (on
  // submit, then on every edit), payload and toasts as the React console's. As with react-hook-form,
  // the values survive closing the dialog and are cleared only by a create.
  import { toast } from "svelte-sonner";
  import { Button } from "#lib/components/ui/button/index.js";
  import * as Dialog from "#lib/components/ui/dialog/index.js";
  import { Input } from "#lib/components/ui/input/index.js";
  import { Label } from "#lib/components/ui/label/index.js";
  import { Textarea } from "#lib/components/ui/textarea/index.js";
  import { validate } from "#lib/forms.js";
  import { createCreateSurvey } from "#lib/queries/index.js";
  import {
    QUESTIONS_PLACEHOLDER,
    createSurveySchema,
    emptyCreateSurveyForm,
    toCreateSurveyInput,
  } from "./surveys.js";

  let { open = $bindable(false) }: { open?: boolean } = $props();

  const createSurvey = createCreateSurvey();

  let form = $state(emptyCreateSurveyForm());
  // Errors show once a submit has been tried, then follow every edit.
  let attempted = $state(false);

  const validation = $derived(validate(createSurveySchema, form));
  const errors = $derived(attempted && !validation.ok ? validation.errors : {});

  async function onsubmit(event: SubmitEvent) {
    event.preventDefault();
    attempted = true;
    if (!validation.ok) return;
    const built = toCreateSurveyInput(validation.data);
    if (!built.ok) {
      toast.error(built.message);
      return;
    }
    try {
      await createSurvey.mutateAsync(built.input);
    } catch (err) {
      toast.error(`Failed to create survey: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    toast.success("Survey created");
    form = emptyCreateSurveyForm();
    attempted = false;
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>New Survey</Dialog.Title>
    </Dialog.Header>

    <form {onsubmit} class="space-y-4" novalidate>
      <div class="space-y-1.5">
        <Label for="survey-title">Title <span class="text-destructive">*</span></Label>
        <Input
          id="survey-title"
          placeholder="Customer Satisfaction Survey"
          bind:value={form.title}
          aria-invalid={!!errors.title}
        />
        {#if errors.title}
          <p class="text-xs text-destructive">{errors.title}</p>
        {/if}
      </div>

      <div class="space-y-1.5">
        <Label for="survey-description">Description</Label>
        <Textarea
          id="survey-description"
          placeholder="Optional description..."
          rows={3}
          bind:value={form.description}
        />
      </div>

      <div class="space-y-1.5">
        <Label for="survey-questions">Questions (JSON)</Label>
        <Textarea
          id="survey-questions"
          placeholder={QUESTIONS_PLACEHOLDER}
          rows={4}
          class="font-mono text-xs"
          bind:value={form.questionsRaw}
        />
        <p class="text-xs text-muted-foreground">Optional. Paste a JSON array of question objects.</p>
      </div>

      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
        <Button type="submit" disabled={createSurvey.isPending}>
          {createSurvey.isPending ? "Creating..." : "Create Survey"}
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>
