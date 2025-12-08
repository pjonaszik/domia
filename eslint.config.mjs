import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "no-unused-vars": "off", // Turn off base rule
      "@typescript-eslint/no-unused-vars": "off", // Turn off TypeScript rule
      "unused-imports/no-unused-imports": "error", // Error on unused imports - will auto-fix
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      // Relax some rules for content pages
      "react/no-unescaped-entities": "warn", // Warn instead of error for content
      "@typescript-eslint/no-explicit-any": "warn", // Warn instead of error
      "react-hooks/exhaustive-deps": "warn", // Warn instead of error
    },
  },
  // Relax rules for content pages
  {
    files: ["app/**/page.tsx", "app/**/page.ts"],
    rules: {
      "react/no-unescaped-entities": "off", // Disable for content pages
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
