// This is a base config for all subrepositories
module.exports = {
    $schema: "https://json.schemastore.org/eslintrc",
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: ["eslint:recommended", "prettier"],
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    plugins: [],
    rules: {
        "linebreak-style": ["error", "unix"],
    },
};
