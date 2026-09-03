import { Sun, Moon, Monitor, Check, Palette } from "lucide-react";
import { useAppearance } from "@/global/theme/useAppearance";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function PreferencesPage() {
  const { theme, setTheme, accentColor, setAccentColor, accentColors } = useAppearance();

  const themeList = [
    {
      id: "light",
      label: "Light",
      description: "Clean, high-visibility bright theme",
      icon: Sun,
    },
    {
      id: "dark",
      label: "Dark",
      description: "Low-glare dark theme for low light",
      icon: Moon,
    },
    {
      id: "system",
      label: "System",
      description: "Automatically matches your device settings",
      icon: Monitor,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground tracking-tight">
          Preferences
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize your personal interface appearance and theme settings.
        </p>
      </div>

      {/* Appearance Section */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            <CardTitle className="text-lg">Appearance</CardTitle>
          </div>
          <CardDescription>
            Choose how HQ Connect looks to you. Themes and accent colors update immediately and are saved across sessions.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* 1. Theme Selection */}
          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Theme</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select your preferred color mode.
              </p>
            </div>

            <div 
              role="radiogroup" 
              aria-label="Theme options"
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {themeList.map((item) => {
                const Icon = item.icon;
                const isSelected = theme === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setTheme(item.id)}
                    className={`relative flex flex-col text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                        : "border-border hover:border-foreground/20 hover:bg-muted/30 bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        <Icon className="size-4" />
                      </div>
                      {isSelected && (
                        <span className="flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground shadow-xs">
                          <Check className="size-3 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <span className="font-semibold text-sm text-foreground">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 leading-snug">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Accent Color Selection */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Accent Color</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a highlight color for primary buttons, active items, and interactive elements.
              </p>
            </div>

            <div 
              role="radiogroup" 
              aria-label="Accent color options"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {accentColors.map((color) => {
                const isSelected = accentColor === color.id;

                return (
                  <button
                    key={color.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setAccentColor(color.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                        : "border-border hover:border-foreground/20 hover:bg-muted/30 bg-card"
                    }`}
                  >
                    <span 
                      className="size-5 rounded-full shrink-0 flex items-center justify-center shadow-xs text-white"
                      style={{ backgroundColor: color.color }}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {color.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
