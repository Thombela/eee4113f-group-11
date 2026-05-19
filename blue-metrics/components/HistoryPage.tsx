'use client';
import { useState, useMemo } from 'react';
import { MOCK_BUOYS, ALL_READINGS } from '@/lib/mockData';
import type { SensorReading } from '@/types';
import ImageModal from './modals/ImageModal';

function ExportCSV(data: SensorReading[], filename: string) {
  const headers = ['Timestamp', 'Buoy ID', 'Temp (°C)', 'Salinity (PSU)', 'TDS (mg/L)', 'DO (mg/L)', 'Lat', 'Lon', 'Battery%'];
  const rows = data.map((r) => [
    r.timestamp, r.buoyId, r.temperature, r.salinity, r.tds, r.dissolvedOxygen, r.latitude, r.longitude, r.batteryLevel,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

export default function HistoryPage() {
  const [selectedBuoyId, setSelectedBuoyId] = useState('all');
  const [page, setPage] = useState(0);
  const [imageReading, setImageReading] = useState<SensorReading | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const pageSize = 20;

  const allReadings = useMemo(() => {
    const buoys = selectedBuoyId === 'all' ? MOCK_BUOYS.map((b) => b.id) : [selectedBuoyId];
    const combined = buoys.flatMap((id) => ALL_READINGS[id] ?? []);
    return combined.sort((a, b) => {
      const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      return sortDir === 'desc' ? diff : -diff;
    });
  }, [selectedBuoyId, sortDir]);

  const paginated = useMemo(() => allReadings.slice(page * pageSize, (page + 1) * pageSize), [allReadings, page]);
  const totalPages = Math.ceil(allReadings.length / pageSize);

  const stats = useMemo(() => {
    if (!allReadings.length) return null;
    const temps = allReadings.map((r) => r.temperature);
    const sals = allReadings.map((r) => r.salinity);
    return {
      minTemp: Math.min(...temps).toFixed(2),
      maxTemp: Math.max(...temps).toFixed(2),
      avgTemp: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2),
      minSal: Math.min(...sals).toFixed(3),
      maxSal: Math.max(...sals).toFixed(3),
      withImages: allReadings.filter((r) => r.imageUrl).length,
    };
  }, [allReadings]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Mono', monospace" }}>Historical Data</h1>
          <p className="text-[#64748b] text-sm mt-1">Browse and export all sensor readings from deployed buoys</p>
        </div>
        <button
          onClick={() => ExportCSV(allReadings, `blue-metric-export-${selectedBuoyId}-${Date.now()}.csv`)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 text-[#0ea5e9] rounded-xl text-sm hover:bg-[#0ea5e9]/20 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[#64748b] text-xs">Device:</span>
          <select
            value={selectedBuoyId}
            onChange={(e) => { setSelectedBuoyId(e.target.value); setPage(0); }}
            className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#0ea5e9]"
          >
            <option value="all">All Devices</option>
            {MOCK_BUOYS.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="text-[#64748b] text-xs">
          {allReadings.length.toLocaleString()} readings
        </div>
      </div>

      {/* Summary stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl px-4 py-3">
            <p className="text-[#64748b] text-[10px] uppercase tracking-wider mb-1">Temperature Range</p>
            <p className="text-[#0ea5e9] font-semibold text-sm">{stats.minTemp}° → {stats.maxTemp}°C</p>
            <p className="text-[#334155] text-xs">avg {stats.avgTemp}°C</p>
          </div>
          <div className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl px-4 py-3">
            <p className="text-[#64748b] text-[10px] uppercase tracking-wider mb-1">Salinity Range</p>
            <p className="text-violet-400 font-semibold text-sm">{stats.minSal} → {stats.maxSal} PSU</p>
          </div>
          <div className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl px-4 py-3">
            <p className="text-[#64748b] text-[10px] uppercase tracking-wider mb-1">Total Readings</p>
            <p className="text-white font-semibold text-sm">{allReadings.length.toLocaleString()}</p>
          </div>
          <div className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl px-4 py-3">
            <p className="text-[#64748b] text-[10px] uppercase tracking-wider mb-1">With Imagery</p>
            <p className="text-emerald-400 font-semibold text-sm">{stats.withImages} frames</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#1e3a5f]">
              <th
                className="px-4 py-3 text-left text-[#334155] uppercase tracking-wider cursor-pointer hover:text-[#64748b]"
                onClick={() => setSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
              >
                Timestamp {sortDir === 'desc' ? '↓' : '↑'}
              </th>
              <th className="px-4 py-3 text-left text-[#334155] uppercase tracking-wider">Device</th>
              <th className="px-4 py-3 text-left text-[#334155] uppercase tracking-wider">Temp (°C)</th>
              <th className="px-4 py-3 text-left text-[#334155] uppercase tracking-wider">Salinity (PSU)</th>
              <th className="px-4 py-3 text-left text-[#334155] uppercase tracking-wider">TDS (mg/L)</th>
              <th className="px-4 py-3 text-left text-[#334155] uppercase tracking-wider">DO (mg/L)</th>
              <th className="px-4 py-3 text-left text-[#334155] uppercase tracking-wider">Position</th>
              <th className="px-4 py-3 text-left text-[#334155] uppercase tracking-wider">Image</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r) => {
              const buoy = MOCK_BUOYS.find((b) => b.id === r.buoyId);
              return (
                <tr key={r.id} className="border-b border-[#1e3a5f]/40 hover:bg-[#0a1628] transition-colors">
                  <td className="px-4 py-3 text-[#64748b]" style={{ fontFamily: "'Space Mono', monospace" }}>
                    {new Date(r.timestamp).toLocaleString('en-ZA', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[#0ea5e9] bg-[#0ea5e9]/10 px-2 py-0.5 rounded-md">{r.buoyId}</span>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{r.temperature.toFixed(2)}</td>
                  <td className="px-4 py-3 text-violet-400">{r.salinity.toFixed(3)}</td>
                  <td className="px-4 py-3 text-emerald-400">{r.tds.toFixed(0)}</td>
                  <td className="px-4 py-3 text-amber-400">{r.dissolvedOxygen.toFixed(2)}</td>
                  <td className="px-4 py-3 text-[#64748b]" style={{ fontFamily: "'Space Mono', monospace" }}>
                    {r.latitude.toFixed(3)}, {r.longitude.toFixed(3)}
                  </td>
                  <td className="px-4 py-3">
                    {r.imageUrl ? (
                      <button
                        onClick={() => setImageReading(r)}
                        className="flex items-center gap-1 text-[#0ea5e9] hover:text-white transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        View
                      </button>
                    ) : (
                      <span className="text-[#1e3a5f]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-[#1e3a5f] flex items-center justify-between">
          <p className="text-[#334155] text-xs">
            Page {page + 1} of {totalPages} · Showing {paginated.length} of {allReadings.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg bg-[#0a1628] border border-[#1e3a5f] text-xs text-white disabled:opacity-30 hover:border-[#0ea5e9]/50 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg bg-[#0a1628] border border-[#1e3a5f] text-xs text-white disabled:opacity-30 hover:border-[#0ea5e9]/50 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {imageReading && <ImageModal reading={imageReading} onClose={() => setImageReading(null)} />}
    </div>
  );
}