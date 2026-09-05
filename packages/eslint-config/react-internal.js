import pluginReact from "eslint-plugin-react"
import pluginReactHooks from "eslint-plugin-react-hooks"
import globals from "globals"

import { config as baseConfig } from "./base.js"

/**
 * ESLint configuration for React libraries that are consumed by an app.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...baseConfig,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: { ...globals.serviceworker, ...globals.browser },
    },
    settings: { react: { version: "detect" } },
    plugins: { "react-hooks": pluginReactHooks },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
  },
]

export default config
