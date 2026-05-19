'use client';
import { useState, useEffect, useRef } from 'react';
import { MOCK_BUOYS, ALL_READINGS } from '@/lib/mockData';
import type { Buoy } from '@/types';
import BuoyDetailModal from './modals/BuoyDetailModal';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function MapPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedBuoy, setSelectedBuoy] = useState<Buoy | null>(null);
  const [showTrail, setShowTrail] = useState(true);
  const markersRef = useRef<any[]>([]);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = 'AIzaSyA3aul7pkGkrjsAWQ54JcH9ZIMBwdW3pkY';

    const loadMap = async () => {
      // Load script only once
      if (!window.google) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector('#google-maps-script');

          if (existing) {
            existing.addEventListener('load', () => resolve());
            return;
          }

          const script = document.createElement('script');
          script.id = 'google-maps-script';
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
          script.async = true;
          script.defer = true;

          script.onload = () => resolve();
          script.onerror = reject;

          document.head.appendChild(script);
        });
      }

      // 🛑 CRITICAL: ensure DOM is ready
      if (!mapRef.current) return;

      // small delay ensures layout is committed (fixes IntersectionObserver crash)
      await new Promise((r) => requestAnimationFrame(r));

      const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: -60, lng: 20 },
          zoom: 3,
          mapTypeId: 'satellite',
          disableDefaultUI: true,
          zoomControl: true,
          backgroundColor: '#060c18',
        });

        mapInstanceRef.current = map;

        const colors = {
          active: '#10b981',
          warning: '#f59e0b',
          inactive: '#475569',
        };

        MOCK_BUOYS.forEach((buoy) => {
          const marker = new window.google.maps.Marker({
            position: { lat: buoy.lat, lng: buoy.lng },
            map,
            title: buoy.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: colors[buoy.status],
              fillOpacity: 0.9,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
          });

          marker.addListener('click', () => setSelectedBuoy(buoy));
          markersRef.current.push(marker);

          if (showTrail) {
            const readings = ALL_READINGS[buoy.id]?.slice(-24) ?? [];
            const path = readings.map((r) => ({ lat: r.latitude, lng: r.longitude }));

            new window.google.maps.Polyline({
              path,
              map,
              strokeColor: colors[buoy.status],
              strokeOpacity: 0.4,
              strokeWeight: 2,
            });
          }
        });

      setMapLoaded(true);
    };

    loadMap();
  }, []);

  // Fallback static map using Leaflet-style SVG visualization
  const FallbackMap = () => (
    <div className="relative w-full h-full bg-[#0a1628] overflow-hidden rounded-xl">
      <svg viewBox="0 0 900 600" className="w-full h-full opacity-40">
        {/* Ocean grid */}
        {[...Array(15)].map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 40} x2="900" y2={i * 40} stroke="#1e3a5f" strokeWidth="0.5" />
        ))}
        {[...Array(23)].map((_, i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="600" stroke="#1e3a5f" strokeWidth="0.5" />
        ))}
        {/* Latitude lines */}
        <text x="10" y="100" fill="#334155" fontSize="10">-40°S</text>
        <text x="10" y="250" fill="#334155" fontSize="10">-55°S</text>
        <text x="10" y="400" fill="#334155" fontSize="10">-70°S</text>
        {/* Antarctica hint */}
        <ellipse cx="450" cy="560" rx="350" ry="60" fill="#1e3a5f" opacity="0.5" />
        <text x="380" y="565" fill="#64748b" fontSize="12">Antarctica</text>
      </svg>

      {/* Buoy markers */}
      {MOCK_BUOYS.map((buoy) => {
        // Project lat/lng to SVG coords (rough)
        const x = ((buoy.lng + 180) / 360) * 900;
        const y = ((90 - buoy.lat) / 180) * 600;
        const colors = { active: '#10b981', warning: '#f59e0b', inactive: '#475569' };
        const color = colors[buoy.status];

        return (
          <div
            key={buoy.id}
            className="absolute cursor-pointer group"
            style={{ left: `${(x / 900) * 100}%`, top: `${(y / 600) * 100}%`, transform: 'translate(-50%,-50%)' }}
            onClick={() => setSelectedBuoy(buoy)}
          >
            <div className="relative">
              {buoy.status === 'active' && (
                <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: color, opacity: 0.4, width: '24px', height: '24px', margin: '-4px' }} />
              )}
              <div className="w-4 h-4 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: color }} />
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0d1b2e] border border-[#1e3a5f] rounded-lg px-3 py-2 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <p className="font-semibold">{buoy.name}</p>
              <p className="text-[#64748b]">{buoy.id}</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-8 h-full flex flex-col space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Mono', monospace" }}>Live Map</h1>
          <p className="text-[#64748b] text-sm mt-1">Real-time positions of all deployed buoys with drift trails</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTrail(!showTrail)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all ${showTrail ? 'bg-[#0ea5e9]/10 border-[#0ea5e9]/30 text-[#0ea5e9]' : 'bg-[#0d1b2e] border-[#1e3a5f] text-[#64748b]'}`}
          >
            Drift Trails
          </button>
          {/* Legend */}
          <div className="flex items-center gap-4 bg-[#0d1b2e] border border-[#1e3a5f] rounded-xl px-4 py-2">
            {[['active', '#10b981'], ['warning', '#f59e0b'], ['inactive', '#475569']].map(([s, c]) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                <span className="text-[#64748b] text-xs capitalize">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map container */}
      <div className="flex-1 min-h-125 bg-[#0d1b2e] border border-[#1e3a5f] rounded-2xl overflow-hidden relative">
        <div ref={mapRef} className="w-full h-full" />
        {!mapLoaded ? (<FallbackMap />) : (<div ref={mapRef} className="w-full h-full" />)}

        {/* Buoy info cards overlay */}
        <div className="absolute top-4 right-4 space-y-2">
          {MOCK_BUOYS.map((buoy) => {
            const latest = ALL_READINGS[buoy.id]?.at(-1);
            const statusColors = { active: 'border-emerald-500/30 bg-emerald-500/5', warning: 'border-amber-500/30 bg-amber-500/5', inactive: 'border-[#1e3a5f] bg-[#0d1b2e]/80' };
            return (
              <button
                key={buoy.id}
                onClick={() => setSelectedBuoy(buoy)}
                className={`w-52 text-left border rounded-xl px-3 py-2 backdrop-blur-sm transition-all hover:scale-[1.02] ${statusColors[buoy.status]}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${buoy.status === 'active' ? 'bg-emerald-400' : buoy.status === 'warning' ? 'bg-amber-400' : 'bg-[#475569]'}`} />
                  <p className="text-white text-xs font-medium truncate">{buoy.name}</p>
                </div>
                {latest && (
                  <div className="flex gap-3 text-[10px] text-[#64748b]">
                    <span>{latest.temperature}°C</span>
                    <span>{latest.salinity} PSU</span>
                  </div>
                )}
                <p className="text-[#334155] text-[10px] mt-0.5" style={{ fontFamily: "'Space Mono', monospace" }}>
                  {buoy.lat.toFixed(2)}° {buoy.lng.toFixed(2)}°
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {selectedBuoy && (
        <BuoyDetailModal buoy={selectedBuoy} onClose={() => setSelectedBuoy(null)} onNavigate={onNavigate} />
      )}
    </div>
  );
}