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
      tseslint.configs.strict,
      tseslint.configs.stylistic,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        project: ["./tsconfig.json"],
      },
    },
  },

  {
    files: ["tests/**/*.spec.ts"],
    extends: [playwright.configs["flat/recommended"]],
  },
]);
