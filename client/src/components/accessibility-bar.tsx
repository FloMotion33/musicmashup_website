import { Moon, Sun, Eye } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

export function AccessibilityBar() {
  const { highContrast, toggleHighContrast } = useTheme();

  return (
    <div 
      className="fixed top-4 right-4 z-50 flex items-center gap-2"
      role="toolbar"
      aria-label="Accessibility controls"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={toggleHighContrast}
        aria-pressed={highContrast}
        className="relative"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">
          {highContrast ? "Disable high contrast" : "Enable high contrast"}
        </span>
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          // Announce current page content to screen readers
          const announcement = document.createElement('div');
          announcement.setAttribute('aria-live', 'polite');
          announcement.setAttribute('role', 'status');
          announcement.textContent = 'Audio mashup creator application. Use the upload section to add audio files and the mixer section to create your mashup.';
          document.body.appendChild(announcement);
          setTimeout(() => document.body.removeChild(announcement), 1000);
        }}
        aria-label="Announce page content"
      >
        <Eye className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    </div>
  );
}
