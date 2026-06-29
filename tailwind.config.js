/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*/{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  safelist: [
    {
      pattern: /(bg|text|ring|border)-(blue|yellow|purple|green|red|gray)-(50|100|200|300|500|600|700)/,
    },
  ],
  plugins: [],
};
