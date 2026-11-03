// The console's queries, one module per domain. Each exports its key factory
// (the same keys as the React console), option factories (plain functions
// returning query or mutation options) and the `create…` wrappers components
// call during init.
export * from "./catalog.js";
export * from "./customers.js";
export * from "./dashboard.js";
export * from "./feedback.js";
export * from "./me.js";
export * from "./session.js";
export * from "./surveys.js";
export * from "./tickets.js";
