import React, { useState } from 'react';
import { TMSProvider, useTMS } from './context/TMSContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { AppointmentsView } from './components/appointments/AppointmentsView';
import { ScheduleView } from './components/schedule/ScheduleView';
import { OptimizerView } from './components/optimizer/OptimizerView';
import { YardView } from './components/yard/YardView';
import { DocksView } from './components/docks/DocksView';
import { QueueView } from './components/queue/QueueView';
import { CheckInView } from './components/checkin/CheckInView';
import { CarriersView } from './components/carriers/CarriersView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

const TMSAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const { resetToInitialDemo } = useTMS();

  const handleResetDemo = () => {
    if (confirm('Deseja restaurar a base de demonstração do Move Log TMS com 32 caminhões e dados operacionais?')) {
      resetToInitialDemo();
      setActiveTab('dashboard');
    }
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigateTab={(tab: NavTab) => setActiveTab(tab)} />;
      case 'appointments':
        return <AppointmentsView />;
      case 'schedule':
        return <ScheduleView />;
      case 'optimizer':
        return <OptimizerView />;
      case 'yard':
        return <YardView />;
      case 'docks':
        return <DocksView />;
      case 'queue':
        return <QueueView />;
      case 'checkin':
        return <CheckInView />;
      case 'carriers':
        return <CarriersView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigateTab={(tab: NavTab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col">
      {/* Top Header */}
      <Header onResetDemo={handleResetDemo} />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dynamic Viewport Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <TMSProvider>
      <TMSAppContent />
    </TMSProvider>
  );
}
