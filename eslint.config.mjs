import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Le motif « fermer la modale + rafraîchir après une action serveur »
      // (useActionState puis synchronisation dans un effet) est un cas d'usage
      // légitime ici ; la règle du React Compiler est volontairement désactivée.
      "react-hooks/set-state-in-effect": "off",
      // L'application est intégralement en français : les apostrophes dans le
      // texte JSX sont omniprésentes et échapper chacune nuirait à la lisibilité.
      "react/no-unescaped-entities": "off",
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
