// tailwind.config.js
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html",
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                primary: 'var(--primary)',
                'primary-foreground': 'var(--primary-foreground)',
                secondary: 'var(--secondary)',
                'secondary-foreground': 'var(--secondary-foreground)',
                accent: 'var(--accent)',
                'accent-foreground': 'var(--accent-foreground)',
                destructive: 'var(--destructive)',
                'destructive-foreground': 'var(--destructive-foreground)',
                border: 'var(--border)',
                input: 'var(--input)',
                ring: 'var(--ring)',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'sans-serif'],
                serif: ['var(--font-serif)', 'serif'],
                mono: ['var(--font-mono)', 'monospace'],
            },
            borderRadius: {
                DEFAULT: 'var(--radius)',
            },
        },
    },
    plugins: [require('daisyui')],
};
