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
        // of "accent" (a neutral hover/highlight surface, bridged from --color-panel3-bg).
        // bg-accent below is that shadcn meaning (former bg-panel3 usages, renamed in the
        // Phase 7 token rename); the raw brand color is still available via --color-accent
        // directly (see gemini-gradient in backgroundImage below) for anything that wants it.
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

        // Text tier with no shadcn-canonical equivalent (shadcn only has
        // foreground/muted-foreground - this app has a third, fainter tier).
        // text-ink/text-ink-muted were renamed to text-foreground/
        // text-muted-foreground; text-ink-faint has no bridge counterpart.
        ink: {
          faint: 'rgb(var(--color-text-faint) / <alpha-value>)',
        },
        // Hover surface distinct from --accent (shadcn's hover/highlight
        // meaning) - no bridge counterpart, kept as its own token.
        hover: 'rgb(var(--color-hover-bg) / <alpha-value>)',

        // Chat area background, distinct from --background - no bridge
        // counterpart, kept as its own token.
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
