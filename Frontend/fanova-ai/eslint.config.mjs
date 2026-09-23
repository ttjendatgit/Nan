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
    // Reference material only (e.g. reference/nan-landing.js) -- not code that ever runs, so it
    // gets no lint pass.
    "reference/**",
  ]),
  {
    // react-hooks/set-state-in-effect and react-hooks/refs are new rules from an
    // eslint-plugin-react-hooks upgrade, applied retroactively against code written before either
    // rule existed. The remaining violations are almost all the same well-understood pattern --
    // an effect reading sessionStorage/localStorage on mount, or kicking off a client-side data
    // fetch keyed on a dependency change -- being addressed gradually rather than rewritten in one
    // pass. Downgraded to "warn" (not disabled) so they stay visible instead of silently
    // accumulating.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
]);

export default eslintConfig;
