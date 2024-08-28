module.exports = {
  extends: [
    "@react-native",
    'plugin:@typescript-eslint/recommended',
    "prettier"
  ],
  rules: {
    "no-void": [
      "error", 
      { "allowAsStatement": true }
    ],
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/restrict-template-expressions": ["warn", { 
      allowNumber: true,
      allowBoolean: true,
      allowAny: true,
      allowNullish: true
     }],
     "@typescript-eslint/no-explicit-any": "error",
     "@typescript-eslint/strict-boolean-expressions": "error",
    "prettier/prettier": [
      "error",
      {
        "quoteProps": "consistent",
        "singleQuote": true,
        "tabWidth": 2,
        "trailingComma": "es5",
        "useTabs": false
      }
    ]
  },
  parserOptions: {
    project: ['./tsconfig.linter.json'],
  },
};
