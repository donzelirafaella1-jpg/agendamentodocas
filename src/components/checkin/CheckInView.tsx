import React, { useState } from 'react';
import { useTMS } from '../../context/TMSContext';
import { timeToMinutes } from '../../services/yardCapacityService';
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  ShieldCheck,
  FileCheck,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

export const CheckInView: React.FC = () => {
  const {
    appointments,
    carriers,
    drivers,
    yardSlots,
    performCheckIn,
    currentTimeStr,
  } = useTMS();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [cnhChecked, setCnhChecked] = useState(true);
  const [sealChecked, setSealChecked] = useState(true);
  const [portariaNotes, setPortariaNotes] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  const carrierMap = new Map(carriers.map((c) => [c.id, c.tradeName]));
  const driverMap = new Map(drivers.map((d) => [d.id, d.name]));

  // Vehicles pending check-in (status === 'AGENDADO')
  const pendingAppointments = appointments.filter(
    (a) => a.status === 'AGENDADO'
  );

  const filteredPending = pendingAppointments.filter(
    (a) =>
      a.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedApp = appointments.find((a) => a.id === selectedAppId);

  // Calculate live deviation for selected appointment
  let deviationMinutes = 0;
  let deviationLabel = 'Pontual';
  if (selectedApp) {
    const scheduledM = timeToMinutes(selectedApp.windowStart);
    const currentM = timeToMinutes(currentTimeStr);
    deviationMinutes = currentM - scheduledM;
    if (deviationMinutes > 10) {
      deviationLabel = `Atrasado (+${deviationMinutes} min)`;
    } else if (deviationMinutes < -10) {
      deviationLabel = `Antecipado (${Math.abs(deviationMinutes)} min antes)`;
    } else {
      deviationLabel = `No Horário (${deviationMinutes >= 0 ? `+${deviationMinutes}` : deviationMinutes} min)`;
    }
  }

  const handleExecuteCheckIn = () => {
    if (!selectedAppId) return;

    if (!cnhChecked || !sealChecked) {
      setFeedback({
        isError: true,
        message: 'Atenção: A conferência de CNH do motorista e integridade do lacre são obrigatórias para entrada!',
      });
      return;
    }

    const res = performCheckIn(selectedAppId, portariaNotes);
    setFeedback({
      isError: !res.success,
      message: res.message,
    });

    if (res.success) {
      setSelectedAppId(null);
      setPortariaNotes('');
    }
  };

  const freeYardSlotsCount = 8 - yardSlots.filter((s) => s.isOccupied).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Portaria Principal & Check-in de Chegada
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de entrada de veículos, cálculo automático de pontualidade/atraso e direcionamento ao pátio
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Horário atual da Portaria:</span>
          <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
            {currentTimeStr}
          </span>
          <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
            Vagas livres no pátio: <strong className="text-emerald-700">{freeYardSlotsCount}/8</strong>
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            feedback.isError
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {feedback.isError ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Search & Pending Trucks */}
        <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Caminhões Previstos ({filteredPending.length})
            </h3>
            <span className="text-[11px] text-slate-400">Aguardando Portaria</span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Digite a placa ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 font-mono"
            />
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredPending.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum veículo aguardando check-in no filtro atual.
              </div>
            ) : (
              filteredPending.map((app) => {
                const carrier = carrierMap.get(app.carrierId);
                const isSelected = selectedAppId === app.id;
                return (
                  <button
                    key={app.id}
                    onClick={() => {
                      setSelectedAppId(app.id);
                      setFeedback(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                      isSelected
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-sm">{app.vehiclePlate}</span>
                      <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {app.windowStart}
                      </span>
                    </div>

                    <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-200' : 'text-slate-600'}`}>
                      {carrier} · {app.cargoType}
                    </p>

                    <div className={`mt-1.5 pt-1.5 border-t flex justify-between text-[10px] ${
                      isSelected ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-400'
                    }`}>
                      <span>NF: {app.invoiceNumber}</span>
                      <span>Doca: {app.assignedDockId ? `D-${app.assignedDockId.toString().padStart(2, '0')}` : 'Flex'}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Check-in Terminal & Calculation */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          {selectedApp ? (
            <div className="space-y-5">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase">
                    Terminal de Entrada
                  </span>
                  <h2 className="text-lg font-bold font-mono text-slate-900">
                    {selectedApp.vehiclePlate} · {selectedApp.code}
                  </h2>
                </div>

                {/* Auto Calculated Delay / Advance Gauge */}
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Desvio Detectado:</span>
                  <span
                    className={`text-sm font-bold font-mono ${
                      deviationMinutes > 10
                        ? 'text-rose-600'
                        : deviationMinutes < -10
                        ? 'text-blue-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {deviationLabel}
                  </span>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-slate-400 text-[10px] block">Transportadora</span>
                  <span className="font-semibold text-slate-800">
                    {carrierMap.get(selectedApp.carrierId)}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-slate-400 text-[10px] block">Motorista</span>
                  <span className="font-semibold text-slate-800">
                    {driverMap.get(selectedApp.driverId)}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-slate-400 text-[10px] block">Tipo de Carga</span>
                  <span className="font-semibold text-slate-800">{selectedApp.cargoType}</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-slate-400 text-[10px] block">Peso da Carga</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {(selectedApp.cargoWeightKg / 1000).toFixed(1)} toneladas
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-slate-400 text-[10px] block">Horário Previsto</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedApp.windowStart} - {selectedApp.windowEnd}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                  <span className="text-slate-400 text-[10px] block">Doca Programada</span>
                  <span className="font-mono font-bold text-slate-800">
                    {selectedApp.assignedDockId ? `Doca ${selectedApp.assignedDockId.toString().padStart(2, '0')}` : 'A definir'}
                  </span>
                </div>
              </div>

              {/* Security & Gate Inspection Checklist */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Checklist Obrigatório de Portaria</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={cnhChecked}
                      onChange={(e) => setCnhChecked(e.target.checked)}
                      className="rounded text-slate-900 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800">CNH & Documento do Motorista Válidos</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-white border border-slate-200">
                    <input
                      type="checkbox"
                      checked={sealChecked}
                      onChange={(e) => setSealChecked(e.target.checked)}
                      className="rounded text-slate-900 focus:ring-0"
                    />
                    <span className="font-medium text-slate-800">Lacre Intacto & NF-e Conferida</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Anotações da Portaria / Ocorrências
                  </label>
                  <input
                    type="text"
                    value={portariaNotes}
                    onChange={(e) => setPortariaNotes(e.target.value)}
                    placeholder="Ex: Veículo liberado na balança, temperatura do baú a 4°C conferida..."
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Destination info */}
              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/50 text-blue-900 text-xs flex items-center justify-between">
                <span>
                  {freeYardSlotsCount > 0 ? (
                    <>
                      Vagas disponíveis no pátio. O veículo será direcionado para uma das <strong>8 vagas físicas</strong>.
                    </>
                  ) : (
                    <>
                      <strong>Atenção:</strong> Pátio atualmente com 8/8 veículos. O veículo será colocado na <strong>Fila de Retenção Externa</strong>.
                    </>
                  )}
                </span>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCheckIn}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Concluir Check-in e Liberar Entrada</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs">
              <Truck className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600 text-sm">Nenhum caminhão selecionado</p>
              <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                Selecione um dos veículos previstos na coluna ao lado para abrir a conferência de portaria e registrar a entrada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
