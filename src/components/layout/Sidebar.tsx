import React from 'react';
import { useTMS } from '../../context/TMSContext';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarRange,
  Sparkles,
  Warehouse,
  Container,
  ListOrdered,
  Truck,
  Building,
  BarChart3,
  Settings,
  AlertTriangle,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'appointments'
  | 'schedule'
  | 'optimizer'
  | 'yard'
  | 'docks'
  | 'queue'
  | 'checkin'
  | 'carriers'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { yardSlots, docks, queue, appointments } = useTMS();

  const occupiedYard = yardSlots.filter((s) => s.isOccupied).length;
  const activeDocks = docks.filter((d) => d.status === 'EM_OPERACAO').length;
  const delayedCount = appointments.filter((a) => a.delayCategory === 'ATRASADO').length;

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agendamentos', icon: CalendarDays, badge: appointments.length },
    { id: 'schedule', label: 'Agenda Diária / Semanal', icon: CalendarRange },
    { id: 'optimizer', label: 'Otimizar Agenda', icon: Sparkles, badge: 'IA/Regras', badgeColor: 'bg-emerald-100 text-emerald-800' },
    { id: 'yard', label: 'Pátio (8 Vagas)', icon: Warehouse, badge: `${occupiedYard}/8`, badgeColor: occupiedYard >= 8 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700' },
    { id: 'docks', label: 'Docas (14 Docas)', icon: Container, badge: `${activeDocks}/14` },
    { id: 'queue', label: 'Fila de Espera', icon: ListOrdered, badge: queue.length > 0 ? queue.length : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
    { id: 'checkin', label: 'Check-in / Portaria', icon: Truck, badge: delayedCount > 0 ? `${delayedCount} atrasos` : undefined, badgeColor: 'bg-rose-100 text-rose-700' },
    { id: 'carriers', label: 'Transportadoras & Motoristas', icon: Building },
    { id: 'reports', label: 'Relatórios & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Configurações & Auditoria', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Operating Shift Notice */}
      <div className="p-3 m-3 rounded-lg border border-slate-200 bg-white text-xs">
        <div className="flex items-center justify-between text-slate-700 font-semibold mb-1">
          <span>Turno Move Log CD</span>
          <span className="font-mono text-[10px] text-emerald-700 font-bold">07:00 – 16:00</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          Capacidade: máx 8 no pátio · 14 docas. Intervalo almoço: <strong className="text-slate-800">11h–12h bloqueado</strong>.
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold shrink-0 ml-2 ${
                    isActive ? 'bg-slate-800 text-white' : item.badgeColor || 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Yard Alert Footer Banner if yard is full */}
      {occupiedYard >= 8 && (
        <div className="p-3 m-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs">
          <div className="flex items-center gap-1.5 font-bold mb-0.5">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            <span>Pátio Lotado (8/8)</span>
          </div>
          <p className="text-[10px] text-rose-700 leading-tight">
            Capacidade máxima atingida. Novos veículos devem aguardar na fila externa.
          </p>
        </div>
      )}

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-200 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-600">Move Log TMS v2.4</p>
        <p>Centro de Distribuição Cajamar / Louveira</p>
      </div>
    </aside>
  );
};
