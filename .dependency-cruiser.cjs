/** Architecture rules. Run with `npm run lint:deps`. */
const ATOMIC = "apps/dashboard/src/ui";

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
    {
      name: "not-to-unresolvable",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "no-dev-deps-in-src",
      comment: "App and package source must not import devDependencies.",
      severity: "error",
      from: { path: "^(apps|packages)/[^/]+/src/", pathNot: "\\.(test|spec)\\.tsx?$" },
      to: { dependencyTypes: ["npm-dev"] },
    },

    // Workspace boundaries
    {
      name: "apps-are-independent",
      comment: "An app never imports another app. Share code through packages/.",
      severity: "error",
      from: { path: "^apps/([^/]+)/" },
      to: { path: "^apps/([^/]+)/", pathNot: "^apps/$1/" },
    },
    {
      name: "packages-never-import-apps",
      severity: "error",
      from: { path: "^packages/" },
      to: { path: "^apps/" },
    },
    {
      name: "shared-is-a-leaf",
      comment: "packages/shared depends on no other workspace package.",
      severity: "error",
      from: { path: "^packages/shared/" },
      to: { path: "^packages/", pathNot: "^packages/shared/" },
    },
    {
      name: "dashboard-never-touches-the-database",
      comment: "The console talks to the API only.",
      severity: "error",
      from: { path: "^apps/dashboard/" },
      to: { path: "^packages/db/" },
    },

    // Console: features stay apart
    {
      name: "features-are-independent",
      severity: "error",
      from: { path: "^apps/dashboard/src/features/([^/]+)/" },
      to: {
        path: "^apps/dashboard/src/features/([^/]+)/",
        pathNot: "^apps/dashboard/src/features/$1/",
      },
    },

    // Console: atomic design, imports only go down the levels
    {
      name: "ui-is-feature-agnostic",
      comment: "The design system (ui/) never imports features, pages or the API layer.",
      severity: "error",
      from: { path: `^${ATOMIC}/` },
      to: { path: "^apps/dashboard/src/(features|pages|api|app)/" },
    },
    {
      name: "tokens-are-a-leaf",
      severity: "error",
      from: { path: `^${ATOMIC}/tokens/` },
      to: { path: `^${ATOMIC}/(atoms|molecules|organisms|templates)/` },
    },
    {
      name: "atoms-use-only-tokens",
      severity: "error",
      from: { path: `^${ATOMIC}/atoms/` },
      to: { path: `^${ATOMIC}/(molecules|organisms|templates)/` },
    },
    {
      name: "molecules-use-atoms",
      severity: "error",
      from: { path: `^${ATOMIC}/molecules/` },
      to: { path: `^${ATOMIC}/(organisms|templates)/` },
    },
    {
      name: "organisms-use-molecules-and-atoms",
      severity: "error",
      from: { path: `^${ATOMIC}/organisms/` },
      to: { path: `^${ATOMIC}/templates/` },
    },
    {
      name: "pages-go-through-templates",
      comment: "Feature pages compose templates and organisms, never raw atoms layout.",
      severity: "warn",
      from: { path: "^apps/dashboard/src/features/[^/]+/pages/" },
      to: { path: `^${ATOMIC}/atoms/` },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)(node_modules|dist|coverage)/" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.base.json" },
    combinedDependencies: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".js", ".cjs", ".mjs", ".json"],
      mainFields: ["module", "main", "types"],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
