"use client";

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => <div style={{display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center'}}>Cargando mapa interactivo...</div>
});

export default function MapWrapper({ initialTickets }: { initialTickets: any[] }) {
  return <MapComponent initialTickets={initialTickets} />
}
