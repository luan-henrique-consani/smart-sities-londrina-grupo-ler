"use client";

/**
 * Preferências visuais (tema claro/escuro e modo Acessibilidade, antigo "Daltonismo").
 * O script inline do layout aplica os atributos antes da hidratação (sem "flash");
 * este módulo lê o estado direto do <html> e o persiste em localStorage (try/catch).
 */

import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const THEME_KEY = "prevora:theme";
// Chave mantida ("daltonismo") para não perder preferências já salvas.
const CB_KEY = "prevora:daltonismo";

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function snapshot(): string {
  const root = document.documentElement;
  return `${root.dataset.theme === "dark" ? "dark" : "light"}|${root.dataset.cb === "on" ? "on" : "off"}`;
}

function save(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // armazenamento bloqueado: a preferência vale só nesta sessão
  }
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  save(THEME_KEY, theme);
  emit();
}

export function setColorblind(on: boolean) {
  if (on) document.documentElement.dataset.cb = "on";
  else delete document.documentElement.dataset.cb;
  save(CB_KEY, on ? "on" : "off");
  emit();
}

export function usePrefs(): { theme: Theme; colorblind: boolean } {
  const value = useSyncExternalStore(subscribe, snapshot, () => "light|off");
  const [theme, cb] = value.split("|");
  return { theme: theme as Theme, colorblind: cb === "on" };
}

/** Script que roda antes da hidratação para aplicar as preferências salvas. */
export const PREFS_INIT_SCRIPT = `(function(){try{var r=document.documentElement;var t=null;try{t=localStorage.getItem("${THEME_KEY}")}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}r.dataset.theme=t;var c=null;try{c=localStorage.getItem("${CB_KEY}")}catch(e){}if(c==="on"){r.dataset.cb="on"}}catch(e){}})();`;
