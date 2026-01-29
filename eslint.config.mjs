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
]

export default eslintConfig
