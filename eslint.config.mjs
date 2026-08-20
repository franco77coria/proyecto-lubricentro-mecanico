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
    // Script suelto en la raíz que no forma parte de la app.
    "kimi-proxy.js",
    // Lo genera `supabase gen types`: cualquier arreglo a mano se pierde en la
    // próxima regeneración, y los `any` que trae son de la plantilla del CLI.
    "lib/supabase/database.types.ts",
  ]),
  {
    // Los scripts de verificación usan `condición ? ok(...) : fail(...)` como
    // aserción, que es exactamente lo que esta regla estilística marca. Es un
    // patrón de test, no un descuido, y solo aplica acá.
    files: ["scripts/**/*.mjs"],
    rules: { "@typescript-eslint/no-unused-expressions": "off" },
  },
]);

export default eslintConfig;
