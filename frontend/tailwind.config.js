/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class', '.dark-mode'], // Using dark mode class, as in landing.css body.dark-mode (we need to map this)
    theme: {
        extend: {},
    },
    plugins: [],
}
