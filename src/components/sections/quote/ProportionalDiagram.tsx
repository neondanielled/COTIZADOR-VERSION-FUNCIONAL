import React from 'react';
import { Ruler, Sparkles, AlertCircle } from 'lucide-react';
import { NeonTechnology } from '../../../types/quote';

interface ProportionalDiagramProps {
  widthCm: number;
  heightCm: number;
  hasAcrylic: boolean;
  neonType: NeonTechnology;
  neonMeters: number;
}

export const ProportionalDiagram: React.FC<ProportionalDiagramProps> = ({
  widthCm,
  heightCm,
  hasAcrylic,
  neonType,
  neonMeters,
}) => {
  const isValid = widthCm > 0 && heightCm > 0;

  if (!isValid) {
    return (
      <div className="h-60 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
          <Ruler className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-semibold text-slate-300">
          Vista Proporcional del Cartel
        </h4>
        <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-relaxed">
          Ingresá el ancho y alto en centímetros para visualizar las dimensiones geométricas a escala real.
        </p>
      </div>
    );
  }

  // Calculate geometric aspect ratio and scaling into a box of 260px wide by 180px high
  const maxBoxW = 240;
  const maxBoxH = 170;
  const ratio = widthCm / heightCm;

  let scaledW = maxBoxW;
  let scaledH = scaledW / ratio;

  if (scaledH > maxBoxH) {
    scaledH = maxBoxH;
    scaledW = scaledH * ratio;
  }

  // Round dimensions to avoid subpixel blur
  const boxWidth = Math.max(36, Math.round(scaledW));
  const boxHeight = Math.max(36, Math.round(scaledH));

  // Neon color accent according to selected type
  const neonAccent =
    neonType === 'neon_rgb'
      ? 'from-pink-500 via-purple-500 to-cyan-400'
      : neonType === 'neon_doble_pista'
      ? 'from-amber-400 to-amber-200'
      : 'from-cyan-400 to-blue-400';

  const areaM2 = (widthCm / 100) * (heightCm / 100);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col items-center space-y-4">
      <div className="w-full flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Diagrama Proporcional</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 tabular-nums">
          Proporción {ratio.toFixed(2)}:1
        </span>
      </div>

      {/* Drawing viewport */}
      <div className="w-full h-52 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Scaling container */}
        <div
          className="relative flex items-center justify-center transition-all duration-300"
          style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
        >
          {/* Acrylic backboard / Sign board */}
          <div
            className={`w-full h-full rounded-lg transition-all duration-200 flex flex-col items-center justify-center p-2 relative ${
              hasAcrylic
                ? 'bg-slate-900/90 border-2 border-slate-700/80 shadow-lg shadow-cyan-950/20'
                : 'border-2 border-dashed border-slate-700/60 bg-transparent'
            }`}
          >
            {/* Corner standoffs / mounting holes representation if acrylic is enabled */}
            {hasAcrylic && (
              <>
                <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-400/80 ring-1 ring-slate-600" />
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-400/80 ring-1 ring-slate-600" />
                <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full bg-slate-400/80 ring-1 ring-slate-600" />
                <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-400/80 ring-1 ring-slate-600" />
              </>
            )}

            {/* Glowing neon simulation stroke */}
            <div
              className={`w-3/4 h-2/3 rounded-md bg-gradient-to-r ${neonAccent} opacity-80 blur-[0.5px] shadow-sm flex items-center justify-center p-1 transition-all`}
            >
              <div className="w-full h-full rounded border border-white/40 flex items-center justify-center">
                <span className="text-[9px] font-bold tracking-widest text-slate-950 uppercase truncate px-1">
                  NEÓN
                </span>
              </div>
            </div>

            {/* Sub-label inside sign */}
            <span className="text-[9px] font-mono text-slate-400 mt-1 tabular-nums">
              {widthCm} × {heightCm} cm
            </span>
          </div>

          {/* Dimension indicator: Width (top) */}
          <div className="absolute -top-5 inset-x-0 flex items-center justify-center">
            <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 tabular-nums">
              {widthCm} cm
            </span>
          </div>

          {/* Dimension indicator: Height (right) */}
          <div className="absolute -right-12 inset-y-0 flex items-center justify-center">
            <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 tabular-nums whitespace-nowrap">
              {heightCm} cm
            </span>
          </div>
        </div>
      </div>

      {/* Footer details */}
      <div className="w-full text-left space-y-1 text-xs pt-1 border-t border-slate-800/80">
        <div className="flex justify-between text-slate-300">
          <span className="text-slate-400">Superficie base:</span>
          <span className="font-mono tabular-nums text-slate-100">
            {areaM2.toFixed(3)} m² ({hasAcrylic ? 'con acrílico' : 'sin acrílico'})
          </span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span className="text-slate-400">Recorrido neón:</span>
          <span className="font-mono tabular-nums text-slate-100">
            {neonMeters > 0 ? `${neonMeters} m lineales` : 'Pendiente'}
          </span>
        </div>
      </div>

      <div className="w-full flex items-start gap-1.5 text-[11px] text-slate-500 pt-1">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Representación visual de dimensiones generales. No constituye un plano técnico de corte.
        </span>
      </div>
    </div>
  );
};
