// The old console's `loading-state.tsx` exported both placeholders from one
// module; Svelte needs a file per component, so this module re-exports them.
export { default as LoadingTable } from "./loading-table.svelte";
export { default as LoadingCards } from "./loading-cards.svelte";
