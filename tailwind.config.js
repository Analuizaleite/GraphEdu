/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ponto: {
          dark: '#05272d',    // Fundo principal / Barra Lateral
          darker: '#05262f',  // Splash Screen / Cabeçalho
          accent: '#3aebb9',  // Verde Água Brilhante (Botões primários, Vértices)
          muted: '#2c6455'    // Verde Escuro Mudo (Arestas, botões secundários)
        }
      }
    },
  },
  plugins: [],
}