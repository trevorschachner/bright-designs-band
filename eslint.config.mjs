import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  {
    ignores: [
      ".next/*",
      "node_modules/*",
      "public/*",
      "email-previews/*"
    ]
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // A component defined inside another component's render body gets a new
      // function identity every render, so React treats it as a different type,
      // unmounts the old subtree and mounts a fresh one. Any focused input
      // inside it is destroyed mid-keystroke. That is what FilterSidebar's
      // SidebarContent did to the shows search box.
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
      // eslint-plugin-react-hooks 7 (via eslint-config-next 16) adds React
      // Compiler rules. Existing code trips them in ~20 places; fixing those
      // changes runtime behaviour, so they are off until a dedicated pass.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  },
]

export default eslintConfig
