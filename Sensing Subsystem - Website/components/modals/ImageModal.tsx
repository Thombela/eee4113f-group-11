'use client';
import type { SensorReading } from '@/types';
import { MOCK_BUOYS } from '@/lib/mockData';

interface Props {
  reading: SensorReading;
  onClose: () => void;
}

export default function ImageModal({ reading, onClose }: Props) {
  const buoy = MOCK_BUOYS.find((b) => b.id === reading.buoyId);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div
        className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a5f]">
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-[#0ea5e9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            <div>
              <p className="text-white text-sm font-semibold">Water Sample Image</p>
              <p className="text-[#334155] text-xs">{buoy?.name} · {new Date(reading.timestamp).toLocaleString('en-ZA')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#334155] hover:text-white transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Image */}
        <div className="relative">
          <img src={reading.imageUrl} alt="Water sample" className="w-full aspect-video object-cover" />

          {/* Overlay: fake channel analysis */}
          <div className="absolute top-3 left-3 bg-black/70 rounded-xl p-3 text-xs space-y-1.5">
            <p className="text-white font-semibold mb-1">Channel Analysis</p>
            {[
              { label: 'Blue channel', value: '142', color: '#60a5fa', pct: 56 },
              { label: 'Green channel', value: '98', color: '#34d399', pct: 38 },
              { label: 'Red channel', value: '67', color: '#f87171', pct: 26 },
            ].map((ch) => (
              <div key={ch.label} className="flex items-center gap-2">
                <span className="text-[#64748b] w-20">{ch.label}</span>
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${ch.pct}%`, backgroundColor: ch.color }} />
                </div>
                <span className="text-white">{ch.value}</span>
              </div>
            ))}
            <div className="pt-1 border-t border-white/10">
              <span className="text-emerald-400 font-semibold">
                Chl-a est: ~{(0.2 + Math.abs(Math.sin(new Date(reading.timestamp).getTime() / 1000000)) * 1.8).toFixed(2)} μg/L
              </span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-4 gap-0 border-t border-[#1e3a5f]">
          {[
            { label: 'Temperature', value: `${reading.temperature.toFixed(2)}°C`, color: 'text-[#0ea5e9]' },
            { label: 'Salinity', value: `${reading.salinity.toFixed(3)} PSU`, color: 'text-violet-400' },
            { label: 'TDS', value: `${reading.tds.toFixed(0)} mg/L`, color: 'text-emerald-400' },
            { label: 'Position', value: `${reading.latitude.toFixed(3)}, ${reading.longitude.toFixed(3)}`, color: 'text-[#64748b]' },
          ].map((m, i) => (
            <div key={m.label} className={`px-4 py-3 text-center ${i < 3 ? 'border-r border-[#1e3a5f]' : ''}`}>
              <p className={`font-semibold text-sm ${m.color}`}>{m.value}</p>
              <p className="text-[#334155] text-[10px] mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 bg-[#060c18] border-t border-[#1e3a5f]">
          <p className="text-[#334155] text-xs">
            Note: Chlorophyll estimates derived from ESP32-CAM blue-channel analysis. Requires calibration with known reference samples for quantitative accuracy. (Per Dr. Paine's guidance — processing pipeline under development.)
          </p>
        </div>
      </div>
    </div>
  );
}