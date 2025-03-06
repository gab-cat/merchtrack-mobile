/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./app/**/*.{html,css}", "./components/**/*.{js,jsx,ts,tsx}", "./components/**/*.{html,css}"],
  // eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}

