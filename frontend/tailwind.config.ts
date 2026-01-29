import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(240 10% 3.9%)",
        foreground: "hsl(0 0% 98%)",
        card: "hsl(240 10% 3.9%)",
        "card-foreground": "hsl(0 0% 98%)",
        popover: "hsl(240 10% 3.9%)",
        "popover-foreground": "hsl(0 0% 98%)",
        primary: "hsl(142.1 70.6% 45.3%)",
        "primary-foreground": "hsl(144.9 80.4% 10%)",
        secondary: "hsl(240 3.7% 15.9%)",
        "secondary-foreground": "hsl(0 0% 98%)",
        muted: "hsl(240 3.7% 15.9%)",
        "muted-foreground": "hsl(240 5% 64.9%)",
        accent: "hsl(240 3.7% 15.9%)",
        "accent-foreground": "hsl(0 0% 98%)",
        destructive: "hsl(0 84.2% 60.2%)",
        "destructive-foreground": "hsl(0 0% 98%)",
        border: "hsl(240 3.7% 15.9%)",
        input: "hsl(240 3.7% 15.9%)",
        ring: "hsl(142.1 70.6% 45.3%)"
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem"
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"]
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;

