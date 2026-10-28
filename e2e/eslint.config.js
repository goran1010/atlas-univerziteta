import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";
import globals from "globals";
import playwright from "eslint-plugin-playwright";

export default defineConfig([
  globalIgnores(["node_modules/", "test-results/", "playwright-report/"]),

  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      "no-console": ["warn", { allow: ["error", "warn"] }],
      // destructuring to omit a property is deliberate
      "@typescript-eslint/no-unused-vars": [
        "error",
        { ignoreRestSiblings: true },
      ],
    },
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ["tests/**/*.spec.ts"],
    extends: [playwright.configs["flat/recommended"]],
  },
]);
