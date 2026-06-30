// src/app/page.jsx  (Server Component)
// No "use client" aquí — esto permite SSG/ISR en App Router.

import LandingClient from "@/components/LandingClient";
import { getTopVentas } from "@/lib/reports";

export const revalidate = 300; // ISR: regenera cada 5 minutos

export default async function HomePage() {
  let raw = [];
  try {
    raw = await getTopVentas(10);
  } catch (err) {
    console.error("Error getTopVentas:", err);
    raw = [];
  }

  const librosInitial = raw.map((item) => ({
    id: item.id_producto ?? item.id ?? null,
    titulo: item.titulo ?? item.nombre ?? "Sin título",
    autor: (item.autor ?? "").toString().trim() || "Autor desconocido",
    portada: item.imagen ?? item.portada ?? "/placeholder.png",
    total_vendido: item.total_vendido ?? 0,
    raw: item,
  }));

  return <LandingClient initialLibros={librosInitial} />;
}