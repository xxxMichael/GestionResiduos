import prisma from '@/lib/prisma';
import MapWrapper from './MapWrapper';

export const revalidate = 0; 

export default async function AdminDashboard() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <MapWrapper initialTickets={tickets} />
  );
}
