// tailwind.config.ts
import type { Config } from "tailwindcss"
 
const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}', 
  ],
  // --- 🟢 ส่วนที่แก้ไข: เพิ่ม safelist เพื่อบังคับให้ Tailwind สร้าง CSS ของสี Gradient ทั้งหมด ---
  safelist: [
    'from-indigo-50', 'via-purple-50', 'to-pink-50',
    'from-blue-100', 'via-teal-100', 'to-green-100',
    'from-yellow-100', 'via-orange-200', 'to-red-200',
    'from-lime-100', 'via-green-200', 'to-teal-200',
    'from-orange-200', 'via-yellow-200', 'to-orange-300',
    'from-purple-200', 'via-indigo-200', 'to-blue-200',
    'from-teal-200', 'via-emerald-300', 'to-green-300',
    'from-red-200', 'via-rose-200', 'to-pink-200',
    // 🟢 เพิ่ม safelist สำหรับสีใหม่
    'from-gray-200', 'via-gray-300', 'to-gray-400',
    'from-sky-200', 'via-blue-300', 'to-indigo-400',
    'from-blue-800', 'via-indigo-900', 'to-purple-950',
    'from-slate-100', 'via-gray-200', 'to-slate-300',
    'from-amber-200', 'via-yellow-500', 'to-orange-600',
    
    'dark:from-slate-900', 'dark:via-indigo-950', 'dark:to-purple-950',
    'dark:from-blue-950', 'dark:via-teal-950', 'dark:to-green-950',
    'dark:from-yellow-950', 'dark:via-orange-950', 'dark:to-red-950',
    'dark:from-lime-950', 'dark:via-green-950', 'dark:to-teal-950',
    'dark:from-orange-950', 'dark:via-yellow-950', 'dark:to-orange-900',
    'dark:from-purple-950', 'dark:via-indigo-950', 'dark:to-blue-950',
    'dark:from-teal-950', 'dark:via-emerald-950', 'dark:to-green-950',
    'dark:from-red-950', 'dark:via-rose-950', 'dark:to-pink-950',
    // 🟢 เพิ่ม safelist สำหรับสีใหม่ (โหมด dark)
    'dark:from-gray-700', 'dark:via-gray-800', 'dark:to-gray-900',
    'dark:from-sky-950', 'dark:via-blue-950', 'dark:to-indigo-950',
    'dark:from-blue-900', 'dark:via-indigo-950', 'dark:to-purple-950',
    'dark:from-slate-800', 'dark:via-gray-900', 'dark:to-slate-900',
    'dark:from-amber-950', 'dark:via-yellow-900', 'dark:to-orange-950',
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