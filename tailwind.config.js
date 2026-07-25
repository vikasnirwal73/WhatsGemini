/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
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
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          2: 'rgb(var(--color-accent-2) / <alpha-value>)',
        },
        onAccent: 'rgb(var(--color-on-accent) / <alpha-value>)',

        // Text
        ink: {
          DEFAULT: 'rgb(var(--color-text-main) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          faint: 'rgb(var(--color-text-faint) / <alpha-value>)',
        },
        // Borders
        line: 'rgb(var(--color-border-main) / <alpha-value>)',
        hover: 'rgb(var(--color-hover-bg) / <alpha-value>)',

        // Backgrounds
        app: {
          DEFAULT: 'rgb(var(--color-app-bg) / <alpha-value>)',
          light: 'rgb(var(--color-app-bg) / <alpha-value>)', // dynamically mapped, light/dark suffixes kept for backwards compat but not strictly needed
          dark: 'rgb(var(--color-app-bg) / <alpha-value>)',
        },
        panel: {
          DEFAULT: 'rgb(var(--color-panel-bg) / <alpha-value>)',
          light: 'rgb(var(--color-panel-bg) / <alpha-value>)',
          dark: 'rgb(var(--color-panel-bg) / <alpha-value>)',
        },
        panel2: 'rgb(var(--color-panel2-bg) / <alpha-value>)',
        panel3: 'rgb(var(--color-panel3-bg) / <alpha-value>)',
        chat: 'rgb(var(--color-chat-bg) / <alpha-value>)',

        // Chat Bubbles
        bubble: {
          sent: 'rgb(var(--color-bubble-sent-bg) / <alpha-value>)',
          sentFg: 'rgb(var(--color-bubble-sent-text) / <alpha-value>)',
          received: 'rgb(var(--color-bubble-received-bg) / <alpha-value>)',
          receivedFg: 'rgb(var(--color-bubble-received-text) / <alpha-value>)',
        },
      },
      borderRadius: {
        'bubble': '1.5rem',
      },
      backgroundImage: {
        'gemini-gradient': 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
        'gemini-logo': 'linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-accent-2)))',
        'sparkle-gradient': 'linear-gradient(135deg, #e2e8f0 0%, #ffffff 100%)',
      }
    },
  },
  plugins: [],
};
