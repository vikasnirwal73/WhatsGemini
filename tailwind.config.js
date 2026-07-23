/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Now using CSS variables from index.css for easy extraction/tweaking
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary) / <alpha-value>)',
          hover: 'rgb(var(--color-secondary-hover) / <alpha-value>)',
        },
        accent: 'rgb(var(--color-accent) / <alpha-value>)',

        // Backgrounds
        app: {
          light: 'rgb(var(--color-app-bg) / <alpha-value>)', // dynamically mapped, light/dark suffixes kept for backwards compat but not strictly needed
          dark: 'rgb(var(--color-app-bg) / <alpha-value>)',
        },
        panel: {
          light: 'rgb(var(--color-panel-bg) / <alpha-value>)',
          dark: 'rgb(var(--color-panel-bg) / <alpha-value>)',
        },
        panel2: 'rgb(var(--color-panel2-bg) / <alpha-value>)',

        // Chat Bubbles
        bubble: {
          sent: {
            light: 'rgb(var(--color-bubble-sent) / <alpha-value>)',
            dark: 'rgb(var(--color-bubble-sent) / <alpha-value>)',
          },
          received: {
            light: 'rgb(var(--color-bubble-received) / <alpha-value>)',
            dark: 'rgb(var(--color-bubble-received) / <alpha-value>)',
          },
        },
      },
      borderRadius: {
        'bubble': '1.5rem',
      },
      backgroundImage: {
        'gemini-gradient': 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
        'gemini-logo': 'radial-gradient(circle at top left, #a78bfa, #f472b6, #fb923c, #38bdf8)',
        'sparkle-gradient': 'linear-gradient(135deg, #e2e8f0 0%, #ffffff 100%)',
      }
    },
  },
  plugins: [],
};
