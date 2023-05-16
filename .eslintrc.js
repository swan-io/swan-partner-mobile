"use strict";

const path = require("pathe");

module.exports = {
  plugins: ["@typescript-eslint"],

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
  ],

  rules: {
    curly: "error",

    "no-implicit-coercion": "error",
    "no-param-reassign": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-const": "error",
    "no-extra-boolean-cast": "off",

    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", ignoreRestSiblings: true },
    ],

    "@typescript-eslint/ban-ts-comment": ["error", { "ts-check": true, "ts-expect-error": false }],
    "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    "@typescript-eslint/no-base-to-string": "error",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-unnecessary-qualifier": "error",
    "@typescript-eslint/no-unnecessary-type-arguments": "error",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/strict-boolean-expressions": "error",
    "@typescript-eslint/unbound-method": "off",
  },

  overrides: [
    {
      files: ["src/**/*.{ts,tsx}"],
      plugins: ["react", "react-hooks", "react-native"],

      globals: {
        __DEV__: true,
      },

      parserOptions: {
        project: path.resolve(__dirname + "/tsconfig.json"),
      },

      rules: {
        "react/jsx-boolean-value": ["error", "always"],

        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",

        // https://github.com/intellicode/eslint-plugin-react-native
        "react-native/no-color-literals": "error",
        "react-native/no-inline-styles": "error",
        "react-native/no-single-element-style-arrays": "error",
        "react-native/no-unused-styles": "error",
      },
    },
    {
      files: ["server/src/**/*.{ts,tsx}"],

      parserOptions: {
        project: path.resolve(__dirname + "/server/tsconfig.json"),
      },
    },
  ],
};
