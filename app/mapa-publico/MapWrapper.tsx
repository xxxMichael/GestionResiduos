"use client";

import dynamic from 'next/dynamic';

const PublicMapClient = dynamic(() => import('./PublicMapClient'), { ssr: false });

export default function MapWrapper({ tickets }: { tickets: any[] }) {
  return <PublicMapClient tickets={tickets} />;
}
