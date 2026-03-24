"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet.heat';
import { Map, Table, LogOut, Download, Navigation, Flame, CheckCircle, Clock, PieChart, Activity, TrendingDown, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './admin.module.css';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function HeatmapLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (typeof (L as any).heatLayer !== 'function') return;
    const heatLayer = (L as any).heatLayer(points, {
      radius: 35,
      blur: 20,
      maxZoom: 16,
      gradient: { 0.4: '#3b82f6', 0.6: '#eab308', 0.8: '#f97316', 1.0: '#ef4444' }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);
  return null;
}

// Haversine formula to calculate distance in km between two lat/lng coordinates
const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function MapComponent({ initialTickets }: { initialTickets: any[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [viewMode, setViewMode] = useState<'map' | 'table' | 'dashboard'>('dashboard');
  const [showRoute, setShowRoute] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [realRoutePath, setRealRoutePath] = useState<[number, number][]>([]);
  const [waNotification, setWaNotification] = useState<{show: boolean, phone: string, ticketId: number, image: string|null} | null>(null);
  const router = useRouter();

  const exportCSV = () => {
    if (tickets.length === 0) return;
    const headers = ["ID", "Descripcion", "Latitud", "Longitud", "Estado", "Categoria", "Fecha Creacion"];
    const rows = tickets.map(t => [
      t.id,
      `"${t.description.replace(/"/g, '""')}"`,
      t.latitude,
      t.longitude,
      t.status,
      t.category,
      new Date(t.createdAt).toLocaleString()
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reporte_sigtr_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (tickets.length === 0) return;
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Reporte Ejecutivo Operacional SIGTR", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total de Incidentes Históricos: ${tickets.length}`, 14, 34);
    doc.text(`Incidentes Operativos Resueltos: ${tickets.filter((t: any) => t.status === 'RESOLVED').length}`, 14, 40);
    
    const tableData = tickets.map((t: any) => [
      t.id.toString(),
      t.category,
      t.status === 'IN_PROGRESS' ? 'PROCESO' : t.status,
      new Date(t.createdAt).toLocaleDateString(),
      t.description.length > 50 ? t.description.substring(0, 50) + '...' : t.description
    ]);

    autoTable(doc, {
      startY: 48,
      head: [['ID', 'Categoría', 'Estado', 'Fecha', 'Descripción del Incidente']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [15, 23, 42] } // Dark blue to match enterprise theme
    });

    doc.save(`SIGTR_Reporte_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error("Error logging out", e);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const targetTicket = tickets.find(t => t.id === id);
        setTickets(tickets.map(t => t.id === id ? { ...t, status } : t));
        
        // Simulador de WhatsApp
        if (status === 'RESOLVED' && targetTicket && targetTicket.whatsapp) {
          setWaNotification({ show: true, phone: targetTicket.whatsapp, ticketId: targetTicket.id, image: targetTicket.imageUrl });
          setTimeout(() => setWaNotification(null), 8000); // Hide after 8 secs
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return styles.statusPending;
      case 'IN_PROGRESS': return styles.statusProgress;
      case 'RESOLVED': return styles.statusResolved;
      default: return styles.statusPending;
    }
  };

  // 1. Calcular el orden lógico de los puntos usando el algoritmo TSP Nearest Neighbor
  const { routeCoordinates, totalDistance } = useMemo(() => {
    const pendingTickets = tickets.filter(t => t.status === 'PENDING');
    if (pendingTickets.length < 2) return { routeCoordinates: [], totalDistance: 0 };

    let unvisited = [...pendingTickets];
    let current = unvisited.shift()!;

    const route: [number, number][] = [[current.latitude, current.longitude]];
    let distance = 0;

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const pt = unvisited[i];
        const dist = haversineDistance(current.latitude, current.longitude, pt.latitude, pt.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      current = unvisited[nearestIdx];
      unvisited.splice(nearestIdx, 1);
      route.push([current.latitude, current.longitude]);
      distance += minDistance;
    }

    return { routeCoordinates: route, totalDistance: distance };
  }, [tickets]);

  // 2. Fetch OSRM API para trazar la ruta real por las calles conectando los puntos en el orden TPS calculado
  useEffect(() => {
    if (!showRoute || routeCoordinates.length < 2) {
      setRealRoutePath([]);
      return;
    }

    let isMounted = true;
    const fetchRealRoute = async () => {
      try {
        // La API de OSRM espera Lng,Lat separados por punto y coma ';'
        const coordsString = routeCoordinates.map(coord => `${coord[1]},${coord[0]}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (isMounted && data.code === 'Ok' && data.routes && data.routes.length > 0) {
          // Extraer la ruta GeoJSON, OSRM devuelve [Lng, Lat]
          const geoJsonCoords = data.routes[0].geometry.coordinates;
          // Leaflet requiere [Lat, Lng]
          const leafletPath = geoJsonCoords.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
          setRealRoutePath(leafletPath);
        } else if (isMounted) {
          // Fallback en caso de error o límite de API
          setRealRoutePath(routeCoordinates);
        }
      } catch (error) {
        console.error("Error fetching OSRM route:", error);
        if (isMounted) setRealRoutePath(routeCoordinates);
      }
    };

    fetchRealRoute();

    return () => { isMounted = false; };
  }, [routeCoordinates, showRoute]);

  const centerLat = tickets.length > 0 ? tickets[0].latitude : -17.3826;
  const centerLng = tickets.length > 0 ? tickets[0].longitude : -66.1601;

  return (
    <div className={styles.dashboard}>

      {/* SIDEBAR */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Panel Administrativo</h2>
          <div className={styles.headerActions}>
            <button onClick={exportCSV} className={styles.btnExportIcon} disabled={tickets.length === 0} title="Descargar Historial">
              <Download size={14} /> CSV
            </button>
            <button onClick={handleLogout} className={styles.btnLogout}>
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>

        <div className={styles.viewToggles}>
          <button 
            className={`${styles.viewBtn} ${viewMode === 'dashboard' ? styles.activeView : ''}`} 
            onClick={() => setViewMode('dashboard')}
          ><PieChart size={16} /> Resumen</button>
          <button
            className={`${styles.viewBtn} ${viewMode === 'map' ? styles.activeView : ''}`}
            onClick={() => setViewMode('map')}
          ><Map size={16} /> Mapa</button>
          <button
            className={`${styles.viewBtn} ${viewMode === 'table' ? styles.activeView : ''}`}
            onClick={() => setViewMode('table')}
          ><Table size={16} /> Tabla</button>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statChip}>
            <strong>{tickets.length}</strong> Total
          </div>
          <div className={styles.statChip}>
            <strong>{tickets.filter(t => t.status === 'PENDING').length}</strong> Pendientes
          </div>
          <div className={styles.statChip}>
            <strong>{tickets.filter(t => t.status === 'RESOLVED').length}</strong> Resueltos
          </div>
        </div>

        {/* Módulos solo relevantes para el mapa */}
        {viewMode === 'map' && (
          <>
            <div className={styles.controlsRow}>
              <label className={`${styles.toggleBtn} ${showRoute ? styles.activeRoute : ''}`}>
                <input type="checkbox" checked={showRoute} onChange={(e) => {
                  setShowRoute(e.target.checked);
                  if (e.target.checked) setShowHeatmap(false);
                }} hidden />
                <Navigation size={14} /> Rutas
              </label>
              <label className={`${styles.toggleBtn} ${showHeatmap ? styles.activeHeat : ''}`}>
                <input type="checkbox" checked={showHeatmap} onChange={(e) => {
                  setShowHeatmap(e.target.checked);
                  if (e.target.checked) setShowRoute(false);
                }} hidden />
                <Flame size={14} /> Calor
              </label>
            </div>

            {showRoute && routeCoordinates.length > 0 && (
              <div className={styles.routeDetailsCompact}>
                <span>{routeCoordinates.length} paradas</span>
                <span>{totalDistance.toFixed(2)} km</span>
                <span style={{ color: '#166534' }}>Ahorro: {((totalDistance * 0.15) + routeCoordinates.length * 0.5).toFixed(1)}L</span>
              </div>
            )}
          </>
        )}

        <div className={styles.ticketList}>
          {tickets.length === 0 ? (
            <p style={{ color: '#6b7280', alignSelf: 'center', marginTop: '1rem', fontSize: '0.85rem' }}>Vacio.</p>
          ) : null}

          {tickets.map(ticket => (
            <div key={ticket.id} className={styles.ticketCompactItem}>
              <div className={styles.ticketCompactLeft}>
                <span className={styles.ticketCompactId}>#{ticket.id}</span>
                <span className={styles.ticketCompactDesc}>{ticket.description}</span>
              </div>
              <div className={styles.ticketCompactRight}>
                <span className={`${styles.badge} ${getStatusColor(ticket.status)}`}>{ticket.status === 'IN_PROGRESS' ? 'IN_PROG' : ticket.status}</span>

                {ticket.status === 'PENDING' && (
                  <button onClick={() => updateStatus(ticket.id, 'IN_PROGRESS')} className={styles.btnProgress}><Clock size={12} /> Atender</button>
                )}
                {ticket.status === 'IN_PROGRESS' && (
                  <button onClick={() => updateStatus(ticket.id, 'RESOLVED')} className={styles.btnResolve}><CheckCircle size={12} /> OK</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className={styles.mainArea}>
        {viewMode === 'dashboard' && (
          <div style={{ padding: '0 1rem', overflowY: 'auto', height: '100%' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Dashboard Ejecutivo</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>Métricas en tiempo real y generación de informes de la plataforma EnvSIGTR.</p>
            
            <div className={styles.dashboardGrid}>
               <div className={styles.dashCard}>
                 <div className={styles.dashCardHeader}><Activity size={18} color="#2563eb" /> Tickets Históricos</div>
                 <div className={styles.dashCardValue}>{tickets.length}</div>
                 <div className={styles.dashCardSub}>Total de incidentes ambientales reportados en la plataforma.</div>
               </div>
               
               <div className={styles.dashCard}>
                 <div className={styles.dashCardHeader}><CheckCircle size={18} color="#16a34a" /> Tasa de Resolución</div>
                 <div className={styles.dashCardValue}>
                   {tickets.length > 0 ? Math.round((tickets.filter((t: any) => t.status === 'RESOLVED').length / tickets.length) * 100) : 0}%
                 </div>
                 <div className={styles.dashCardSub}>{tickets.filter((t: any) => t.status === 'RESOLVED').length} tickets resueltos satisfactoriamente.</div>
               </div>

               <div className={styles.dashCard}>
                 <div className={styles.dashCardHeader}><Navigation size={18} color="#f59e0b" /> Distancia Trazada Mínima</div>
                 <div className={styles.dashCardValue}>{totalDistance.toFixed(1)} <span style={{fontSize:'1.1rem', fontWeight: 600, color: '#64748b'}}>km</span></div>
                 <div className={styles.dashCardSub}>Métrica paramétrica para limpiar los {routeCoordinates.length} tickets pendientes.</div>
               </div>

               <div className={styles.dashCard}>
                 <div className={styles.dashCardHeader}><TrendingDown size={18} color="#166534" /> Combustible Ahorrado Proyectado</div>
                 <div className={styles.dashCardValue}>{((totalDistance * 0.15) + routeCoordinates.length * 0.5).toFixed(1)} <span style={{fontSize:'1.1rem', fontWeight: 600, color: '#64748b'}}>L</span></div>
                 <div className={styles.dashCardSub}>Gasto en litros de diésel mitigado utilizando matemáticas de ruteo vs patrullaje empírico.</div>
               </div>
            </div>

            <div className={styles.pdfBtnContainer}>
               <button className={styles.btnPdf} onClick={exportPDF}>
                 <FileText size={18} /> Generar Reporte Oficial PDF
               </button>
            </div>
          </div>
        )}

        {viewMode === 'map' && (
          <div style={{ height: '100%', width: '100%', borderRadius: '1rem', overflow: 'hidden' }}>
            {typeof window !== 'undefined' && (
              <MapContainer
                center={[centerLat, centerLng]}
                zoom={13}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
              >
                <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {showRoute && realRoutePath.length > 0 && (
                  <Polyline positions={realRoutePath} color="#3b82f6" weight={6} opacity={0.85} />
                )}

                {showHeatmap ? (
                  <HeatmapLayer points={tickets.map(t => [t.latitude, t.longitude, 1.0])} />
                ) : (
                  tickets.map(ticket => (
                    <Marker key={ticket.id} position={[ticket.latitude, ticket.longitude]} icon={icon}>
                      <Popup>
                        <strong>Reporte #{ticket.id}</strong><br />
                        {ticket.description}<br />
                        {ticket.imageUrl && <img src={ticket.imageUrl} alt="Evidencia" style={{ width: '100%', marginTop: '5px', borderRadius: '4px', maxHeight: '120px', objectFit: 'cover' }} />}
                        <em>Estado: {ticket.status}</em>
                      </Popup>
                    </Marker>
                  ))
                )}
              </MapContainer>
            )}
          </div>
        )}

        {viewMode === 'table' && (
          <div className={styles.tableContainer}>
            <table className={styles.sigtrTable}>
              <thead>
                <tr>
                  <th>Evidencia</th>
                  <th>ID</th>
                  <th>Descripción</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>No se han reportado incidentes ambientales aún.</td></tr>
                )}
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td>
                      {ticket.imageUrl ? (
                        <img src={ticket.imageUrl} alt="Evidencia" className={styles.thumbnail} />
                      ) : (
                        <div className={styles.thumbnail} style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>N/A</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 800 }}>#{ticket.id}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.description}</td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td><span className={`${styles.badge} ${getStatusColor(ticket.status)}`}>{ticket.status}</span></td>
                    <td>
                      {ticket.status === 'PENDING' && (
                        <button onClick={() => updateStatus(ticket.id, 'IN_PROGRESS')} className={styles.btnProgress}>Atender Tarea</button>
                      )}
                      {ticket.status === 'IN_PROGRESS' && (
                        <button onClick={() => updateStatus(ticket.id, 'RESOLVED')} className={styles.btnResolve}>Marcar Terminado</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {waNotification && (
        <div className={styles.waToast}>
          <div className={styles.waHeader}>
            <CheckCircle size={18} color="white" />
            Notificación Automática WhatsApp
          </div>
          <div className={styles.waBody}>
            <div style={{fontSize: '0.7rem', color: '#64748b', textAlign: 'center'}}>Hoy, {new Date().toLocaleTimeString()}</div>
            <div className={styles.waBubble}>
              <strong>Alcaldía SIGTR:</strong><br/>
              ¡Hola! Queremos informarte que tu reporte #{waNotification.ticketId} ha sido atendido y el área fue limpiada exitosamente. Gracias por cuidar la ciudad. 
              {waNotification.image && (
                <div style={{marginTop: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', padding: '0.2rem', background: 'white', fontSize: '0.7rem' }}>
                  <img src={waNotification.image} style={{width: '100%', height: '80px', objectFit: 'cover', borderRadius: '2px'}} alt="Evidencia" />
                  <em>Evidencia adjunta preservada</em>
                </div>
              )}
            </div>
          </div>
          <div className={styles.waFooter}>
            Mensaje simulado al número: {waNotification.phone}
          </div>
        </div>
      )}

    </div>
  );
}
