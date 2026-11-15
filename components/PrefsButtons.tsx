"use client";

import { setColorblind, setTheme, usePrefs } from "@/lib/prefs";
import { IconEye, IconMoon, IconSun } from "@/components/icons";

const BTN =
  "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-foreground hover:bg-surface-2";

export function PrefsButtons() {
  const { theme, colorblind } = usePrefs();
  const dark = theme === "dark";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className={BTN}
        aria-pressed={dark}
        aria-label={dark ? "Tema escuro ativado. Mudar para o tema claro" : "Tema claro ativado. Mudar para o tema escuro"}
        title={dark ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
        onClick={() => setTheme(dark ? "light" : "dark")}
      >
        {dark ? <IconMoon /> : <IconSun />}
        <span className="hidden xl:inline">{dark ? "Escuro" : "Claro"}</span>
      </button>
      <button
        type="button"
        className={`${BTN} ${colorblind ? "border-primary bg-primary-soft" : ""}`}
        aria-pressed={colorblind}
        aria-label="Modo daltonismo (paleta Okabe-Ito)"
        title="Modo daltonismo (paleta Okabe-Ito)"
        onClick={() => setColorblind(!colorblind)}
      >
        <IconEye />
        <span className="hidden xl:inline">Daltonismo</span>
      </button>
    </div>
  );
}
