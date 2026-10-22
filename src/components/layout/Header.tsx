import React from 'react';
import { Menu, Zap } from 'lucide-react';
import { APP_SECTIONS, NavigationSection } from '../../types/navigation';

interface HeaderProps {
  currentSection: NavigationSection;
  onOpenMobileMenu: () => void;
  tradeName?: string;
  onQuickAction?: () => void;
  quickActionLabel?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  onOpenMobileMenu,
  tradeName,
  onQuickAction,
  quickActionLabel,
}) => {
  const activeSection = APP_SECTIONS.find((s) => s.id === currentSection);

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 truncate">
          <span className="text-slate-400 hidden sm:inline">Cotizador Neón</span>
          <span className="text-slate-400 hidden sm:inline">/</span>
          <span className="font-semibold text-slate-100 truncate">
            {activeSection?.label || 'Panel'}
          </span>
        </div>
      </div>

      {/* Right: Workshop context & optional primary action */}
      <div className="flex items-center gap-3 shrink-0">
        {tradeName ? (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-400">Taller:</span>
            <span className="font-medium text-slate-200 truncate max-w-[160px]">
              {tradeName}
            </span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-amber-400/90">
            <Zap className="w-3.5 h-3.5" />
            <span>Configuración pendiente en Mi Negocio</span>
          </div>
        )}

        {onQuickAction && quickActionLabel && (
          <button
            onClick={onQuickAction}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            {quickActionLabel}
          </button>
        )}
      </div>
    </header>
  );
};
