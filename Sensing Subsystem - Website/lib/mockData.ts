import type { Buoy, SensorReading } from '@/types';

export const MOCK_BUOYS: Buoy[] = [
  {
    id: 'Bouy-001',
    name: 'Southern Ocean Alpha',
    status: 'active',
    lastSeen: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    deployedAt: '2026-01-15T08:00:00Z',
    lat: -54.2312,
    lng: 3.4821,
    batteryLevel: 78,
    signalStrength: -87,
    totalReadings: 2184,
    firmwareVersion: 'v1.2.3',
  },
];

function seeded(seed: number, min: number, max: number): number {
  const x = Math.sin(seed) * 10000;
  const frac = x - Math.floor(x);
  return min + frac * (max - min);
}

const WATER_IMAGES = [
  '/esp32_images/2026/05/13/22_0_original.jpg',
  '/esp32_images/2026/05/14/21_0_original.jpg',
  '/esp32_images/2026/05/14/22_0_original.jpg',
];

export function generateReadings(buoyId: string, count: number = 168): SensorReading[] {
  const buoy = MOCK_BUOYS.find((b) => b.id === buoyId)!;
  const readings: SensorReading[] = [];
  const now = Date.now();
  const interval = 60 * 60 * 1000; // hourly

  for (let i = count - 1; i >= 0; i--) {
    const ts = now - i * interval;
    const seed = ts / 1000000 + buoyId.charCodeAt(6);
    const dayFraction = (i % 24) / 24;

    // Temperature: polar water, roughly -1.8 to 4°C with diurnal variation
    const baseTemp = buoyId === 'Bouy-003' || buoyId === 'Bouy-004' ? -0.8 : 1.2;
    const temp = parseFloat((baseTemp + seeded(seed, -1.5, 1.5) + Math.sin(dayFraction * Math.PI * 2) * 0.3).toFixed(2));

    // Salinity: Southern Ocean 33.5–34.7 PSU
    const salinity = parseFloat((34.1 + seeded(seed + 1, -0.4, 0.4)).toFixed(3));

    // TDS: roughly 40,000–45,000 mg/L for ocean
    const tds = parseFloat((42000 + seeded(seed + 2, -1500, 1500)).toFixed(0));

    // DO estimated from temp & salinity (warmer = less DO)
    const do_ = parseFloat((8.2 - temp * 0.18 + seeded(seed + 3, -0.3, 0.3)).toFixed(2));

    // Drift position slightly
    const latDrift = seeded(seed + 4, -0.001, 0.001) * i;
    const lngDrift = seeded(seed + 5, -0.001, 0.001) * i;

    const hasImage = i % 6 === 0; // image every 6 hours

    readings.push({
      id: `${buoyId}-${ts}`,
      timestamp: new Date(ts).toISOString(),
      temperature: temp,
      salinity,
      tds,
      dissolvedOxygen: do_,
      latitude: parseFloat((buoy.lat + latDrift).toFixed(4)),
      longitude: parseFloat((buoy.lng + lngDrift).toFixed(4)),
      imageUrl: hasImage ? WATER_IMAGES[Math.floor(seeded(seed + 6, 0, WATER_IMAGES.length))] : undefined,
      buoyId,
      batteryLevel: Math.max(0, Math.round(buoy.batteryLevel - (count - i) * 0.05)),
    });
  }

  return readings;
}

export const ALL_READINGS: Record<string, SensorReading[]> = Object.fromEntries(
  MOCK_BUOYS.map((b) => [b.id, generateReadings(b.id)])
);