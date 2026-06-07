import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Auto-seed inicial de demostración: Si el email es el del administrador y no existe, se crea en Prisma
    if (email === 'admin@sigtr.com') {
      let admin = await prisma.user.findUnique({ where: { email } });
      if (!admin) {
        admin = await prisma.user.create({
          data: { 
            email: 'admin@sigtr.com', 
            password: 'admin123', 
            role: 'ADMIN' 
          }
        });
      }
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    // Validación plana para motivos del MVP
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado. Rol insuficiente.' }, { status: 403 });
    }

    // Configurar cookie segura HttpOnly
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'authenticated_user_' + user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 día de sesión
    });

    return NextResponse.json({ success: true, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
