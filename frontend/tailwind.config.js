/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // This ensures Tailwind scans your specific folder structure
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // The code uses specific font families, you can extend them here if you add custom fonts
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      // You can also extend colors if you want to customize the 'indigo' or 'slate' shades used
    },
  },
  plugins: [
    // The code uses some form elements, so this plugin is often helpful, though not strictly required for the provided code
    // require('@tailwindcss/forms'), 
    require("tailwindcss-animate"), // Used for the 'animate-in' classes seen in BookingHero
  ],
};