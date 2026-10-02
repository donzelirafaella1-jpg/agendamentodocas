import React from 'react';
import { useTMS } from '../../context/TMSContext';
import { UserRole } from '../../types';
import { 
  Clock, 
  Play, 
  Pause, 
  FastForward, 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  ChevronDown,
  RotateCcw
} from 'lucide-react';

interface HeaderProps {
  onResetDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onResetDemo }) => {
  const {
    activeProfile,
    availableProfiles,
    switchProfile,
    currentTimeStr,
    setCurrentTimeStr,
    isClockRunning,
    toggleClockRunning,
    company,
    selectedDate,
    setSelectedDate,
    yardSlots,
    docks,
    queue,
    appointments,
  } = useTMS();

  // Metrics for quiet top telemetry
  const occupiedYard = yardSlots.filter((s) => s.isOccupied).length;
  const activeDocks = docks.filter((d) => d.status === 'EM_OPERACAO').length;
  const delayedCount = appointments.filter((a) => a.delayCategory === 'ATRASADO').length;

  const handleAdvanceTime = (minutes: number) => {
    const [h, m] = currentTimeStr.split(':').map(Number);
    const total = h * 60 + m + minutes;
    const norm = total >= 16 * 60 ? 7 * 60 : total;
    const newH = Math.floor(norm / 60).toString().padStart(2, '0');
    const newM = (norm % 60).toString().padStart(2, '0');
    setCurrentTimeStr(`${newH}:${newM}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md md:px-6">
      {/* Zone 1: Brand Wordmark & Location */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-base shadow-sm">
          ML
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900">Move Log TMS</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              CD Ativo
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{company.distributionCenterName}</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Operational Clock & Quiet Counters */}
      <div className="hidden lg:flex items-center gap-6">
        {/* Unboxed Status Metrics */}
        <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Pátio:</span>
            <span className={`font-mono font-semibold tabular-nums ${occupiedYard >= 8 ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
              {occupiedYard}/8
            </span>
          </div>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Docas:</span>
            <span className="font-mono font-semibold tabular-nums text-slate-900">
              {activeDocks}/14
            </span>
          </div>
          <span className="text-slate-300">/</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Fila:</span>
            <span className="font-mono font-semibold tabular-nums text-amber-700">
              {queue.length}
            </span>
          </div>
          {delayedCount > 0 && (
            <>
              <span className="text-slate-300">/</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">Atrasos:</span>
                <span className="font-mono font-semibold tabular-nums text-rose-600">
                  {delayedCount}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Operational Clock Simulator */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
          <Clock className="h-4 w-4 text-slate-500" />
          <span className="text-slate-500">Horário CD:</span>
          <span className="font-mono text-sm font-bold tabular-nums text-slate-900">
            {currentTimeStr}
          </span>
          <div className="flex items-center gap-1 ml-1 border-l border-slate-200 pl-2">
            <button
              onClick={toggleClockRunning}
              title={isClockRunning ? 'Pausar simulação do relógio' : 'Iniciar simulação do relógio'}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            >
              {isClockRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 text-emerald-600" />}
            </button>
            <button
              onClick={() => handleAdvanceTime(15)}
              title="Avançar 15 minutos na simulação"
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors flex items-center"
            >
              <FastForward className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono ml-0.5">+15m</span>
            </button>
          </div>
        </div>
      </div>

      {/* Zone 3: Date picker, Profile Switcher & Actions */}
      <div className="flex items-center gap-3">
        {/* Date Selector */}
        <div className="hidden md:flex items-center">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
          />
        </div>

        {/* Profile Role Switcher (Simulated Auth) */}
        <div className="relative group">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 hover:bg-slate-100 transition-colors cursor-pointer">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
              {activeProfile.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-medium text-slate-900 leading-none truncate max-w-[120px]">
                {activeProfile.name}
              </p>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">
                {activeProfile.roleLabel}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
          </div>

          {/* Profile Dropdown */}
          <div className="absolute right-0 mt-1 w-64 origin-top-right rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
            <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Alternar Perfil Operacional
              </span>
            </div>
            {availableProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => switchProfile(p.role)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                  activeProfile.role === p.role ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-[10px] text-slate-500">{p.roleLabel}</p>
                </div>
                {activeProfile.role === p.role && (
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 ml-1" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Data Reset button */}
        <button
          onClick={onResetDemo}
          title="Restaurar dados de demonstração (32 caminhões diários)"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
