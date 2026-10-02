import React from 'react';
import { useTMS } from '../../context/TMSContext';
import { computeOperationalReport } from '../../services/reportService';
import { getHourlyYardLoad } from '../../services/yardCapacityService';
import {
  Truck,
  Warehouse,
  Container,
  Clock,
  AlertCircle,
  CheckCircle2,
  Timer,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { appointments, carriers, yardSlots, docks, queue, selectedDate, currentTimeStr } = useTMS();

  const report = computeOperationalReport(appointments, carriers, 14, 8);
  const hourlyLoad = getHourlyYardLoad(selectedDate, appointments);

  // Status counters
  const scheduledCount = appointments.filter((a) => a.status === 'AGENDADO').length;
  const inYardCount = appointments.filter((a) => a.status === 'NO_PATIO').length;
  const inQueueCount = appointments.filter((a) => a.status === 'NA_FILA').length;
  const inDockCount = appointments.filter(
    (a) => a.status === 'EM_DOCA' || a.status === 'DESCARREGANDO'
  ).length;
  const completedCount = appointments.filter((a) => a.status === 'FINALIZADO').length;

  const freeYardSlots = 8 - yardSlots.filter((s) => s.isOccupied).length;
  const freeDocks = 14 - docks.filter((d) => d.status === 'EM_OPERACAO' || d.isMaintenance).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Torre de Controle Operacional
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            CD Move Log Louveira · Capacidade diária: 32 veículos · Turnos 07:00–11:00 e 12:00–16:00
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('optimizer')}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <span>Otimizar Agenda Diária</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('checkin')}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Portaria / Check-in
          </button>
        </div>
      </div>

      {/* Critical Operational Overlap & Yard Capacity Banner */}
      {yardSlots.filter((s) => s.isOccupied).length >= 8 ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-rose-800">
              ALERTA CRÍTICO: Capacidade máxima do pátio atingida (8/8 veículos simultâneos)
            </h4>
            <p className="mt-0.5 text-rose-700">
              Todas as 8 vagas físicas do pátio estão ocupadas. Novos veículos que realizarem check-in serão colocados na fila de retenção externa até a liberação de vaga ou doca.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('yard')}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shrink-0"
          >
            Ver Pátio
          </button>
        </div>
      ) : yardSlots.filter((s) => s.isOccupied).length >= 7 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong>Atenção ao Pátio:</strong> 7 de 8 vagas ocupadas. Resta apenas 1 vaga livre.
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('yard')}
            className="font-semibold text-amber-900 hover:underline"
          >
            Gerenciar Pátio →
          </button>
        </div>
      ) : null}

      {/* Primary KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Yard Capacity Metric */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Capacidade Pátio</span>
            <Warehouse className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {report.currentYardOccupancy}
            </span>
            <span className="text-sm font-semibold text-slate-400 font-mono">/ 8</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  report.currentYardOccupancy >= 8
                    ? 'bg-rose-600'
                    : report.currentYardOccupancy >= 6
                    ? 'bg-amber-500'
                    : 'bg-emerald-600'
                }`}
                style={{ width: `${Math.min(100, (report.currentYardOccupancy / 8) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex justify-between">
              <span>{freeYardSlots} vagas livres</span>
              <span className="font-mono font-semibold">{report.yardUtilizationPct}% ocupado</span>
            </p>
          </div>
        </div>

        {/* Docks Metric */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Docas em Operação</span>
            <Container className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {report.currentDocksInOperation}
            </span>
            <span className="text-sm font-semibold text-slate-400 font-mono">/ 14</span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(report.currentDocksInOperation / 14) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex justify-between">
              <span>{freeDocks} docas livres</span>
              <span className="font-mono font-semibold">{report.dockUtilizationPct}% ocupado</span>
            </p>
          </div>
        </div>

        {/* Average Durations KPI */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tempos Médios</span>
            <Timer className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Espera na fila:</span>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {report.avgWaitTimeMinutes} min
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Descarregamento:</span>
              <span className="font-mono font-bold text-slate-800 tabular-nums">
                {report.avgUnloadingTimeMinutes} min
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-700 font-medium">Permanência Total:</span>
              <span className="font-mono font-bold text-emerald-700 tabular-nums">
                {report.avgTotalDwellMinutes} min
              </span>
            </div>
          </div>
        </div>

        {/* Punctuality / SLA */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pontualidade (SLA)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
              {report.punctualityRate}%
            </span>
          </div>
          <div className="mt-2 space-y-1 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>No horário:</span>
              <span className="font-mono font-semibold text-emerald-700">{report.onTimeCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Atrasados:</span>
              <span className="font-mono font-semibold text-rose-600">+{report.delayedCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Antecipados:</span>
              <span className="font-mono font-semibold text-blue-600">{report.earlyCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8-Stage Flow Ribbon */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Fluxo Completo dos 32 Caminhões do Dia
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {completedCount} finalizados de 32 previstos
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
            <span className="text-[11px] text-slate-500 block">1. Agendados</span>
            <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {scheduledCount}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Aguardando chegada</span>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
            <span className="text-[11px] text-slate-500 block">2. No Pátio</span>
            <span className={`text-lg font-bold font-mono tabular-nums ${inYardCount >= 8 ? 'text-rose-600' : 'text-slate-900'}`}>
              {inYardCount}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Vagas P-01 a P-08</span>
          </div>

          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
            <span className="text-[11px] text-amber-800 block">3. Fila de Espera</span>
            <span className="text-lg font-bold font-mono text-amber-900 tabular-nums">
              {inQueueCount}
            </span>
            <span className="text-[10px] text-amber-700 block mt-0.5">Aguardando doca</span>
          </div>

          <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50">
            <span className="text-[11px] text-blue-800 block">4. Em Descarregamento</span>
            <span className="text-lg font-bold font-mono text-blue-900 tabular-nums">
              {inDockCount}
            </span>
            <span className="text-[10px] text-blue-700 block mt-0.5">Docas 01 a 14</span>
          </div>

          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-emerald-800 block">5. Finalizados / Saída</span>
            <span className="text-lg font-bold font-mono text-emerald-900 tabular-nums">
              {completedCount}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">Saída concluída</span>
          </div>
        </div>
      </div>

      {/* Hourly Yard Load Histogram & Docks Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Yard Overlap Load */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ocupação Simultânea do Pátio por Horário (Limite: 8)
              </h3>
              <p className="text-xs text-slate-500">
                Calculado pela sobreposição exata dos períodos de permanência no CD Move Log
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
                <span className="text-slate-600">Normal (&le;6)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                <span className="text-slate-600">Alerta (7)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-rose-600" />
                <span className="text-slate-600">Capacidade Máx (8)</span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="space-y-2.5">
            {hourlyLoad.map((item) => (
              <div key={item.hour} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-mono font-medium text-slate-600 shrink-0">
                  {item.hour}
                </span>

                <div className="flex-1 bg-slate-100 rounded-md h-6 overflow-hidden relative flex items-center">
                  {item.isBlocked ? (
                    <div className="w-full h-full bg-slate-200/80 flex items-center justify-center text-[10px] font-semibold text-slate-600 tracking-wide uppercase">
                      11:00 – 12:00 Bloqueado (Intervalo Almoço Operacional)
                    </div>
                  ) : (
                    <>
                      <div
                        className={`h-full rounded-md transition-all duration-300 ${
                          item.count >= 8
                            ? 'bg-rose-600'
                            : item.count >= 7
                            ? 'bg-amber-500'
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, (item.count / 8) * 100)}%` }}
                      />
                      <span className="absolute left-2 text-[11px] font-mono font-bold text-white drop-shadow-xs">
                        {item.count > 0 && `${item.count} caminhões`}
                      </span>
                    </>
                  )}
                </div>

                <span className="w-14 text-right font-mono text-slate-500 shrink-0 text-[11px]">
                  {item.isBlocked ? 'BLOQUEADO' : `${item.count}/8`}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Regra de ouro: Agendamentos que ultrapassam 8 veículos no mesmo minuto são automaticamente bloqueados.</span>
            <button
              onClick={() => onNavigateTab('appointments')}
              className="text-slate-800 font-semibold hover:underline"
            >
              Novo Agendamento →
            </button>
          </div>
        </div>

        {/* Live Active Dock Grid Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Mapa das 14 Docas</h3>
            <button
              onClick={() => onNavigateTab('docks')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              Ver todas →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
            {docks.map((dock) => {
              const assignedApp = appointments.find((a) => a.id === dock.currentAppointmentId);
              return (
                <div
                  key={dock.id}
                  className={`p-2.5 rounded-lg border text-xs transition-colors ${
                    dock.isMaintenance
                      ? 'border-slate-200 bg-slate-100/80 text-slate-500'
                      : dock.status === 'EM_OPERACAO'
                      ? 'border-blue-200 bg-blue-50/40 text-blue-900'
                      : dock.status === 'AGUARDANDO_VEICULO'
                      ? 'border-amber-200 bg-amber-50/40 text-amber-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span>{dock.name}</span>
                    <span className="text-[10px] font-sans font-semibold">
                      {dock.isMaintenance
                        ? 'Manutenção'
                        : dock.status === 'EM_OPERACAO'
                        ? `${dock.progressPercentage}%`
                        : dock.status === 'AGUARDANDO_VEICULO'
                        ? 'Aguardando'
                        : 'Livre'}
                    </span>
                  </div>

                  {dock.status === 'EM_OPERACAO' && assignedApp ? (
                    <div className="mt-1 text-[11px]">
                      <p className="font-semibold text-slate-900 truncate">{assignedApp.vehiclePlate}</p>
                      <p className="text-slate-500 truncate text-[10px]">{assignedApp.cargoType}</p>
                      <div className="w-full bg-blue-100 rounded-full h-1 mt-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full"
                          style={{ width: `${dock.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1 truncate">
                      {dock.isMaintenance ? dock.maintenanceReason : dock.cargoSpecialty}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <span className="text-xs text-slate-500">
              Docas climatizadas: <strong>D-01 e D-02</strong> (Perecíveis)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
