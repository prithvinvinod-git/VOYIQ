
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['DM Sans', 'sans-serif'],
        headline: ['Space Grotesk', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
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
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'aurora-sweep': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.25), 0 0 40px rgba(139,92,246,0.1)' },
          '50%': { boxShadow: '0 0 50px rgba(99,102,241,0.55), 0 0 100px rgba(139,92,246,0.25)' },
        },
        'orb-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '50%': { transform: 'translate(-15px, 25px) scale(0.97)' },
          '75%': { transform: 'translate(20px, 10px) scale(1.03)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'counter-spin': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-right': {
          from: { opacity: '0', transform: 'translateX(-32px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'hero-title': {
          from: { opacity: '0', transform: 'translateY(40px) skewY(3deg)', letterSpacing: '0.05em' },
          to: { opacity: '1', transform: 'translateY(0) skewY(0)', letterSpacing: 'inherit' },
        },
        'border-rotate': {
          to: { '--angle': '360deg' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        'typewriter-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'flip-in': {
          from: { transform: 'rotateY(-90deg)', opacity: '0' },
          to: { transform: 'rotateY(0deg)', opacity: '1' },
        },
        'number-ticker': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'progress-fill': {
          from: { width: '0%' },
          to: { width: '100%' },
        },
        'particle-float': {
          '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)', opacity: '0.6' },
          '50%': { transform: 'translateY(-70px) translateX(20px) scale(1.3)', opacity: '0.15' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out forwards',
        'pulse-subtle': 'pulse-subtle 2.5s infinite ease-in-out',
        'float': 'float 4s ease-in-out infinite',
        'float-slow': 'float 7s ease-in-out infinite',
        'float-delayed': 'float 5s ease-in-out 1.5s infinite',
        'shimmer': 'shimmer 3s ease-in-out infinite',
        'aurora-sweep': 'aurora-sweep 8s ease infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'orb-drift': 'orb-drift 14s ease-in-out infinite',
        'orb-drift-slow': 'orb-drift 20s ease-in-out infinite',
        'spin-slow': 'spin-slow 22s linear infinite',
        'counter-spin': 'counter-spin 16s linear infinite',
        'scale-in': 'scale-in 0.45s cubic-bezier(0.23,1,0.32,1) forwards',
        'slide-up': 'slide-up 0.65s cubic-bezier(0.23,1,0.32,1) forwards',
        'slide-right': 'slide-right 0.65s cubic-bezier(0.23,1,0.32,1) forwards',
        'hero-title': 'hero-title 0.9s cubic-bezier(0.23,1,0.32,1) forwards',
        'marquee': 'marquee 28s linear infinite',
        'marquee-slow': 'marquee 40s linear infinite',
        'marquee-reverse': 'marquee-reverse 32s linear infinite',
        'typewriter-blink': 'typewriter-blink 1s ease-in-out infinite',
        'flip-in': 'flip-in 0.5s cubic-bezier(0.23,1,0.32,1) forwards',
        'particle-float': 'particle-float var(--duration, 8s) ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
