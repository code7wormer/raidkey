/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // New warm pastel theme tokens
        bg: '#F7F6F2',             // Soft warm oat / alabaster canvas
        'bg-secondary': '#EFECE6',   // Muted cream secondary
        'bg-elevated': '#FFFFFF',    // Crisp card surface
        'bg-sidebar': '#F2EFE9',     // Warm pastel stone sidebar
        'text-primary': '#2D2B28',   // Deep soft slate / espresso text
        'text-secondary': '#68645D', // Warm muted body text
        'text-tertiary': '#9E9990',  // Soft placeholder / stamp text
        'text-inverse': '#FFFFFF',
        'border-default': '#E4E0D7', // Clean warm border
        'border-strong': '#D3CDC0',  // Slightly darker structural divider
        'accent-primary': '#4F46E5', // Soft indigo
        'accent-green': '#15803D',   // Sage forest green
        'accent-red': '#BE123C',     // Muted crimson
        'accent-amber': '#B45309',   // Warm honey amber
        
        // Backward-compatible surface & border mapping for modals & drawers
        surface: '#FFFFFF',
        'surface-elevated': '#F7F6F2',
        'surface-card': '#EFECE6',
        'surface-hover': '#EAE6DE',
        border: '#E4E0D7',
        background: '#F7F6F2',
      },
      fontFamily: {
        sans: ['var(--font-inter)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(45 43 40 / 0.04), 0 1px 2px -1px rgb(45 43 40 / 0.03)',
        'card-hover': '0 4px 12px -2px rgb(45 43 40 / 0.08), 0 2px 4px -2px rgb(45 43 40 / 0.04)',
        'modal': '0 20px 40px -10px rgb(45 43 40 / 0.15)',
      },
    },
  },
  plugins: [],
};
