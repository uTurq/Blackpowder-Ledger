import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: ["pwa/service-worker.js"],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.serviceworker, __PRECACHE_URLS__: "readonly" } },
  },
  {
    files: ["pwa/vite-plugin.ts", "vite.config.ts"],
    languageOptions: { globals: globals.node },
  },
);
