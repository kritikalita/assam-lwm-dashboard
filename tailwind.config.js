/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bongaigaon: '#4a7c59',
        tezpur: '#3b82c4',
        nagaon: '#d97706',
        sivasagar: '#7c3aed',
        dibrugarh: '#ec4899',
        silchar: '#ca8a04',
        haflong: '#0d9488',
      }
    },
  },
  plugins: [],
}
