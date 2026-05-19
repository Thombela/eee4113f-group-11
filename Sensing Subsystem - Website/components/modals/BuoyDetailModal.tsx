'use client';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ALL_READINGS, MOCK_BUOYS } from '@/lib/mockData';
import type { Buoy } from '@/types';

interface Props {
  buoy: Buoy;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export default function BuoyDetailModal({ buoy, onClose, onNavigate }: Props) {
  const readings = ALL_READINGS[buoy.id] ?? [];
  const latest = readings.at(-1);
  const last24 = useMemo(() => readings.slice(-24).map((r) => ({
    ...r,
    t: new Date(r.timestamp).getHours() + 'h',
  })), [readings]);

  const statusColors = { active: 'text-emerald-400', warning: 'text-amber-400', inactive: 'text-[#64748b]' };
  const minsAgo = Math.floor((Date.now() - new Date(buoy.lastSeen).getTime()) / 60000);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div
        className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[#1e3a5f]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs uppercase font-semibold ${statusColors[buoy.status]}`}>{buoy.status}</span>
              <span className="text-[#1e3a5f]">·</span>
              <span className="text-[#334155] text-xs" style={{ fontFamily: "'Space Mono', monospace" }}>{buoy.id}</span>
            </div>
            <h2 className="text-white text-xl font-bold">{buoy.name}</h2>
          </div>
          <button onClick={onClose} className="text-[#334155] hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Latest readings */}
          <div>
            <p className="text-[#64748b] text-xs uppercase tracking-wider mb-3">Latest Readings</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Temperature', value: `${latest?.temperature?.toFixed(2)}°C`, color: 'text-[#0ea5e9]' },
                { label: 'Salinity', value: `${latest?.salinity?.toFixed(3)} PSU`, color: 'text-violet-400' },
                { label: 'TDS', value: `${latest?.tds?.toFixed(0)} mg/L`, color: 'text-emerald-400' },
                { label: 'DO (est.)', value: `${latest?.dissolvedOxygen?.toFixed(2)} mg/L`, color: 'text-amber-400' },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#060c18] rounded-xl p-3 text-center">
                  <p className={`font-bold text-sm ${stat.color}`}>{latest ? stat.value : '—'}</p>
                  <p className="text-[#334155] text-[10px] mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mini temperature chart */}
          <div>
            <p className="text-[#64748b] text-xs uppercase tracking-wider mb-3">24h Temperature</p>
            <div className="bg-[#060c18] rounded-xl p-3">
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={last24}>
                  <XAxis dataKey="t" tick={{ fill: '#334155', fontSize: 9 }} tickLine={false} axisLine={false} interval={5} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#334155', fontSize: 9 }} tickLine={false} axisLine={false} width={35} />
                  <Tooltip
                    contentStyle={{ background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#64748b' }}
                    itemStyle={{ color: '#0ea5e9' }}
                  />
                  <Line type="monotone" dataKey="temperature" stroke="#0ea5e9" strokeWidth={2} dot={false} name="°C" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[#64748b] text-xs uppercase tracking-wider mb-2">Device Info</p>
              <div className="space-y-2 text-xs">
                {[
                  ['Position', `${buoy.lat.toFixed(4)}°, ${buoy.lng.toFixed(4)}°`],
                  ['Last Seen', minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo/60)}h ago`],
                  ['Deployed', new Date(buoy.deployedAt).toLocaleDateString('en-ZA')],
                  ['Total Readings', buoy.totalReadings.toLocaleString()],
                  ['Firmware', buoy.firmwareVersion],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-[#334155]">{k}</span>
                    <span className="text-[#64748b]" style={{ fontFamily: "'Space Mono', monospace" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#64748b] text-xs uppercase tracking-wider mb-2">Power & Signal</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#334155]">Battery</span>
                    <span className={buoy.batteryLevel > 50 ? 'text-emerald-400' : buoy.batteryLevel > 20 ? 'text-amber-400' : 'text-red-400'}>
                      {buoy.batteryLevel}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#060c18] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${buoy.batteryLevel > 50 ? 'bg-emerald-400' : buoy.batteryLevel > 20 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${buoy.batteryLevel}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#334155]">Signal (LoRa)</span>
                  <span className="text-[#64748b]">{buoy.signalStrength} dBm</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#334155]">Images captured</span>
                  <span className="text-[#64748b]">{readings.filter(r => r.imageUrl).length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-[#1e3a5f]">
            <button
              onClick={() => { onNavigate('data'); onClose(); }}
              className="flex-1 py-2.5 rounded-xl text-sm bg-[#0ea5e9]/10 border border-[#0ea5e9]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/20 transition-colors font-medium"
            >
              View Sensor Charts
            </button>
            <button
              onClick={() => { onNavigate('images'); onClose(); }}
              className="flex-1 py-2.5 rounded-xl text-sm border border-[#1e3a5f] text-[#64748b] hover:text-white hover:border-[#0ea5e9]/30 transition-colors"
            >
              View Imagery
            </button>
            <button
              onClick={() => { onNavigate('history'); onClose(); }}
              className="flex-1 py-2.5 rounded-xl text-sm border border-[#1e3a5f] text-[#64748b] hover:text-white hover:border-[#0ea5e9]/30 transition-colors"
            >
              Full History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}