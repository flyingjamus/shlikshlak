module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  //
  extends: [
    // 'plugin:sonarjs/recommended',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  // env: {
  //   node: true,
  //   es2021: true,
  //   browser: true,
  // },
  // settings: {
  //   'import/parsers': {
  //     '@typescript-eslint/parser': ['.ts', '.tsx'],
  //   },
  //   react: {
  //     version: 'detect',
  //   },
  // },
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'no-undef': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-empty-pattern': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'sonarjs/cognitive-complexity': 'off',
    'sonarjs/no-duplicate-string': 'off',
    '@typescript-eslint/no-unnecessary-type-constraint': 'off',
    '@typescript-eslint/ban-types': 'off',
    'react/jsx-no-undef': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
  },

  ignorePatterns: ['src/**/*.js', 'src/lib/**/*', 'src/Components/ReactDevtools'],
}
