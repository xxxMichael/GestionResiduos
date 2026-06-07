"use client";

import { useState } from 'react';
import { Camera, MapPin, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const getLocation = () => {
    setLoadingLoc(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoadingLoc(false);
        },
        (error) => {
          console.error(error);
          alert('Error obteniendo ubicación. Verifica los permisos.');
          setLoadingLoc(false);
        }
      );
    } else {
      alert('Geolocalización no soportada por su dispositivo.');
      setLoadingLoc(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !location) {
      alert("La validación falló: Faltan coordenadas o evidencia descriptiva.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('category', 'TRASH_DUMP'); // Default classification
      if (whatsapp) formData.append('whatsapp', whatsapp);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setSuccess(true);
        setDescription('');
        setWhatsapp('');
        setLocation(null);
        setImageFile(null);
      } else {
        alert("Fallo del servidor al registrar paquete de datos.");
      }
    } catch (e) {
      alert("Incidencia de red. Reintente en un momento.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className={styles.main} style={{ justifyContent: 'center', padding: '1rem' }}>
        <div className={styles.formContainer} style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <CheckCircle size={48} color="#16a34a" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>Reporte Emitido</h1>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '2rem' }}>El incidente ha sido asegurado y encolado en los registros del sistema operativo SIGTR.</p>
          <button className={styles.btnLocation} onClick={() => setSuccess(false)} style={{ width: '100%', background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}>
            Registrar Siguiente Evento
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1><AlertTriangle size={22} color="#f59e0b" /> Portal de reportes</h1>
        <p>Plataforma corporativa de recolección técnica ciudadana.</p>
      </div>

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit}>
          <div className={styles.locationContainer}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>1. Coordenadas Espaciales</label>
            <button
              type="button"
              onClick={getLocation}
              className={styles.btnLocation}
              disabled={loadingLoc}
            >
              <MapPin size={16} /> {loadingLoc ? 'Rastreando Constelación...' : location ? 'Coordenadas GPS Fijadas' : 'Adquirir Ubicación Automática'}
            </button>

            {location && (
              <div className={styles.coordinates}>
                Lat: {location.lat.toFixed(6)} | Lng: {location.lng.toFixed(6)}
              </div>
            )}
          </div>

          <div className={styles.photoUploadContainer}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>2. Documento Fotográfico</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              id="photo-upload"
              className={styles.photoInput}
              onChange={handleImageChange}
            />
            <label htmlFor="photo-upload" className={styles.photoLabel} style={{ background: imageFile ? '#f0fdf4' : '#f8fafc', borderColor: imageFile ? '#bbf7d0' : '#cbd5e1', color: imageFile ? '#166534' : '#64748b' }}>
              <Camera size={20} />
              <span>{imageFile ? imageFile.name : 'Vincular Evidencia Gráfica'}</span>
            </label>
          </div>

          <div className={styles.inputGroup}>
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>3. Detalles Operativos</span>
              <span style={{ fontSize: '0.75rem', color: description.length > 230 ? '#ef4444' : '#64748b' }}>
                {description.length}/250
              </span>
            </label>
            <textarea
              rows={4}
              maxLength={250}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Declarar volumen métrico aproximado, accesibilidad de calle y naturaleza del material detectado..."
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{fontSize: '0.8rem', fontWeight: 600, color: '#334155'}}>4. Número de Contacto (Opcional)</span>
              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Notificación WhatsApp</span>
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="Ej. 0991234567"
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.85rem', outline: 'none', transition: 'border-color 0.15s', color: '#0f172a' }}
            />
          </div>

          <button type="submit" disabled={loadingLoc || submitting || !location} className={styles.btnSubmit}>
            <Send size={16} /> {submitting ? 'Cargando Transmisión...' : 'Ingresar Reporte a la Red'}
          </button>
        </form>
      </div>
    </main>
  );
}
