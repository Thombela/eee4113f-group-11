'use client';
import { useState, useMemo } from 'react';
import { MOCK_BUOYS, ALL_READINGS } from '@/lib/mockData';
import type { SensorReading } from '@/types';
import ImageModal from './modals/ImageModal';

export default function ImageryPage() {
  const [selectedBuoyId, setSelectedBuoyId] = useState('all');
  const [imageReading, setImageReading] = useState<SensorReading | null>(null);

  const imageReadings = useMemo(() => {
    const buoys = selectedBuoyId === 'all' ? MOCK_BUOYS.map((b) => b.id) : [selectedBuoyId];
    return buoys
      .flatMap((id) => ALL_READINGS[id] ?? [])
      .filter((r) => r.imageUrl)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [selectedBuoyId]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Mono', monospace" }}>Water Imagery</h1>
          <p className="text-[#64748b] text-sm mt-1">
            ESP32-CAM captures every 6 hours · Used for chlorophyll estimation via image analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[#64748b] text-xs">Device:</span>
          <select
            value={selectedBuoyId}
            onChange={(e) => setSelectedBuoyId(e.target.value)}
            className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="all">All Devices</option>
            {MOCK_BUOYS.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[#0d1b2e] border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
        <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-amber-400/80 text-xs">
          Images are processed post-capture using blue-channel wavelength filtering to estimate chlorophyll-a concentration. 
          Each image is captured at the same depth and lighting conditions where possible.
        </p>
      </div>

      <div className="text-[#64748b] text-xs">{imageReadings.length} images captured</div>

      {/* Gallery grid */}
      <div className="grid grid-cols-3 gap-4">
        {imageReadings.map((r) => {
          const buoy = MOCK_BUOYS.find((b) => b.id === r.buoyId);
          const ts = new Date(r.timestamp);
          return (
            <button
              key={r.id}
              onClick={() => setImageReading(r)}
              className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-2xl overflow-hidden hover:border-[#0ea5e9]/40 transition-all group text-left"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={r.imageUrl}
                  alt={`Water sample ${r.id}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0d1b2e] to-transparent opacity-60" />
                <div className="absolute bottom-2 left-3">
                  <span className="text-[#0ea5e9] text-[10px] bg-[#0ea5e9]/20 px-2 py-0.5 rounded-full">{r.buoyId}</span>
                </div>
                {/* Fake chlorophyll indicator */}
                <div className="absolute top-2 right-2 bg-black/60 rounded-lg px-2 py-1">
                  <p className="text-[10px] text-emerald-400">
                    Chl-a: ~{(0.2 + Math.abs(Math.sin(new Date(r.timestamp).getTime() / 1000000)) * 1.8).toFixed(2)} μg/L
                  </p>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-white text-xs font-medium">{buoy?.name}</p>
                <p className="text-[#64748b] text-[10px] mt-0.5">
                  {ts.toLocaleString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="flex gap-3 mt-2 text-[10px]">
                  <span className="text-[#0ea5e9]">T: {r.temperature}°C</span>
                  <span className="text-violet-400">S: {r.salinity} PSU</span>
                  <span className="text-[#64748b]">{r.latitude.toFixed(2)}, {r.longitude.toFixed(2)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {imageReadings.length === 0 && (
        <div className="text-center py-16 text-[#334155]">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
          </svg>
          <p>No images available for this device</p>
        </div>
      )}

      {imageReading && <ImageModal reading={imageReading} onClose={() => setImageReading(null)} />}
    </div>
  );
}