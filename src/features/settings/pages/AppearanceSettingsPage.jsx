import { Sun, Moon, Monitor, Type, Check, Info } from "lucide-react";
import SettingsSectionCard from "../components/SettingsSectionCard";
import useBootstrapBranding from "../hooks/useBootstrapBranding";

const THEME_MODES = [
  {
    id: "light",
    label: "Light",
    description: "Uses your workspace's Warm Alabaster light palette.",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Uses your workspace's Carbon Obsidian dark palette.",
    icon: Moon,
  },
  {
    id: "system",
    label: "System",
    description: "Automatically switches with your OS display setting.",
    icon: Monitor,
  },
];

const FONT_SIZE_OPTIONS = [
  {
    id: "compact",
    label: "Compact",
    px: "14px",
    description: "Higher information density for multi-column boards and logs.",
  },
  {
    id: "default",
    label: "Default",
    px: "16px",
    description: "Balanced architectural hierarchy recommended for daily work.",
  },
  {
    id: "comfortable",
    label: "Comfortable",
    px: "17px",
    description: "Slightly larger body copy for extended reading and docs.",
  },
  {
    id: "large",
    label: "Large",
    px: "18px",
    description: "Maximum legibility across high-DPI external monitors.",
  },
];

function MiniThemePreview({ themeTokens, isDarkPreview }) {
  const bg = themeTokens?.background || (isDarkPreview ? "#0C0C0E" : "#FAF9F6");
  const card = themeTokens?.card || (isDarkPreview ? "#141417" : "#FFFFFF");
  const fg = themeTokens?.foreground || (isDarkPreview ? "#F4F4F6" : "#111113");
  const border = themeTokens?.border || (isDarkPreview ? "#242429" : "#E6E4DD");
  const rail =
    themeTokens?.primarySidebar?.background ||
    (isDarkPreview ? "#08080A" : "#111113");
  const marker = themeTokens?.primarySidebar?.marker || "#E11D48";

  return (
    <div
      className="h-24 w-full rounded-lg border overflow-hidden flex"
      style={{ backgroundColor: bg, borderColor: border }}
    >
      {/* Mini Primary Rail */}
      <div
        className="w-5 h-full flex flex-col items-center py-2 gap-1.5 shrink-0"
        style={{ backgroundColor: rail }}
      >
        <div
          className="size-2.5 rounded-xs"
          style={{ backgroundColor: "#FFFFFF" }}
        />
        <div className="relative w-full flex justify-center">
          <span
            className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
            style={{ backgroundColor: marker }}
          />
          <div
            className="size-2.5 rounded-xs opacity-90"
            style={{ backgroundColor: "#FFFFFF" }}
          />
        </div>
        <div
          className="size-2.5 rounded-xs opacity-35"
          style={{ backgroundColor: "#FFFFFF" }}
        />
      </div>

      {/* Mini Canvas */}
      <div className="flex-1 p-2.5 flex flex-col justify-between">
        <div className="space-y-1">
          <div
            className="h-2 w-14 rounded-xs opacity-85"
            style={{ backgroundColor: fg }}
          />
          <div
            className="h-1.5 w-20 rounded-xs opacity-35"
            style={{ backgroundColor: fg }}
          />
        </div>

        <div
          className="rounded-md border p-2 flex items-center justify-between"
          style={{ backgroundColor: card, borderColor: border }}
        >
          <div
            className="h-2 w-12 rounded-xs opacity-75"
            style={{ backgroundColor: fg }}
          />
          <div
            className="h-2.5 w-6 rounded-xs"
            style={{ backgroundColor: marker }}
          />
        </div>
      </div>
    </div>
  );
}

export function AppearanceSettingsPage() {
  const { branding, themeMode, setThemeMode, fontSize, setFontSize } =
    useBootstrapBranding();

  const lightTokens = branding?.themes?.light;
  const darkTokens = branding?.themes?.dark;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Appearance
        </h1>
        <p className="text-xs text-muted-foreground">
          Personalize your display mode and interface font scale on this browser.
        </p>
      </div>

      {/* Theme Mode Selection */}
      <SettingsSectionCard
        title="Color mode"
        description="Switch between your workspace's Light and Dark themes. Your choice is saved locally on this device."
        footer={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            <span>
              Theme colors and brand logos are defined for the entire workspace in{" "}
              <strong className="font-medium text-foreground">
                Branding & theme
              </strong>
              .
            </span>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {THEME_MODES.map((item) => {
            const Icon = item.icon;
            const isSelected = themeMode === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setThemeMode(item.id)}
                className={`group text-left rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col gap-3 ${
                  isSelected
                    ? "border-foreground bg-muted/50 ring-1 ring-foreground/20"
                    : "border-border bg-card hover:bg-muted/30"
                }`}
              >
                {item.id === "system" ? (
                  <div className="grid grid-cols-2 gap-1.5">
                    <MiniThemePreview
                      themeTokens={lightTokens}
                      isDarkPreview={false}
                    />
                    <MiniThemePreview
                      themeTokens={darkTokens}
                      isDarkPreview={true}
                    />
                  </div>
                ) : (
                  <MiniThemePreview
                    themeTokens={item.id === "dark" ? darkTokens : lightTokens}
                    isDarkPreview={item.id === "dark"}
                  />
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Icon className="size-4 text-muted-foreground" />
                      {item.label}
                    </span>
                    {isSelected && (
                      <span className="size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="size-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </SettingsSectionCard>

      {/* Font Size Scale */}
      <SettingsSectionCard
        title="Interface font size"
        description="Adjusts root typographic scale across chats, docs, tasks, and navigation."
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FONT_SIZE_OPTIONS.map((opt) => {
              const isSelected = fontSize === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFontSize(opt.id)}
                  className={`text-left rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? "border-foreground bg-muted/50 ring-1 ring-foreground/20"
                      : "border-border bg-card hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {opt.label}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {opt.px}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {opt.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Live Typography Specimen */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <Type className="size-3.5 text-muted-foreground" />
                Live scale specimen
              </span>
              <span className="font-mono tabular-nums capitalize">
                {fontSize} scale active
              </span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              HQ Connect unifies real-time messaging, low-latency video rooms,
              collaborative docs, and sprint boards in one calm workspace.
            </p>
            <p className="text-xs text-muted-foreground font-mono tabular-nums">
              09:42 AM · #product-architecture · 12 members online
            </p>
          </div>
        </div>
      </SettingsSectionCard>
    </div>
  );
}

export default AppearanceSettingsPage;

