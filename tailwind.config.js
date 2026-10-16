/** @type {import('tailwindcss').Config} */
import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],
    theme: {
        extend: {
            colors: {
                gf: {
                    yellow: '#F5C400',
                    green: '#88c300',
                    red: '#E30613',
                    blue: '#00A5E3',
                    forest: '#4C7000',
                    ink: '#0B1220',
                },
            },
            fontFamily: {
                sans: ['Manrope', ...defaultTheme.fontFamily.sans],
                display: ['Outfit', ...defaultTheme.fontFamily.sans],
                alice: ['Alice', 'Georgia', ...defaultTheme.fontFamily.serif],
            },
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(6px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-in': {
                    '0%': { opacity: '0', transform: 'translateX(12px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 0.45s ease-out both',
                'slide-in': 'slide-in 0.35s ease-out both',
            },
        },
    },
    plugins: [forms],
};
