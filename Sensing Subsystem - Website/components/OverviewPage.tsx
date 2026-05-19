'use client';
import { useState } from 'react';
import { MOCK_BUOYS, ALL_READINGS } from '@/lib/mockData';
import BuoyDetailModal from './modals/BuoyDetailModal';
import type { Buoy } from '@/types';

function StatCard({ label, value, unit, color, icon }: { label: string; value: string | number; unit?: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-[#64748b] text-xs uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-white">
        {value}
        {unit && <span className="text-sm text-[#64748b] ml-1 font-normal">{unit}</span>}
      </p>
    </div>
  );
}

function StatusDot({ status }: { status: Buoy['status'] }) {
  const colors = { active: 'bg-emerald-400', warning: 'bg-amber-400', inactive: 'bg-[#334155]' };
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === 'active' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[status]}`} />
    </span>
  );
}

function BatteryBar({ level }: { level: number }) {
  const color = level > 50 ? 'bg-emerald-400' : level > 20 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#1e3a5f] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${level}%` }} />
      </div>
      <span className="text-xs text-[#64748b] w-8 text-right">{level}%</span>
    </div>
  );
}

export default function OverviewPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [selectedBuoy, setSelectedBuoy] = useState<Buoy | null>(null);

  const activeCount = MOCK_BUOYS.filter((b) => b.status === 'active').length;
  const warningCount = MOCK_BUOYS.filter((b) => b.status === 'warning').length;
  const totalReadings = MOCK_BUOYS.reduce((s, b) => s + b.totalReadings, 0);

  const latestReadings = MOCK_BUOYS.map((b) => {
    const readings = ALL_READINGS[b.id] ?? [];
    return readings[readings.length - 1];
  }).filter(Boolean);

  const avgTemp = (latestReadings.reduce((s, r) => s + r.temperature, 0) / latestReadings.length).toFixed(1);
  const avgSal = (latestReadings.reduce((s, r) => s + r.salinity, 0) / latestReadings.length).toFixed(2);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Mono', monospace" }}>
          Fleet Overview
        </h1>
        <p className="text-[#64748b] text-sm mt-1">
          Real-time status of all deployed Blue Metric buoys · Updated {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Active Buoys"
          value={activeCount}
          unit={`/ ${MOCK_BUOYS.length}`}
          color="bg-emerald-400/10 text-emerald-400"
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" /></svg>}
        />
        <StatCard
          label="Alerts"
          value={warningCount}
          unit="warnings"
          color="bg-amber-400/10 text-amber-400"
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>}
        />
        <StatCard
          label="Avg Temperature"
          value={avgTemp}
          unit="°C"
          color="bg-[#0ea5e9]/10 text-[#0ea5e9]"
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" /></svg>}
        />
        <StatCard
          label="Total Readings"
          value={totalReadings.toLocaleString()}
          color="bg-violet-400/10 text-violet-400"
          icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
        />
      </div>

      {/* Buoy table */}
      <div className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1e3a5f] flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Deployed Devices</h2>
          <button onClick={() => onNavigate('devices')} className="text-[#0ea5e9] text-xs hover:underline">
            Manage →
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e3a5f]">
              {['Device', 'Status', 'Position', 'Temperature', 'Salinity', 'Battery', 'Last Ping'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[#334155] text-[10px] uppercase tracking-wider font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_BUOYS.map((buoy, i) => {
              const latest = ALL_READINGS[buoy.id]?.at(-1);
              const minsAgo = Math.floor((Date.now() - new Date(buoy.lastSeen).getTime()) / 60000);
              return (
                <tr
                  key={buoy.id}
                  className="border-b border-[#1e3a5f]/50 hover:bg-[#0a1628] cursor-pointer transition-colors"
                  onClick={() => setSelectedBuoy(buoy)}
                >
                  <td className="px-6 py-4">
                    <p className="text-white text-sm font-medium">{buoy.name}</p>
                    <p className="text-[#334155] text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>{buoy.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <StatusDot status={buoy.status} />
                      <span className={`text-xs capitalize ${buoy.status === 'active' ? 'text-emerald-400' : buoy.status === 'warning' ? 'text-amber-400' : 'text-[#334155]'}`}>
                        {buoy.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#64748b] text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
                      {buoy.lat.toFixed(3)}, {buoy.lng.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#0ea5e9] text-sm font-medium">
                      {latest ? `${latest.temperature}°C` : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#64748b] text-sm">
                      {latest ? `${latest.salinity} PSU` : '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 min-w-30">
                    <BatteryBar level={buoy.batteryLevel} />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs ${minsAgo > 60 ? 'text-amber-400' : 'text-[#64748b]'}`}>
                      {minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedBuoy && (
        <BuoyDetailModal buoy={selectedBuoy} onClose={() => setSelectedBuoy(null)} onNavigate={onNavigate} />
      )}
    </div>
  );
}