/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Russo One"', '"Arial Black"', 'sans-serif'],
        body: ['"Chakra Petch"', 'system-ui', 'sans-serif'],
      },
      colors: {
        madera: {
          950: '#17100B',
          900: '#201410',
          800: '#241610',
          700: '#2B1B12',
          600: '#3A2415',
        },
        ambar: {
          DEFAULT: '#F5A524',
          brillo: '#FFC53D',
          suave: '#FBD38D',
        },
        crema: '#F5E9D5',
        piedra: '#A89880',
      },
      boxShadow: {
        brasa: '0 0 24px rgba(245,165,36,0.35)',
        carta: 'inset 0 1px 0 rgba(255,197,61,0.15), 0 2px 6px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
