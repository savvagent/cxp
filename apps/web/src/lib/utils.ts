// `cn` and the prop helpers shadcn-svelte components import from `$lib/utils`,
// re-exported from the shared shell so there is one definition of each. The
// console's components come from `@savvagent/console-ui/ui/*`; `components.json`
// still points its `utils` alias here for the one local component (`ui/sonner`).
export { cn } from "@savvagent/console-ui";
export type {
  WithElementRef,
  WithoutChild,
  WithoutChildren,
  WithoutChildrenOrChild,
} from "@savvagent/console-ui";
