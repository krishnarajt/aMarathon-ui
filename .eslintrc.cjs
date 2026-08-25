module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.3' } },
  plugins: ['react-refresh'],
  rules: {
    // Providers live next to the hook that reads them and charts next to the
    // helper that shapes their data. That costs fast refresh on those files and
    // keeps related code in one place, which is the better trade here.
    'react-refresh/only-export-components': 'off',
    'react/prop-types': 'off',
  },
  overrides: [
    {
      files: ['vite.config.js', '*.cjs'],
      env: { node: true },
    },
  ],
};
