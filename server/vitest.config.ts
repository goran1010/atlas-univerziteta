import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "./__tests__/**",
        "vitest.config.ts",
        "node_modules/**",
        "generated/**",
      ],
    },
    projects: [
      {
        test: {
          name: "unit",
          include: ["__tests__/unit/**/*.test.ts"],
          setupFiles: ["./__tests__/setup/mocks.setup.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["__tests__/integration/**/*.test.ts"],
          globalSetup: "./__tests__/setup/globalSetup.ts",
          setupFiles: [
            "./__tests__/setup/mocks.setup.ts",
            "./__tests__/setup/db.setup.ts",
          ],
        },
      },
    ],
  },
});
