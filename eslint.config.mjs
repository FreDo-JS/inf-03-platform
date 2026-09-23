import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "public/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "react/no-danger": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  // skrypty budowania działają w terminalu — tam console.log jest na miejscu
  { files: ["scripts/**/*.mjs"], rules: { "no-console": "off" } },
];

export default config;
