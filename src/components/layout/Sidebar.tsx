import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Package,
  Calculator,
  FileText,
  Users,
  Truck,
  Zap,
  X,
} from 'lucide-react';
import { APP_SECTIONS, NavigationSection } from '../../types/navigation';

interface SidebarProps {
  currentSection: NavigationSection;
  onSelectSection: (section: NavigationSection) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  materialsCount: number;
  quotesCount?: number;
  clientsCount?: number;
  suppliersCount?: number;
  isBusinessConfigured: boolean;
  logoDataUrl?: string;
}

const SECTION_ICONS: Record<NavigationSection, React.FC<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  business: Building2,
  materials: Package,
  'quote-builder': Calculator,
  quotes: FileText,
  clients: Users,
  suppliers: Truck,
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
  materialsCount,
  quotesCount = 0,
  clientsCount = 0,
  suppliersCount = 0,
  isBusinessConfigured,
  logoDataUrl,
}) => {
  const content = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {logoDataUrl ? (
            <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
              <img
                src={logoDataUrl}
                alt="Logo del negocio"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/20">
              <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
          )}
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Cotizador Neón
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Taller LED Neon Flex
            </p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Módulos del Sistema
        </div>

        {APP_SECTIONS.map((section) => {
          const Icon = SECTION_ICONS[section.id];
          const isActive = currentSection === section.id;

          return (
            <button
              key={section.id}
              onClick={() => {
                onSelectSection(section.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-cyan-500/20'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-cyan-400'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{section.label}</span>
              </div>

              {/* Status indicator without ugly pills */}
              <div className="flex items-center gap-2 shrink-0">
                {section.id === 'materials' && materialsCount > 0 && (
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {materialsCount}
                  </span>
                )}
                {section.id === 'quotes' && quotesCount > 0 && (
                  <span className="text-[11px] font-mono text-cyan-400 tabular-nums font-semibold">
                    {quotesCount}
                  </span>
                )}
                {section.id === 'clients' && clientsCount > 0 && (
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {clientsCount}
                  </span>
                )}
                {section.id === 'suppliers' && suppliersCount > 0 && (
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {suppliersCount}
                  </span>
                )}
                {section.id === 'business' && isBusinessConfigured && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" title="Configurado" />
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Fase 3 · Gestión comercial y PDF</span>
          <span className="font-mono text-cyan-400">v3.0</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Historial, clientes, proveedores y A4
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-200 ease-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
};
