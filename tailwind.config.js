/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#E6F0FF",
          100: "#CCE0FF",
          200: "#99C2FF",
          300: "#66A3FF",
          400: "#3385FF", // Main primary color - vibrant blue
          500: "#0066FF",
          600: "#0052CC",
          700: "#003D99",
          800: "#002966",
          900: "#001433",
        },
        secondary: {
          50: "#FFFFFF",
          100: "#F8F9FA",
          200: "#E9ECEF",
          300: "#DEE2E6",
          400: "#CED4DA", // Main secondary color - white/light gray
          500: "#ADB5BD",
          600: "#6C757D",
          700: "#495057",
          800: "#343A40",
          900: "#212529",
        },
        accent: {
          50: "#FFEBEB",
          100: "#FFD6D6",
          200: "#FFADAD",
          300: "#FF8585",
          400: "#FF5C5C", // Main accent color - vibrant red
          500: "#FF3333",
          600: "#CC2929",
          700: "#991F1F",
          800: "#661414",
          900: "#330A0A",
        },
        success: {
          50: "#E6F7FF",
          100: "#CCF0FF",
          200: "#99E0FF",
          300: "#66D1FF",
          400: "#33C1FF", // Main success color - bright blue
          500: "#00B2FF",
          600: "#008ECC",
          700: "#006B99",
          800: "#004766",
          900: "#002433",
        },
        warning: {
          50: "#FFFFFF",
          100: "#F8F9FA",
          200: "#E9ECEF",
          300: "#DEE2E6",
          400: "#CED4DA", // Main warning color - white/light gray
          500: "#ADB5BD",
          600: "#6C757D",
          700: "#495057",
          800: "#343A40",
          900: "#212529",
        },
        error: {
          50: "#FFEBEB",
          100: "#FFD6D6",
          200: "#FFADAD",
          300: "#FF8585",
          400: "#FF5C5C", // Main error color - vibrant red
          500: "#FF3333",
          600: "#CC2929",
          700: "#991F1F",
          800: "#661414",
          900: "#330A0A",
        },
        neutral: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        press: "press 0.2s ease-out",
        pop: "pop 0.3s ease-out",
        bounce: "bounce 1s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        press: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.98)" },
          "100%": { transform: "scale(1)" },
        },
        pop: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "70%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      boxShadow: {
        card: "0 2px 8px 0 rgba(0, 0, 0, 0.05)",
        "card-hover": "0 8px 24px rgba(0, 0, 0, 0.12)",
        dropdown: "0 4px 12px rgba(0, 0, 0, 0.1)",
        glow: "0 0 15px rgba(0, 102, 255, 0.5)",
        "3d-sm":
          "0 1px 2px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.05), 0 1px 1px rgba(255,255,255,0.25) inset",
        "3d-md":
          "0 2px 4px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1), 0 1px 1px rgba(255,255,255,0.25) inset",
        "3d-lg":
          "0 4px 6px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.15), 0 1px 2px rgba(255,255,255,0.3) inset",
        "3d-inner":
          "inset 0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(0,0,0,0.1)",
        "3d-button":
          "0 2px 4px rgba(0,0,0,0.1), 0 1px 0 rgba(255,255,255,0.1) inset, 0 -1px 0 rgba(0,0,0,0.1) inset",
        "3d-button-hover":
          "0 4px 8px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.15) inset",
      },
      transformStyle: {
        "3d": "preserve-3d",
      },
      perspective: {
        500: "500px",
        1000: "1000px",
        1500: "1500px",
        2000: "2000px",
      },
      backdropFilter: {
        "blur-sm": "blur(4px)",
        blur: "blur(8px)",
        "blur-md": "blur(12px)",
        "blur-lg": "blur(16px)",
      },
      backgroundImage: {
        "gradient-glass":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
        "gradient-glass-dark":
          "linear-gradient(135deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.05))",
      },
    },
    fontFamily: {
      sans: [
        "Poppins",
        "Inter",
        "system-ui",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        "sans-serif",
      ],
    },
  },
  plugins: [],
};
