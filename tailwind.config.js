import autoprefixer from "autoprefixer";
import presetQuick from "franken-ui/shadcn-ui/preset-quick";

export default {
  content: [
    "**/templates/**/*.html",
    "**/forms.py",
    "**/js/*.{js,ts}",
    "*.css",
  ],
  theme: {
    fontFamily: {
      sans: ["Ubuntu", "Quicksand"],
      mono: ['"Fira Code"'],
    },
    extend: {
      typography: {
        DEFAULT: {
          css: {
            code: {
              backgroundColor: "#f4f4f4",
              color: "#c7254e",
              "font-variant-ligatures": "none",
            },
            "code::before": { content: "" },
            "code::after": { content: "" },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")(), autoprefixer],
  presets: [presetQuick({ theme: "green" })],
};
