/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        sengageGreen: 'var(--color-primary)',
        sengageOrange: 'var(--color-secondary)',
        sengageRed: 'var(--color-danger)',
        sengageText: 'var(--color-text)',
        sengageSubText: 'var(--color-subtext)',
        
        navBg: 'var(--color-nav-bg)',
        navText: 'var(--color-nav-text)',
        navTextHover: 'var(--color-nav-text-hover)',
        navActiveBg: 'var(--color-nav-active-bg)',
        navActiveText: 'var(--color-nav-active-text)',

        // Explicit Mixx colors kept for backward compatibility if used directly
        mixxBlue: '#002e6d',
        mixxYellow: '#ffcc00',
        mixxLightBlue: '#eef2f9',
        mixxGray: '#f4f6f9',
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
