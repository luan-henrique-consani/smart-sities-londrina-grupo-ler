"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { CATEGORY_LABEL, CategoryTag, RiskBadge, type Category } from "@/components/Shapes";
import { RISK_CLASS } from "@/lib/format";
import type { RiskLevel } from "@/lib/types";
import { LONDRINA_CENTER, type FocusRequest, type MapItem } from "./mapTypes";

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_FAIL_THRESHOLD = 8;

const iconCache = new Map<string, L.DivIcon>();

/** Marcador: a FORMA indica a categoria e a COR indica a criticidade. */
function markerIcon(category: Category, level: RiskLevel): L.DivIcon {
  const cacheKey = `${category}:${level}`;
  const cached = iconCache.get(cacheKey);
  if (cached) return cached;
  const cls = `mk mk-${RISK_CLASS[level]}`;
  let shape: string;
  let size = 28;
  if (category === "alagamento") {
    size = 32;
    shape = `<circle class="${cls}" cx="16" cy="16" r="11"/>`;
  } else if (category === "entulho") {
    shape = `<rect class="${cls}" x="5" y="5" width="18" height="18" rx="2"/>`;
  } else {
    size = 34;
    shape = `<polygon class="${cls}" points="17,3 31,17 17,31 3,17"/>`;
  }
  const icon = L.divIcon({
    className: "prevora-marker",
    html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false">${shape}</svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 + 2],
  });
  iconCache.set(cacheKey, icon);
  return icon;
}

const Z_BY_LEVEL: Record<RiskLevel, number> = { baixo: 0, médio: 500, alto: 1000 };

function FocusController({
  focus,
  items,
  markers,
}: {
  focus: FocusRequest | null;
  items: MapItem[];
  markers: RefObject<Map<string, L.Marker>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    const item = items.find((i) => i.key === focus.key);
    if (!item) return;
    map.flyTo([item.lat, item.lon], Math.max(map.getZoom(), 15), { duration: 0.7 });
    const open = () => markers.current.get(focus.key)?.openPopup();
    map.once("moveend", open);
    return () => {
      map.off("moveend", open);
    };
    // Só reage a novos pedidos de foco (nonce), não a mudanças de filtro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.nonce, map]);
  return null;
}

function ItemPopup({ item }: { item: MapItem }) {
  return (
    <div className="flex min-w-[13rem] max-w-[17rem] flex-col gap-2">
      <CategoryTag category={item.category} />
      <p className="font-display text-base font-bold leading-snug">{item.title}</p>
      <p className="text-muted">{item.subtitle}</p>
      <div>
        <RiskBadge level={item.level} />
      </div>
      <ul className="flex flex-col gap-0.5 text-sm">
        {item.details.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      {item.approximate && (
        <p className="text-xs text-muted">Coordenadas aproximadas · dados simulados.</p>
      )}
      {item.href && (
        <Link
          href={item.href}
          className="inline-flex min-h-11 items-center font-semibold text-primary underline"
        >
          Ver ponto {item.key}
        </Link>
      )}
    </div>
  );
}

export default function MapView({
  items,
  focus,
  onTilesFailed,
}: {
  items: MapItem[];
  focus: FocusRequest | null;
  onTilesFailed: () => void;
}) {
  const markers = useRef(new Map<string, L.Marker>());
  const tiles = useRef({ ok: 0, error: 0, reported: false });

  const halos = useMemo(() => items.filter((i) => i.radius), [items]);
  const ordered = useMemo(
    () => [...items].sort((a, b) => Z_BY_LEVEL[a.level] - Z_BY_LEVEL[b.level]),
    [items],
  );

  return (
    <MapContainer
      center={LONDRINA_CENTER}
      zoom={12}
      minZoom={10}
      maxZoom={18}
      scrollWheelZoom
      keyboard
      className="h-full w-full"
    >
      <TileLayer
        url={TILE_URL}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">Colaboradores do OpenStreetMap</a>'
        eventHandlers={{
          tileload: () => {
            tiles.current.ok += 1;
          },
          tileerror: () => {
            tiles.current.error += 1;
            const t = tiles.current;
            if (!t.reported && t.ok === 0 && t.error >= TILE_FAIL_THRESHOLD) {
              t.reported = true;
              onTilesFailed();
            }
          },
        }}
      />

      {halos.map((item) => (
        <Circle
          key={`halo-${item.key}`}
          center={[item.lat, item.lon]}
          radius={item.radius}
          interactive={false}
          pathOptions={{ className: `halo halo-${RISK_CLASS[item.level]}` }}
        />
      ))}

      {ordered.map((item) => {
        const label = `${CATEGORY_LABEL[item.category]}: ${item.title}. Criticidade ${item.level}.`;
        return (
          <Marker
            key={item.key}
            position={[item.lat, item.lon]}
            icon={markerIcon(item.category, item.level)}
            zIndexOffset={Z_BY_LEVEL[item.level] + (item.category === "alagamento" ? 200 : 0)}
            title={label}
            keyboard
            ref={(marker) => {
              if (marker) markers.current.set(item.key, marker);
              else markers.current.delete(item.key);
            }}
            eventHandlers={{
              add: (e) => {
                const el = (e.target as L.Marker).getElement();
                el?.setAttribute("aria-label", label);
                el?.setAttribute("role", "button");
              },
            }}
          >
            <Popup maxHeight={260} autoPanPadding={[24, 24]}>
              <ItemPopup item={item} />
            </Popup>
          </Marker>
        );
      })}

      <FocusController focus={focus} items={items} markers={markers} />
    </MapContainer>
  );
}
