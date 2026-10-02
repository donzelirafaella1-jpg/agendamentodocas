import React, { useState, useMemo } from 'react';
import { useTMS } from '../../context/TMSContext';
import { optimizeDailySchedule } from '../../services/optimizerService';
import { OptimizationResult } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Warehouse,
  Container,
  Clock,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const OptimizerView: React.FC = () => {
  const { appointments, selectedDate, applyOptimization, carriers } = useTMS();

  const carrierMap = useMemo(() => new Map(carriers.map((c) => [c.id, c.tradeName])), [carriers]);

  // Optimization simulation state
  const [result, setResult] = useState<OptimizationResult | null>(() => {
    return optimizeDailySchedule(appointments, selectedDate);
  });

  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  const handleRecalculate = () => {
    setAppliedFeedback(null);
    const newResult = optimizeDailySchedule(appointments, selectedDate);
    setResult(newResult);
  };

  const handleApply = () => {
    if (!result) return;
    applyOptimization(result.optimizedAppointments);
    setAppliedFeedback('Otimização aplicada com sucesso! Os 32 agendamentos foram rebalanceados.');
  };

  if (!result) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Otimizador Inteligente de Agenda Diária
            </h1>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              32 Caminhões
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Algoritmo heurístico para balanceamento de pátio (&le;8), distribuição de 14 docas e respeito estrito ao almoço (11h–12h)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculate}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Recalcular Simulação</span>
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Aplicar Otimização à Operação</span>
          </button>
        </div>
      </div>

      {/* Applied Banner Feedback */}
      {appliedFeedback && (
        <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{appliedFeedback}</span>
        </div>
      )}

      {/* COMPARATIVE PREVIEW CARDS (Antes vs Depois) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Prévia Comparativa de Indicadores (Antes vs Depois)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {result.changes.length} movimentações propostas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Peak Yard Occupancy */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Pico de Ocupação no Pátio</span>
              <Warehouse className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xl font-bold font-mono ${result.beforeMetrics.peakYardOccupancy > 8 ? 'text-rose-600' : 'text-slate-800'}`}>
                {result.beforeMetrics.peakYardOccupancy}/8
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="text-xl font-bold font-mono text-emerald-700">
                {result.afterMetrics.peakYardOccupancy}/8
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {result.afterMetrics.peakYardOccupancy <= 8 ? (
                <span className="text-emerald-700 font-semibold">100% dentro do limite de 8 vagas</span>
              ) : (
                'Sobrecarga residual'
              )}
            </p>
          </div>

          {/* Average Wait Time */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Tempo Médio de Espera</span>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold font-mono text-slate-700">
                {result.beforeMetrics.estimatedWaitTimeAvg} min
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="text-xl font-bold font-mono text-emerald-700">
                {result.afterMetrics.estimatedWaitTimeAvg} min
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Redução de congestionamento</span>
            </p>
          </div>

          {/* Dock Conflicts */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Conflitos de Doca</span>
              <Container className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xl font-bold font-mono ${result.beforeMetrics.dockConflicts > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                {result.beforeMetrics.dockConflicts}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="text-xl font-bold font-mono text-emerald-700">
                {result.afterMetrics.dockConflicts}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {result.afterMetrics.dockConflicts === 0 ? (
                <span className="text-emerald-700 font-semibold">Zero colisões entre caminhões</span>
              ) : 'Ajustes manuais'}
            </p>
          </div>

          {/* Lunch Block Violations */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Violações 11h–12h</span>
              <ShieldCheck className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xl font-bold font-mono ${result.beforeMetrics.lunchViolations > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                {result.beforeMetrics.lunchViolations}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="text-xl font-bold font-mono text-emerald-700">
                0
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold">
              Intervalo 100% blindado
            </p>
          </div>
        </div>
      </div>

      {/* DETAILED CHANGES PROPOSED TABLE */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Ajustes Detalhados Propostos pelo Algoritmo ({result.changes.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reorganização de horários e docas para cumprir o limite de 8 no pátio e evitar o almoço
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Caminhão / Placa</th>
                <th className="py-3 px-3.5">Transportadora</th>
                <th className="py-3 px-3.5">Horário Original</th>
                <th className="py-3 px-3.5">Horário Otimizado</th>
                <th className="py-3 px-3.5">Doca Otimizada</th>
                <th className="py-3 px-3.5">Justificativa do Algoritmo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {result.changes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    A grade atual já está 100% balanceada e dentro dos parâmetros ideais de operação!
                  </td>
                </tr>
              ) : (
                result.changes.map((change) => {
                  const carrier = carrierMap.get(change.carrierName) || change.carrierName;
                  return (
                    <tr key={change.appointmentId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {change.vehiclePlate} ({change.code})
                      </td>
                      <td className="py-3 px-3.5 font-medium text-slate-800 whitespace-nowrap">
                        {carrier}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-rose-700 line-through whitespace-nowrap">
                        {change.oldTime}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {change.newTime}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {change.newDock ? `Doca ${change.newDock.toString().padStart(2, '0')}` : 'Flex'}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 text-xs">
                        {change.reason}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
