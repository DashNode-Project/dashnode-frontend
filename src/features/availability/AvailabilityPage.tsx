import { useState } from 'react';
import { Clock, Users, CalendarPlus } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { WeeklyGrid } from './components/WeeklyGrid';
import { TeamAvailabilityGrid } from './components/TeamAvailabilityGrid';
import { ScheduleMeetingSection } from './components/ScheduleMeetingSection';

type Tab = 'mine' | 'team' | 'schedule';

export default function AvailabilityPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('mine');

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-[#F9FAFB]">Disponibilidad</h1>
        <p className="text-xs text-[#9CA3AF] mt-1">
          Visualiza las franjas libres del equipo y agenda reuniones desde los bloques disponibles.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('mine')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'mine'
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
          }`}
        >
          <Clock size={14} />
          Mi disponibilidad
        </button>

        {canManage && (
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'team'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
            }`}
          >
            <Users size={14} />
            Equipo
          </button>
        )}

        {canManage && (
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
            }`}
          >
            <CalendarPlus size={14} />
            Agendar reunión
          </button>
        )}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'mine' && <WeeklyGrid />}
        {activeTab === 'team' && <TeamAvailabilityGrid />}
        {activeTab === 'schedule' && <ScheduleMeetingSection />}
      </div>
    </div>
  );
}
