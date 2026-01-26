import eslintReact from "@eslint-react/eslint-plugin";
import eslintJs from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  //
  // Global boundaries setup
  //
  {
    plugins: { boundaries },
    languageOptions: {
      parser: tseslint.parser,
    },
    extends: [eslintJs.configs.recommended, tseslint.configs.recommended],
    settings: {
      "boundaries/elements": [
        { type: "db", pattern: "db/**" },
        { type: "scripts", pattern: "scripts/**" },
        { type: "src", pattern: "src/**" },
      ],
    },
  },

  //
  // SRC: TS + React
  //
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    extends: [eslintReact.configs["recommended-typescript"]],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@eslint-react/no-missing-key": "warn",
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [{ from: "src", allow: ["src", "db"] }],
        },
      ],
    },
  },

  //
  // SCRIPTS: boundaries only
  //
  {
    files: ["scripts/**/*.ts"],
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [{ from: "scripts", allow: ["scripts", "db"] }],
        },
      ],
    },
  },

  //
  // DB: leaf module
  //
  {
    files: ["db/**/*.ts"],
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [{ from: "db", allow: ["db"] }],
        },
      ],
    },
  },
]);
