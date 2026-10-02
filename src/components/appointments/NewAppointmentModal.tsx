import React, { useState, useEffect } from 'react';
import { useTMS } from '../../context/TMSContext';
import { CargoType, PriorityLevel, VehicleType } from '../../types';
import { OverrideConfirmModal } from './OverrideConfirmModal';
import { 
  X, 
  Calendar, 
  Clock, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CARGO_TYPES: CargoType[] = [
  'Perecíveis Refrigerados',
  'Farmacêuticos',
  'Carga Geral',
  'Alimentos Secos',
  'Eletrônicos & Alto Valor',
  'Peças Industriais',
  'Bebidas & Embalagens',
];

const VEHICLE_TYPES: VehicleType[] = [
  'Carreta LS',
  'Carreta Baú',
  'Truck',
  'Bitrem',
  'Toco',
  'VUC',
];

const PRIORITIES: { label: string; value: PriorityLevel }[] = [
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Alta Prioridade', value: 'ALTA' },
  { label: 'Urgente / Perecível', value: 'URGENTE_PERECIVEL' },
  { label: 'Farmacêutico / ANVISA', value: 'FARMA_CONTROLADO' },
  { label: 'Baixa', value: 'BAIXA' },
];

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ isOpen, onClose }) => {
  const {
    selectedDate,
    carriers,
    drivers,
    docks,
    createAppointment,
    checkCapacity,
  } = useTMS();

  // Form states
  const [windowStart, setWindowStart] = useState('09:30');
  const [estimatedDuration, setEstimatedDuration] = useState(45);
  const [carrierId, setCarrierId] = useState(carriers[0]?.id || '');
  const [driverId, setDriverId] = useState(drivers[0]?.id || '');
  const [vehiclePlate, setVehiclePlate] = useState('BRA9E99');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Carreta Baú');
  const [cargoType, setCargoType] = useState<CargoType>('Perecíveis Refrigerados');
  const [cargoWeightKg, setCargoWeightKg] = useState(15000);
  const [priority, setPriority] = useState<PriorityLevel>('URGENTE_PERECIVEL');
  const [invoiceNumber, setInvoiceNumber] = useState('NFE-99412');
  const [assignedDockId, setAssignedDockId] = useState<number | undefined>(1);
  const [notes, setNotes] = useState('');

  // Capacity validation result
  const [validation, setValidation] = useState(() =>
    checkCapacity('09:30', 45)
  );

  // Override modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ isError: boolean; text: string } | null>(null);

  // Revalidate whenever windowStart or duration changes
  useEffect(() => {
    const result = checkCapacity(windowStart, estimatedDuration);
    setValidation(result);
  }, [windowStart, estimatedDuration, checkCapacity]);

  if (!isOpen) return null;

  const handleSlotSelect = (slotTime: string) => {
    setWindowStart(slotTime);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitFeedback(null);

    // If capacity check fails, prompt override modal
    if (!validation.isValid) {
      if (validation.isBlockedLunchTime) {
        setSubmitFeedback({
          isError: true,
          text: validation.message,
        });
        return;
      }
      setShowOverrideModal(true);
      return;
    }

    // Normal valid submission
    const res = createAppointment({
      windowStart,
      estimatedDurationMinutes: estimatedDuration,
      estimatedStayMinutes: estimatedDuration + 15,
      carrierId,
      driverId,
      vehiclePlate: vehiclePlate.toUpperCase().trim(),
      vehicleType,
      cargoType,
      cargoWeightKg,
      priority,
      invoiceNumber,
      assignedDockId: assignedDockId ? Number(assignedDockId) : undefined,
      notes,
    });

    if (res.success) {
      onClose();
    } else {
      setSubmitFeedback({ isError: true, text: res.message });
    }
  };

  const handleConfirmOverride = (justification: string) => {
    setShowOverrideModal(false);
    const res = createAppointment(
      {
        windowStart,
        estimatedDurationMinutes: estimatedDuration,
        estimatedStayMinutes: estimatedDuration + 15,
        carrierId,
        driverId,
        vehiclePlate: vehiclePlate.toUpperCase().trim(),
        vehicleType,
        cargoType,
        cargoWeightKg,
        priority,
        invoiceNumber,
        assignedDockId: assignedDockId ? Number(assignedDockId) : undefined,
        notes,
      },
      true, // isOverride
      justification
    );

    if (res.success) {
      onClose();
    } else {
      setSubmitFeedback({ isError: true, text: res.message });
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Novo Agendamento de Caminhão</h2>
              <p className="text-xs text-slate-500">
                CD Move Log · Validação de capacidade em tempo real (Máx 8 veículos simultâneos)
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* CAPACITY ENGINE VALIDATION CARD */}
            <div
              className={`p-3.5 rounded-xl border text-xs transition-colors ${
                !validation.isValid
                  ? validation.isBlockedLunchTime
                    ? 'border-amber-300 bg-amber-50/90 text-amber-900'
                    : 'border-rose-300 bg-rose-50/90 text-rose-900'
                  : 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {!validation.isValid ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-xs">
                    {validation.message}
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Janela calculada: {windowStart} até {(Number(windowStart.split(':')[0]) * 60 + Number(windowStart.split(':')[1]) + estimatedDuration + 15) ? 'tempo estimado com manobra' : ''}.
                    {validation.isValid && ` Pátio projetado: ${validation.peakOccupancy}/8 veículos simultâneos.`}
                  </p>

                  {/* Suggest alternative slots if capacity exceeded */}
                  {!validation.isValid && validation.suggestedAlternativeSlots.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-rose-200/70">
                      <span className="text-[11px] font-semibold block text-slate-800 mb-1">
                        Horários alternativos recomendados com vagas livres no pátio:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {validation.suggestedAlternativeSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => handleSlotSelect(slot)}
                            className="px-2.5 py-1 bg-white border border-slate-300 hover:border-slate-800 rounded font-mono font-bold text-slate-800 text-xs shadow-2xs hover:bg-slate-50 transition-colors"
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Time and Duration row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Horário de Início *
                </label>
                <input
                  type="time"
                  value={windowStart}
                  onChange={(e) => setWindowStart(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono font-medium focus:border-slate-900 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">07h-11h ou 12h-16h</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duração Descarga (min) *
                </label>
                <input
                  type="number"
                  min="20"
                  max="120"
                  step="5"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono font-medium focus:border-slate-900 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">+15 min permanência pátio</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prioridade Operacional *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vehicle & Plate */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Placa do Veículo *
                </label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                  placeholder="BRA2E19"
                  maxLength={8}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono font-bold text-slate-900 uppercase focus:border-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Veículo *
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                >
                  {VEHICLE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nota Fiscal (NF-e) *
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Carrier & Driver */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transportadora Parceira *
                </label>
                <select
                  value={carrierId}
                  onChange={(e) => setCarrierId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                >
                  {carriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tradeName} (SLA: {c.punctualityRate}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motorista Credenciado *
                </label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (CNH: Cat. {d.cnhCategory})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cargo Type & Dock */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipo de Carga *
                </label>
                <select
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value as CargoType)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                >
                  {CARGO_TYPES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peso Estimado (kg) *
                </label>
                <input
                  type="number"
                  step="100"
                  value={cargoWeightKg}
                  onChange={(e) => setCargoWeightKg(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono font-medium focus:border-slate-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Doca Preferencial (Opcional)
                </label>
                <select
                  value={assignedDockId || ''}
                  onChange={(e) => setAssignedDockId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-slate-900 focus:outline-none"
                >
                  <option value="">Alocação Automática</option>
                  {docks.map((d) => (
                    <option key={d.id} value={d.id} disabled={d.isMaintenance}>
                      {d.name} ({d.cargoSpecialty}) {d.isMaintenance ? '- Manutenção' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações Operacionais
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Exige conferência cega de lote e temperatura de transporte..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-slate-900 focus:outline-none"
              />
            </div>

            {submitFeedback && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold ${
                  submitFeedback.isError
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {submitFeedback.text}
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              {!validation.isValid && !validation.isBlockedLunchTime ? (
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(true)}
                  className="px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Liberar Manualmente com Sobrecarga</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs ${
                    !validation.isValid
                      ? 'bg-slate-400 cursor-pointer'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  Confirmar Agendamento
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Manual Override Confirmation Dialog */}
      <OverrideConfirmModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        onConfirm={handleConfirmOverride}
        warningMessage={validation.message}
        proposedTime={windowStart}
        vehiclePlate={vehiclePlate}
      />
    </>
  );
};
