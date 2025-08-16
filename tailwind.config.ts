// tailwind.config.ts
import type { Config } from "tailwindcss"
 
const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  // --- 🟢 ส่วนที่แก้ไข: เพิ่ม safelist เพื่อบังคับให้ Tailwind สร้าง CSS ของสี Gradient ทั้งหมด ---
  safelist: [
    // Preview classes for Light Mode
    'from-indigo-50', 'via-purple-50', 'to-pink-50',
    'from-blue-100', 'via-teal-100', 'to-green-100',
    'from-yellow-100', 'via-orange-200', 'to-red-200',
    'from-lime-100', 'via-green-200', 'to-teal-200',
    
    // Preview classes for Dark Mode (จำเป็นต้องมี แม้จะไม่ได้แสดงใน preview)
    'dark:from-slate-900', 'dark:via-indigo-950', 'dark:to-purple-950',
    'dark:from-blue-950', 'dark:via-teal-950', 'dark:to-green-950',
    'dark:from-yellow-950', 'dark:via-orange-950', 'dark:to-red-950',
    'dark:from-lime-950', 'dark:via-green-950', 'dark:to-teal-950'
  ],
  // --- สิ้นสุดส่วนที่แก้ไข ---
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      fontSize: {
        'xs-plus': ['0.8125rem', { lineHeight: '1.125rem' }], // ~13px
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("tailwindcss-radix"),
  ],
} satisfies Config
 
export default config