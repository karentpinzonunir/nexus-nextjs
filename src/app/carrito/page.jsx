// src/app/carrito/page.jsx
// Este archivo es un Server Component y fuerza render dinámico
export const dynamic = "force-dynamic";

import CarritoClient from "@/components/CarritoClient";

export default function CarritoPageServer() {
  return <CarritoClient />;
}