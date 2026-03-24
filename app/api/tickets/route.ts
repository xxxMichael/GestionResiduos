import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("GET /api/tickets error:", error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const description = formData.get('description') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    const category = formData.get('category') as string || 'TRASH_DUMP';
    const whatsapp = formData.get('whatsapp') as string || null;
    
    let imageUrl = '';

    const file = formData.get('image') as File | null;
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      
      imageUrl = `/uploads/${fileName}`;
    }

    if (!description || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (description.length > 250) {
      return NextResponse.json({ error: 'Payload Too Large: El campo de detalles excede el límite de seguridad (250 caracteres)' }, { status: 413 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        description,
        latitude,
        longitude,
        category,
        imageUrl: imageUrl || null,
        whatsapp
      }
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("POST /api/tickets error:", error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
