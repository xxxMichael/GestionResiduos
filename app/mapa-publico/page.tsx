import dynamic from 'next/dynamic';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import MapWrapper from './MapWrapper';

export const revalidate = 0;

export default async function PublicMapPage() {
  const tickets = await prisma.ticket.findMany({ select: { id: true, latitude: true, longitude: true, status: true, category: true, description: true } });
  
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
       <header style={{ background: '#0f172a', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #3b82f6' }}>
         <div>
           <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Mapa de Transparencia Ciudadana</h1>
           <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>Datos Abiertos - Gestión Técnica de Residuos Sólidos</p>
         </div>
         <Link href="/" style={{ color: '#ffffff', fontSize: '0.9rem', textDecoration: 'none', background: '#334155', padding: '0.5rem 1rem', borderRadius: '4px' }}>
            Ver Portal de Reportes
         </Link>
       </header>

       <div style={{ padding: '1rem 2rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '2rem', fontSize: '0.9rem' }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
             <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" width={16} /> 
             <strong>{tickets.filter(t => t.status === 'RESOLVED').length} Puntos Remediados</strong>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
             <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" width={16} /> 
             <strong>{tickets.filter(t => t.status !== 'RESOLVED').length} Pendientes de Recolección</strong>
          </div>
       </div>

       <div style={{ flex: 1, position: 'relative' }}>
         <MapWrapper tickets={tickets} />
       </div>
    </div>
  )
}
