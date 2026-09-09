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
        // Now using CSS variables from src/styles/tokens.css for easy extraction/tweaking.
        // primary/secondary/accent resolve through the shadcn-canonical bridge variables
        // (--primary etc., see tokens.css) rather than --color-* directly, so they stay
        // theme-reactive if/when a [data-theme="x"] switcher is added later - today they
        // resolve to the exact same values as before, zero visual change.
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
          hover: 'rgb(var(--color-primary-hover) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
          hover: 'rgb(var(--color-secondary-hover) / <alpha-value>)',
        },
        // Note: this app's own --color-accent has historically meant "same brand
        // color as primary" (see tokens.css), which collides with shadcn/ui's meaning
        // of "accent" (a neutral hover/highlight surface). Since no existing class in
        // this codebase uses bg-accent/text-accent (verified via grep - accent-2 is
        // only referenced directly by the gemini-gradient), it's safe to point the
        // `accent` key at the shadcn-meaning bridge variable instead; the raw brand
        // color is still available via --color-accent directly (see gemini-gradient
        // in backgroundImage below) for anything that wants it.
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
          2: 'rgb(var(--color-accent-2) / <alpha-value>)',
        },
        onAccent: 'rgb(var(--color-on-accent) / <alpha-value>)',
        onSecondary: 'rgb(var(--color-on-secondary) / <alpha-value>)',

        // shadcn/ui canonical keys with no pre-existing app equivalent
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',

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
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backgroundImage: {
        'gemini-gradient': 'linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
        'gemini-logo': 'linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-accent-2)))',
        'sparkle-gradient': 'linear-gradient(135deg, #e2e8f0 0%, #ffffff 100%)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
