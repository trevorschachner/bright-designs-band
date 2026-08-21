import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
})

const eslintConfig = [
  {
    ignores: [
      ".next/*",
      "node_modules/*",
      "public/*",
      "email-previews/*"
    ]
  },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      // A component defined inside another component's render body gets a new
      // function identity every render, so React treats it as a different type,
      // unmounts the old subtree and mounts a fresh one. Any focused input
      // inside it is destroyed mid-keystroke. That is what FilterSidebar's
      // SidebarContent did to the shows search box.
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
    },
  },
]

export default eslintConfig
