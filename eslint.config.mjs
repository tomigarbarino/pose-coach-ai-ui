import next from "eslint-config-next";

const config = [
  {
    ignores: ["node_modules/**", ".next/**", "coverage/**"],
  },
  ...next,
];

export default config;


