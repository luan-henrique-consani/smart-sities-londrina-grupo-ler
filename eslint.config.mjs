import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Python (backend) e ambientes locais:
    ".venv/**",
    ".vercel/**",
    // Material de apresentação (pitch) e scripts descartáveis: não fazem parte do produto.
    "work/**",
    "output/**",
    "prevora-pitch/**",
  ]),
]);

export default eslintConfig;
