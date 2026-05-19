export interface SensorReading {
  id: string;
  timestamp: string;
  temperature: number; // °C
  salinity: number; // PSU
  tds: number; // mg/L
  dissolvedOxygen: number; // mg/L (estimated)
  latitude: number;
  longitude: number;
  imageUrl?: string;
  buoyId: string;
  batteryLevel: number; // %
}

export interface Buoy {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'warning';
  lastSeen: string;
  deployedAt: string;
  lat: number;
  lng: number;
  batteryLevel: number;
  signalStrength: number;
  totalReadings: number;
  firmwareVersion: string;
}

export interface User {
  email: string;
  name: string;
  role: 'researcher' | 'admin';
}