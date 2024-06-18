import presetQuick from "franken-ui/shadcn-ui/preset-quick";

export default {
  content: ["./**/templates/**/*.html"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
  presets: [presetQuick({ theme: "green" })],
};
