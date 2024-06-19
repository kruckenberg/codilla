import autoprefixer from "autoprefixer";
import presetQuick from "franken-ui/shadcn-ui/preset-quick";

export default {
  content: ["**/templates/**/*.{html,js}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), autoprefixer],
  presets: [presetQuick({ theme: "green" })],
};
