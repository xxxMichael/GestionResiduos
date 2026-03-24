"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function PublicMapClient({ tickets }: { tickets: any[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fix Leaflet icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
  }, []);

  if (!mounted) return <div style={{padding: '2rem', textAlign: 'center'}}>Cargando Cartografía...</div>;

  const unresolvedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });

  const resolvedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  });

  const centerLat = tickets.length > 0 ? tickets[0].latitude : -1.2415;
  const centerLng = tickets.length > 0 ? tickets[0].longitude : -78.6253;

  return (
    <MapContainer center={[centerLat, centerLng]} zoom={14} style={{ height: '100%', width: '100%', zIndex: 1 }}>
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      {tickets.map(ticket => (
        <Marker 
          key={ticket.id} 
          position={[ticket.latitude, ticket.longitude]} 
          icon={ticket.status === 'RESOLVED' ? resolvedIcon : unresolvedIcon}
        >
          <Popup>
             <strong>{ticket.status === 'RESOLVED' ? '✅ Zona Limpia' : '🚨 Pendiente de Remediación'}</strong><br/>
             <span style={{fontSize: '0.8rem', color: '#64748b'}}>{ticket.description}</span>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
