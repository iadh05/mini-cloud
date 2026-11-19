// @ts-check
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/node_modules/", "**/dist/", "var/", "coverage/"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  // Code smells, bugs and complexity (SonarJS rules)
  sonarjs.configs.recommended,
  {
    rules: {
      // A function a reader can hold in their head: max cognitive complexity 15
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/cyclomatic-complexity": ["error", { threshold: 10 }],
      "sonarjs/no-duplicate-string": ["error", { threshold: 3 }],
      "sonarjs/no-identical-functions": "error",
      "sonarjs/todo-tag": "warn",
    },
  },
  {
    // Tests repeat literals on purpose
    files: ["**/*.test.ts"],
    rules: { "sonarjs/no-duplicate-string": "off" },
  },
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    files: ["**/*.js", "**/*.cjs"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["**/*.cjs"],
    languageOptions: { sourceType: "commonjs", globals: { ...globals.node } },
  },
  prettier,
);
