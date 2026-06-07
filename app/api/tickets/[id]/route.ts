import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status, imageUrl } = body;

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (imageUrl) dataToUpdate.imageUrl = imageUrl;

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("PATCH /api/tickets/[id] error:", error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
