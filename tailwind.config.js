/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colors backed by CSS variables so they can switch with OS theme
        'app-dark': 'rgb(var(--app-dark) / <alpha-value>)',
        'app-darker': 'rgb(var(--app-darker) / <alpha-value>)',
        'app-panel': 'rgb(var(--app-panel) / <alpha-value>)',
        'app-border': 'rgb(var(--app-border) / <alpha-value>)',
        'app-text': 'rgb(var(--app-text) / <alpha-value>)',
        'app-text-secondary': 'rgb(var(--app-text-secondary) / <alpha-value>)',
        'app-text-muted': 'rgb(var(--app-text-muted) / <alpha-value>)',

        // Static brand/status colors
        'app-blue': '#007acc',
        'app-blue-hover': '#005a9e',
        'app-blue-light': '#4fc3f7',
        'app-success': '#4caf50',
        'app-warning': '#ff9800',
        'app-error': '#f44336',
      },
      fontFamily: {
        'sans': ['Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
      },
      boxShadow: {
        'app': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'app-lg': '0 4px 8px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
}