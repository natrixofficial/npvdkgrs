// eslint-disable-next-line no-undef
module.exports = {
	env: {
		node: true,
		jest: true,
	},
	parser: "@typescript-eslint/parser",
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: "module",
		ecmaFeatures: {
			impliedStrict: true,
			experimentalObjectRestSpread: true,
		},
	},
	rules: {
		"max-len": ["error", { code: 140, tabWidth: 2 }],
		"semi": ["error", "always"],
		"quotes": ["error", "double"],
		"no-var": "error",
	},
	overrides: [
		{
			// enable the rule specifically for TypeScript files
			files: ["*.ts", "*.tsx"],
			rules: {
				"@typescript-eslint/explicit-module-boundary-types": ["error"],
				"@typescript-eslint/explicit-function-return-type": ["error"],
				"@typescript-eslint/no-explicit-any": "warn",
				"@typescript-eslint/no-inferrable-types": ["warn", { ignoreParameters: true }],
				"@typescript-eslint/no-unused-vars": "warn",
				"@typescript-eslint/lines-between-class-members": ["error", "always"],
			},
		},
	],
};
