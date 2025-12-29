/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx,js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: 'rgb(1,1,1)',
        foreground: 'rgb(229,229,231)',
        muted: 'rgb(18,18,18)',
        'muted-foreground': 'rgb(160,160,166)',
        border: 'rgb(39,39,41)',
      },
    },
  },
  plugins: [],
}