"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  // Precargamos los datos para facilitar la demostración al Ing. Roberto
  const [email, setEmail] = useState('admin@sigtr.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        // Al colocar la cookie, Next.js Middleware permitirá este acceso
        router.push('/admin');
        router.refresh(); 
      } else {
        const data = await res.json();
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (e) {
      setError('Error de red al conectar con el servidor. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.glassContainer}>
        <div className={styles.header}>
          <h1>Portal Administrativo</h1>
          <p>Plataforma Segura SIGTR (Acceso Restringido)</p>
        </div>
        
        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="admin@sigtr.com"
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Verificando Credenciales...' : 'Acceder al Dashboard'}
          </button>
        </form>
        
        <div className={styles.hint}>
          <strong>Información del Sistema:</strong> Las credenciales oficiales de desarrollo han sido autocompletadas. Presiona "Acceder" para continuar.
        </div>
      </div>
    </main>
  );
}
