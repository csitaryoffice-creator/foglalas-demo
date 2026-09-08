import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { activateDemoPreset, resetDemoPreset } from "./sessionStore.js";
import { getDemoPreset } from "./presets.js";

const DemoContext = createContext(null);

export function DemoBusinessRoute() {
  const { presetId } = useParams();
  const preset = getDemoPreset(presetId);
  if (!preset) return <Navigate to="/" replace />;
  return <DemoProvider key={presetId} preset={preset}><Outlet /></DemoProvider>;
}

function DemoProvider({ preset, children }) {
  const [revision, setRevision] = useState(0);

  useMemo(() => activateDemoPreset(preset.id), [preset.id]);

  useEffect(() => {
    const handleChange = (event) => {
      if (event.detail?.presetId === preset.id) setRevision((value) => value + 1);
    };
    window.addEventListener("demo-state-changed", handleChange);
    return () => window.removeEventListener("demo-state-changed", handleChange);
  }, [preset.id]);

  const value = useMemo(() => ({
    preset,
    presetId: preset.id,
    terminology: preset.terminology,
    revision,
    bookingPath: `/demo/${preset.id}/booking`,
    adminPath: `/demo/${preset.id}/admin`,
    adminLoginPath: `/demo/${preset.id}/admin-login`,
    resetDemo() {
      resetDemoPreset(preset.id);
      setRevision((current) => current + 1);
    },
  }), [preset, revision]);

  const themeStyle = {
    backgroundColor: `hsl(${preset.branding.backgroundColor})`,
    "--demo-accent": preset.branding.primaryColor,
    "--demo-highlight": preset.branding.accentColor,
    "--demo-soft": preset.branding.backgroundColor,
    "--background": preset.branding.backgroundColor,
    "--foreground": preset.branding.textColor,
    "--card": preset.branding.surfaceColor,
    "--card-foreground": preset.branding.textColor,
    "--popover": preset.branding.surfaceColor,
    "--popover-foreground": preset.branding.textColor,
    "--primary": preset.branding.primaryColor,
    "--primary-foreground": preset.branding.surfaceColor,
    "--secondary": preset.branding.backgroundColor,
    "--secondary-foreground": preset.branding.textColor,
    "--muted": preset.branding.backgroundColor,
    "--muted-foreground": preset.branding.mutedTextColor,
    "--border": preset.branding.borderColor,
    "--input": preset.branding.borderColor,
    "--ring": preset.branding.primaryColor,
    "--radius": preset.branding.borderRadius,
    "--font-heading": preset.branding.headingFont,
    "--font-body": preset.branding.bodyFont,
  };

  return (
    <DemoContext.Provider value={value}>
      <div
        className="demo-theme min-h-screen"
        data-demo-theme={preset.id}
        data-density={preset.branding.visualDensity}
        data-button-style={preset.branding.buttonStyle}
        style={themeStyle}
      >
        {children}
      </div>
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("A demó kontextus csak kiválasztott presetben használható.");
  return context;
}
