'use client';
import { useState } from 'react';
import { MOCK_BUOYS, ALL_READINGS } from '@/lib/mockData';
import type { Buoy } from '@/types';
import BuoyDetailModal from './modals/BuoyDetailModal';

function StatusBadge({ status }: { status: Buoy['status'] }) {
  const styles = {
    active: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
    warning: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
    inactive: 'bg-[#1e3a5f] text-[#64748b] border-[#1e3a5f]',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
}

function SignalBars({ strength }: { strength: number }) {
  // strength is negative dBm, -80 is good, -120 is bad
  const quality = Math.max(0, Math.min(4, Math.round((strength + 120) / 10)));
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          className={`w-1.5 rounded-sm ${bar <= quality ? 'bg-[#0ea5e9]' : 'bg-[#1e3a5f]'}`}
          style={{ height: `${bar * 25}%` }}
        />
      ))}
    </div>
  );
}

export default function DevicesPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [selectedBuoy, setSelectedBuoy] = useState<Buoy | null>(null);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Mono', monospace" }}>Device Fleet</h1>
          <p className="text-[#64748b] text-sm mt-1">Manage and monitor all buoys in the fleet</p>
        </div>
        <div className="flex items-center gap-2 text-[#64748b] text-xs bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl px-4 py-2">
          <span className="text-emerald-400 font-bold">{MOCK_BUOYS.filter(b=>b.status==='active').length}</span> active
          <span className="text-[#1e3a5f]">·</span>
          <span className="text-amber-400 font-bold">{MOCK_BUOYS.filter(b=>b.status==='warning').length}</span> warning
          <span className="text-[#1e3a5f]">·</span>
          <span className="text-[#334155] font-bold">{MOCK_BUOYS.filter(b=>b.status==='inactive').length}</span> offline
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {MOCK_BUOYS.map((buoy) => {
          const readings = ALL_READINGS[buoy.id] ?? [];
          const latest = readings.at(-1);
          const deployedDays = Math.floor((Date.now() - new Date(buoy.deployedAt).getTime()) / (1000 * 60 * 60 * 24));
          const minsAgo = Math.floor((Date.now() - new Date(buoy.lastSeen).getTime()) / 60000);

          return (
            <div
              key={buoy.id}
              className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-2xl p-5 hover:border-[#0ea5e9]/30 transition-all cursor-pointer"
              onClick={() => setSelectedBuoy(buoy)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-semibold text-sm">{buoy.name}</p>
                  <p className="text-[#334155] text-xs mt-0.5" style={{ fontFamily: "'Space Mono', monospace" }}>{buoy.id}</p>
                </div>
                <StatusBadge status={buoy.status} />
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-[#060c18] rounded-xl p-3 text-center">
                  <p className="text-[#0ea5e9] font-bold text-lg">{latest?.temperature?.toFixed(1) ?? '—'}°</p>
                  <p className="text-[#334155] text-[10px]">Temp</p>
                </div>
                <div className="bg-[#060c18] rounded-xl p-3 text-center">
                  <p className="text-violet-400 font-bold text-lg">{latest?.salinity?.toFixed(1) ?? '—'}</p>
                  <p className="text-[#334155] text-[10px]">PSU</p>
                </div>
                <div className="bg-[#060c18] rounded-xl p-3 text-center">
                  <p className="text-emerald-400 font-bold text-lg">{(latest?.tds ? (latest.tds / 1000).toFixed(1) : '—')}k</p>
                  <p className="text-[#334155] text-[10px]">TDS mg/L</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#64748b] text-xs">Battery</span>
                  <div className="flex items-center gap-2 flex-1 ml-4">
                    <div className="flex-1 h-1.5 bg-[#1e3a5f] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${buoy.batteryLevel > 50 ? 'bg-emerald-400' : buoy.batteryLevel > 20 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${buoy.batteryLevel}%` }}
                      />
                    </div>
                    <span className="text-xs text-white w-8 text-right">{buoy.batteryLevel}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#64748b] text-xs">Position</span>
                  <span className="text-[#64748b] text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>
                    {buoy.lat.toFixed(4)}°, {buoy.lng.toFixed(4)}°
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#64748b] text-xs">Last seen</span>
                  <span className={`text-xs ${minsAgo > 60 ? 'text-amber-400' : 'text-[#64748b]'}`}>
                    {minsAgo < 60 ? `${minsAgo} min ago` : `${Math.floor(minsAgo/60)}h ago`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#64748b] text-xs">Deployed</span>
                  <span className="text-[#64748b] text-xs">{deployedDays} days · {buoy.totalReadings.toLocaleString()} readings</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#64748b] text-xs">Firmware</span>
                  <span className="text-[#334155] text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>{buoy.firmwareVersion}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1e3a5f] flex gap-2">
                <button className="flex-1 py-2 rounded-xl text-xs border border-[#1e3a5f] text-[#64748b] hover:text-white hover:border-[#0ea5e9]/30 transition-colors">
                  View Details
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onNavigate('data'); }}
                  className="flex-1 py-2 rounded-xl text-xs bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/20 transition-colors"
                >
                  View Data →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedBuoy && (
        <BuoyDetailModal buoy={selectedBuoy} onClose={() => setSelectedBuoy(null)} onNavigate={onNavigate} />
      )}
    </div>
  );
}