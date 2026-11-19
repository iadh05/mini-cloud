/** Commit messages: `type(scope): subject (MC-123)`. See CONTRIBUTING.md. */
const TICKET = /\(MC-\d+\)$/;

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "ticket-id": ({ header }) => [
          TICKET.test(header ?? ""),
          "end the header with the ticket id, for example: feat(api): create servers (MC-204)",
        ],
      },
    },
  ],
  rules: {
    "header-max-length": [2, "always", 100],
    "scope-empty": [2, "never"],
    "scope-enum": [
      2,
      "always",
      ["api", "worker", "dashboard", "shared", "db", "infra", "repo", "ci", "deps", "docs"],
    ],
    "subject-case": [0],
    "ticket-id": [2, "always"],
  },
  // Commits created before the rules existed, and automated dependency updates.
  ignores: [
    (message) => message.startsWith("chore(deps)"),
    (message) => message.startsWith("Initial commit"),
    (message) => message.startsWith("docs: add spec, architecture"),
    (message) => message.startsWith("docs: keep specs and tickets out"),
  ],
};
