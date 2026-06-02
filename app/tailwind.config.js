/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b1326',       // Fond noir bleuté très sombre
        surface: '#171f33',          // Surface (cartes gris anthracite)
        sengageGreen: '#22c55e',     // Vert principal
        sengageOrange: '#f97316',    // Orange secondaire
        sengageRed: '#ef4444',       // Rouge alertes doux
        sengageText: '#dae2fd',      // Texte blanc cassé
        sengageSubText: '#bccbb9',   // Texte secondaire gris clair
      },
      fontFamily: {
        sans: ['Hanken Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sengage-sm': '4px',
        'sengage-md': '8px',
        'sengage-lg': '16px',
      }
    },
  },
  plugins: [],
}
