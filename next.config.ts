import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Se agregan los orígenes permitidos (Device IP) para habilitar Hot-Reload desde el celular u otras PCs
  // @ts-ignore
  allowedDevOrigins: ['192.168.100.78', 'localhost'],
};

export default nextConfig;
