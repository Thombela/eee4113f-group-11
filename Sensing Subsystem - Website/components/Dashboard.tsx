'use client';
import { useState } from 'react';
import Sidebar from './Sidebar';
import OverviewPage from './OverviewPage';
import MapPage from './MapPage';
import SensorDataPage from './SensorDataPage';
import HistoryPage from './HistoryPage';
import ImageryPage from './ImageryPage';
import DevicesPage from './DevicesPage';

const PAGES: Record<string, React.ComponentType<any>> = {
  overview: OverviewPage,
  map: MapPage,
  data: SensorDataPage,
  history: HistoryPage,
  images: ImageryPage,
  devices: DevicesPage,
};

export default function Dashboard() {
  const [activePage, setActivePage] = useState('overview');

  const PageComponent = PAGES[activePage] ?? OverviewPage;

  return (
    <div className="flex min-h-screen bg-[#060c18]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        <PageComponent onNavigate={setActivePage} />
      </main>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #060c18; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #0ea5e9; }
      `}</style>
    </div>
  );
}