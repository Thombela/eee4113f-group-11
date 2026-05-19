'use client';
import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MOCK_BUOYS, ALL_READINGS } from '@/lib/mockData';
import type { SensorReading } from '@/types';
import ImageModal from './modals/ImageModal';

const METRICS = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#0ea5e9', domain: [-3, 6] },
  { key: 'salinity', label: 'Salinity', unit: 'PSU', color: '#8b5cf6', domain: [33, 35.5] },
  { key: 'tds', label: 'TDS', unit: 'mg/L', color: '#10b981', domain: [38000, 46000] },
  { key: 'dissolvedOxygen', label: 'Dissolved O₂', unit: 'mg/L', color: '#f59e0b', domain: [6, 11] },
];

const TIME_RANGES = [
  { label: '24H', hours: 24 },
  { label: '7D', hours: 168 },
  { label: '14D', hours: 336 },
];

function CustomTooltip({ active, payload, label, onImageClick }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload as SensorReading & { formattedTime: string };
  return (
    <div className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl p-3 shadow-2xl text-xs">
      <p className="text-[#64748b] mb-2">{data?.formattedTime}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[#64748b]">{p.name}:</span>
          <span className="text-white font-medium">{typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</span>
        </div>
      ))}
      {data?.imageUrl && (
        <button
          onClick={() => onImageClick(data)}
          className="mt-2 w-full text-[#0ea5e9] text-[10px] border border-[#0ea5e9]/30 rounded-lg py-1 hover:bg-[#0ea5e9]/10 transition-colors"
        >
          📷 View Image
        </button>
      )}
    </div>
  );
}

export default function SensorDataPage() {
  const [selectedBuoyId, setSelectedBuoyId] = useState(MOCK_BUOYS[0].id);
  const [timeRange, setTimeRange] = useState(168);
  const [activeMetrics, setActiveMetrics] = useState(['temperature', 'salinity', 'tds']);
  const [imageReading, setImageReading] = useState<SensorReading | null>(null);

  const chartData = useMemo(() => {
    const readings = ALL_READINGS[selectedBuoyId] ?? [];
    const cutoff = Date.now() - timeRange * 60 * 60 * 1000;
    return readings
      .filter((r) => new Date(r.timestamp).getTime() >= cutoff)
      .map((r) => ({
        ...r,
        formattedTime: new Date(r.timestamp).toLocaleString('en-ZA', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        }),
        timeKey: new Date(r.timestamp).getTime(),
      }));
  }, [selectedBuoyId, timeRange]);

  const latest = chartData.at(-1);

  const toggleMetric = (key: string) => {
    setActiveMetrics((prev) => prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Mono', monospace" }}>Sensor Data</h1>
          <p className="text-[#64748b] text-sm mt-1">Time-series visualization of environmental parameters</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[#64748b] text-xs">Device:</span>
          <select
            value={selectedBuoyId}
            onChange={(e) => setSelectedBuoyId(e.target.value)}
            className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#0ea5e9]"
          >
            {MOCK_BUOYS.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.id})</option>
            ))}
          </select>
        </div>

        <div className="flex bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl overflow-hidden">
          {TIME_RANGES.map((tr) => (
            <button
              key={tr.hours}
              onClick={() => setTimeRange(tr.hours)}
              className={`px-4 py-2 text-xs font-medium transition-colors ${timeRange === tr.hours ? 'bg-[#0ea5e9]/20 text-[#0ea5e9]' : 'text-[#64748b] hover:text-white'}`}
            >
              {tr.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${activeMetrics.includes(m.key) ? 'border-opacity-40 text-white' : 'border-[#1e3a5f] text-[#334155]'}`}
              style={activeMetrics.includes(m.key) ? { borderColor: m.color + '66', backgroundColor: m.color + '15' } : {}}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeMetrics.includes(m.key) ? m.color : '#334155' }} />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Latest values */}
      {latest && (
        <div className="grid grid-cols-4 gap-3">
          {METRICS.map((m) => {
            const val = latest[m.key as keyof typeof latest] as number;
            return (
              <div key={m.key} className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-1 h-10 rounded-full" style={{ backgroundColor: m.color }} />
                <div>
                  <p className="text-[#64748b] text-[10px] uppercase tracking-wider">{m.label}</p>
                  <p className="text-white font-bold text-lg">{val?.toFixed(m.key === 'tds' ? 0 : 2)} <span className="text-xs text-[#64748b] font-normal">{m.unit}</span></p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts */}
      <div className="space-y-4">
        {METRICS.filter((m) => activeMetrics.includes(m.key)).map((metric) => (
          <div key={metric.key} className="bg-[#0d1b2e] border border-[#1e3a5f] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: metric.color }} />
                <h3 className="text-white text-sm font-semibold">{metric.label}</h3>
                <span className="text-[#334155] text-xs">{metric.unit}</span>
              </div>
              <div className="text-[#64748b] text-xs">{chartData.length} data points</div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis
                  dataKey="formattedTime"
                  tick={{ fill: '#334155', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(chartData.length / 6)}
                />
                <YAxis
                  domain={metric.domain}
                  tick={{ fill: '#334155', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />
                <Tooltip content={<CustomTooltip onImageClick={setImageReading} />} />
                {/* Image markers */}
                {chartData.filter((d) => d.imageUrl).map((d) => (
                  <ReferenceLine key={d.id} x={d.formattedTime} stroke="#0ea5e9" strokeOpacity={0.3} strokeDasharray="2 4" />
                ))}
                <Line
                  type="monotone"
                  dataKey={metric.key}
                  stroke={metric.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: metric.color, stroke: '#0d1b2e', strokeWidth: 2 }}
                  name={metric.label}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[#334155] text-[10px] mt-1">↑ Dashed blue lines indicate data points with camera imagery</p>
          </div>
        ))}
      </div>

      {imageReading && <ImageModal reading={imageReading} onClose={() => setImageReading(null)} />}
    </div>
  );
}