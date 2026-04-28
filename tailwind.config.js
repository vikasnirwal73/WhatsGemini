/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // App Theme Colors
        primary: {
          DEFAULT: '#6366F1', // Indigo 500
          hover: '#4F46E5',   // Indigo 600
          dark: '#818CF8',    // Indigo 400
        },
        
        // Backgrounds
        app: {
          light: '#F8FAFC', // Slate 50
          dark: '#0F172A',  // Slate 900
        },
        panel: {
          light: '#FFFFFF',
          dark: '#1E293B', // Slate 800
        },

        // Chat Bubbles
        bubble: {
          sent: {
            light: '#6366F1', // Indigo 500
            dark: '#4F46E5',  // Indigo 600
          },
          received: {
            light: '#F1F5F9', // Slate 100
            dark: '#334155',  // Slate 700
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
