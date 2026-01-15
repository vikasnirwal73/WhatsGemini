/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // App Theme Colors
        primary: {
          DEFAULT: '#4F46E5', // Indigo 600
          hover: '#4338CA',   // Indigo 700
          dark: '#6366F1',    // Indigo 500 (brighter for dark mode)
        },
        
        // Backgrounds
        app: {
          light: '#F3F4F6', // Gray 100
          dark: '#111827',  // Gray 900
        },
        panel: {
          light: '#FFFFFF',
          dark: '#1F2937', // Gray 800
        },

        // Chat Bubbles
        bubble: {
          sent: {
            light: '#4F46E5', // Indigo 600
            dark: '#6366F1',  // Indigo 500
          },
          received: {
            light: '#E5E7EB', // Gray 200
            dark: '#374151',  // Gray 700
          },
        },
      },
      borderRadius: {
        'bubble': '1.5rem', // Extra rounded for pill shape
      }
    },
  },
  plugins: [],
};
