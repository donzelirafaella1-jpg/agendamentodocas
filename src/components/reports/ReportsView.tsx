import React from 'react';
import { useTMS } from '../../context/TMSContext';
import {
  computeOperationalReport,
  getCarrierBreakdown,
  getCargoTypeBreakdown,
  getPriorityBreakdown,
  exportAppointmentsToCsv,
} from '../../services/reportService';
import {
  BarChart3,
  Download,
  Printer,
  Clock,
  Warehouse,
  Container,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Sun,
  Sunset,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { appointments, carriers, selectedDate } = useTMS();

  const report = computeOperationalReport(appointments, carriers, 14, 8);
  const carrierBreakdown = getCarrierBreakdown(appointments, carriers);
  const cargoBreakdown = getCargoTypeBreakdown(appointments);
  const priorityBreakdown = getPriorityBreakdown(appointments);

  const handleExportCsv = () => {
    exportAppointmentsToCsv(appointments, carriers);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Relatórios Gerenciais & Indicadores de Performance (KPIs)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            CD Move Log Louveira · Base integrada de atendimento, tempos médios e comparativo de turnos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500 block">SLA de Pontualidade</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {report.punctualityRate}%
            </span>
            <span className="text-xs text-slate-500">atendimento no prazo</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {report.onTimeCount} no horário · {report.delayedCount} atrasos
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500 block">Tempo Médio de Espera</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {report.avgWaitTimeMinutes}
            </span>
            <span className="text-xs text-slate-500">minutos na fila</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-2 font-medium">
            Meta: &le; 25 min (Cumprida)
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500 block">Tempo Médio Descarga</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {report.avgUnloadingTimeMinutes}
            </span>
            <span className="text-xs text-slate-500">minutos em doca</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Padrão Move Log: 45 min por veículo
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-medium text-slate-500 block">Permanência Total (Dwell Time)</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {report.avgTotalDwellMinutes}
            </span>
            <span className="text-xs text-slate-500">minutos totais no CD</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Portaria de entrada à liberação final
          </p>
        </div>
      </div>

      {/* COMPARATIVO MANHÃ X TARDE (07:00-11:00 vs 12:00-16:00) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Comparativo Operacional: Turno da Manhã vs Turno da Tarde
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Análise de concentração de cargas entre Turno 1 (07:00–11:00) e Turno 2 (12:00–16:00)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Morning Shift Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="font-bold text-slate-800 text-xs">Turno 1: Manhã (07:00 – 11:00)</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {report.morningTrucksCount} caminhões (53%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Permanência Média</span>
                <span className="font-mono font-bold text-slate-800">{report.morningAvgDwellMinutes} min</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Índice de Atrasos</span>
                <span className="font-mono font-bold text-slate-800">{report.morningDelayPct}%</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Maior concentração de cargas perecíveis e medicamentos nos primeiros horários.
            </p>
          </div>

          {/* Afternoon Shift Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sunset className="h-4 w-4 text-rose-500" />
                <span className="font-bold text-slate-800 text-xs">Turno 2: Tarde (12:00 – 16:00)</span>
              </div>
              <span className="font-mono font-bold text-slate-900 text-xs">
                {report.afternoonTrucksCount} caminhões (47%)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Permanência Média</span>
                <span className="font-mono font-bold text-slate-800">{report.afternoonAvgDwellMinutes} min</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Índice de Atrasos</span>
                <span className="font-mono font-bold text-slate-800">{report.afternoonDelayPct}%</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Predomínio de cargas secas, eletrônicos e peças industriais de grande porte.
            </p>
          </div>
        </div>
      </div>

      {/* Carrier Performance Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Performance & SLA por Transportadora
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {carriers.length} transportadoras parceiras
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Transportadora</th>
                <th className="py-3 px-3.5">CNPJ</th>
                <th className="py-3 px-3.5 text-center">Previstos</th>
                <th className="py-3 px-3.5 text-center">Concluídos</th>
                <th className="py-3 px-3.5 text-center">No Horário</th>
                <th className="py-3 px-3.5 text-center">Atrasos</th>
                <th className="py-3 px-3.5 text-right">Volume (Ton)</th>
                <th className="py-3 px-3.5 text-right">Pontualidade (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {carrierBreakdown.map((c) => (
                <tr key={c.carrierId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-slate-900">{c.tradeName}</td>
                  <td className="py-3 px-3.5 font-mono text-slate-500">{c.cnpj}</td>
                  <td className="py-3 px-3.5 text-center font-mono font-medium">{c.scheduledTrucks}</td>
                  <td className="py-3 px-3.5 text-center font-mono font-medium text-emerald-700">{c.completed}</td>
                  <td className="py-3 px-3.5 text-center font-mono font-medium text-slate-800">{c.onTime}</td>
                  <td className="py-3 px-3.5 text-center font-mono font-medium text-rose-600">
                    {c.delayed > 0 ? `+${c.delayed}` : '0'}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono font-semibold">{c.totalVolumeTons} t</td>
                  <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                    {c.punctualityRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cargo Type & Priority Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cargo Type Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Distribuição por Tipo de Carga
          </h3>
          <div className="space-y-2">
            {cargoBreakdown.map((item) => (
              <div key={item.cargoType} className="space-y-1 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-800">{item.cargoType}</span>
                  <span className="font-mono text-slate-500">
                    {item.truckCount} caminhões ({item.totalTons}t)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-slate-900 h-1.5 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Distribuição por Criticidade / Prioridade
          </h3>
          <div className="space-y-3">
            {priorityBreakdown.map((p) => (
              <div key={p.key} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50">
                <span className={`font-semibold ${p.color}`}>{p.label}</span>
                <span className="font-mono font-bold text-slate-900">{p.count} agendamentos</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
