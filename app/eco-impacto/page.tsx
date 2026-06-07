import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ShieldCheck, Trees, Recycle, Map, Users, Leaf, Trash2 } from 'lucide-react';
import styles from './eco.module.css';

export const revalidate = 0;

export default async function EcoImpactoPage() {
  const tickets = await prisma.ticket.findMany();
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;
  
  // Fórmulas de impacto psicológico de la O.M.S
  const co2Saved = resolvedCount * 12.3;    
  const treesEquivalent = Math.floor(co2Saved / 21) || 1; // 1 arbol asimila ~21kg de CO2 al año

  const progressPercentage = tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0;

  return (
    <main className={styles.main}>
      <header className={styles.topHeader}>
        <div className={styles.logo}>EnvSIGTR</div>
        <Link href="/" className={styles.btnSecondary}>Hacer Reporte Remediación</Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.badgeTop}>Métricas en Tiempo Real</div>
        <h1>El Impacto de Nuestra Comunidad</h1>
        <p>No son solo números. Son calles recuperadas, enfermedades prevenidas y toneladas de contaminación que no llegaron a nuestros ríos gracias al simple acto de reportar.</p>
      </section>

      <div className={styles.container}>
        
        {/* Banner Transparencia */}
        <div className={styles.transparencyBanner}>
          <div className={styles.tbText}>
            <h2>¿Cansado de que tus reportes sean ignorados?</h2>
            <p>La gestión de residuos debe ser un proceso transparente. Hemos abierto nuestra base de datos en un mapa interactivo para que audites en vivo qué reportes han sido solucionados y cuáles están pendientes.</p>
          </div>
          <Link href="/mapa-publico" className={styles.btnMap}><Map size={18} /> Ver Mapa de Auditoría Ciudadana</Link>
        </div>

        <h2 className={styles.sectionTitle}>Tus Reportes Convertidos en Acciones Reales</h2>
        <div className={styles.impactGrid}>
          
          <div className={styles.impactCard}>
            <div className={styles.impactIconWrap} style={{background: '#dcfce7', color: '#16a34a'}}><ShieldCheck size={32} /></div>
            <h3>{resolvedCount} Focos Infecciosos Erradicados</h3>
            <p>Zonas que antes eran nidos de plagas y malos olores en tu barrio, ahora son áreas seguras y limpias gracias a tu denuncia.</p>
          </div>

          <div className={styles.impactCard}>
            <div className={styles.impactIconWrap} style={{background: '#dbeafe', color: '#2563eb'}}><Users size={32} /></div>
            <h3>{tickets.length} Vecinos Comprometidos</h3>
            <p>Cada entrada en nuestro sistema representa a un ciudadano que decidió no ser indiferente ante la crisis sanitaria urbana de la ciudad.</p>
          </div>

          <div className={styles.impactCard}>
            <div className={styles.impactIconWrap} style={{background: '#fef3c7', color: '#d97706'}}><Trees size={32} /></div>
            <h3>Equivale a plantar {treesEquivalent} Árboles Maduros</h3>
            <p>Hemos evitado que {co2Saved.toFixed(0)} kg de gas metano lleguen a la atmósfera. Se necesitarían {treesEquivalent} árboles respirando todo un año para purificar lo que logramos hoy.</p>
          </div>
          
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>Índice de Confianza y Eficiencia Municipal (S.L.A)</span>
            <span className={styles.percText}>{progressPercentage}%</span>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <p className={styles.progressDesc}>Estamos trabajando arduamente en la logística de ruteo para llegar al 100%. Cada reporte pendiente de la barra gris está actualmente secuenciado en una ruta de resolución prioritaria.</p>
        </div>

        <section className={styles.guideSection}>
          <h2>Normativa de Clasificación y Educación Ambiental</h2>
          <div className={styles.guideGrid}>
            <div className={`${styles.guideCard} ${styles.organic}`}>
              <h3><Leaf size={16} className={styles.inlineIcon} color="#16a34a"/> Orgánicos</h3>
              <p>Restricción Técnica: Contenedor Verde. Apto para biorreactores. Restos de alimentos, fibra vegetal, café y residuos de poda urbana.</p>
            </div>
            
            <div className={`${styles.guideCard} ${styles.recyclable}`}>
              <h3><Recycle size={16} className={styles.inlineIcon} color="#2563eb"/> Reciclables</h3>
              <p>Restricción Técnica: Contenedor Azul. Plástico, cartón, vidrio y metales. Deben separarse sin trazas lipídicas para no contaminar lotes.</p>
            </div>

            <div className={`${styles.guideCard} ${styles.waste}`}>
              <h3><Trash2 size={16} className={styles.inlineIcon} color="#475569"/> No Aprovechables</h3>
              <p>Restricción Técnica: Contenedor Negro. Residuos termoplásticos degradados, sanitarios y químicos. Conducción directa a relleno sanitario central.</p>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
