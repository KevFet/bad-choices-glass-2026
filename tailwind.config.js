/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#030014",
                deep: "#050505",
                liquid: {
                    indigo: "#4F46E5",
                    magenta: "#701A75",
                },
            },
            borderRadius: {
                '3xl': '24px',
                '4xl': '32px',
                '5xl': '40px',
            },
            fontFamily: {
                geist: ["var(--font-geist)", "Inter", "sans-serif"],
            },
            backgroundImage: {
                'fiber-gradient': 'linear-gradient(to bottom right, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
            },
        },
    },
    plugins: [],
};
