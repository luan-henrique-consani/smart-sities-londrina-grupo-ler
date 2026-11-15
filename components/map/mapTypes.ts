import type { Category } from "@/components/Shapes";
import type { RiskLevel } from "@/lib/types";

/** Item unificado exibido no mapa e na visão em lista. */
export type MapItem = {
  key: string;
  category: Category;
  level: RiskLevel;
  lat: number;
  lon: number;
  title: string;
  subtitle: string;
  details: string[];
  /** Raio do halo de risco, em metros (só alagamento). */
  radius?: number;
  href?: string;
  approximate: boolean;
};

export const LONDRINA_CENTER: [number, number] = [-23.31, -51.16];

export type FocusRequest = { key: string; nonce: number };
