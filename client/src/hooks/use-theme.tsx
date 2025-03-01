import { createContext, useContext, useEffect, useState } from "react";

type Theme = {
  highContrast: boolean;
  toggleHighContrast: () => void;
};

const ThemeContext = createContext<Theme | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Load saved preference
    const savedPreference = localStorage.getItem("high-contrast");
    setHighContrast(savedPreference === "true");
  }, []);

  useEffect(() => {
    // Apply high contrast class to body
    document.body.classList.toggle("high-contrast", highContrast);
    // Save preference
    localStorage.setItem("high-contrast", highContrast.toString());
  }, [highContrast]);

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ highContrast, toggleHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
