import eslintTs from 'super-configs/eslint/ts';
import eslintJest from 'super-configs/eslint/jest';

export default [
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**'],
  },
  ...eslintTs,
  ...eslintJest,
];
