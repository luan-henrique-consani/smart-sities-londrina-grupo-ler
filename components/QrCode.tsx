import { useMemo } from "react";
import { qrMatrix } from "@/lib/qr";

/**
 * QR Code em SVG: fundo branco, módulos escuros e zona silenciosa de 4 módulos
 * (independe do tema para garantir leitura em projetor).
 */
export function QrCode({ value, label, className = "" }: { value: string; label: string; className?: string }) {
  const matrix = useMemo(() => qrMatrix(value), [value]);
  const quiet = 4;
  const size = matrix.length + quiet * 2;
  const path = matrix
    .flatMap((row, r) => row.map((dark, c) => (dark ? `M${c + quiet} ${r + quiet}h1v1h-1z` : "")))
    .join("");
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className={className}
      data-qr-value={value}
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#0b1220" />
    </svg>
  );
}
