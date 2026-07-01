// src/app/[locale]/page.jsx
import LandingClient from "@/components/LandingClient";
import { getTopVentas } from "@/lib/reports";
import { getDictionary } from "@/lib/get-dictionary";

export const revalidate = 300;

export default async function HomePage({ params }) {
  const { locale } = await params;
  const currentLocale = locale ?? "es-ES";
  const dict = await getDictionary(currentLocale);

  let raw = [];
  try {
    raw = await getTopVentas(10);
  } catch (err) {
    console.error("Error getTopVentas:", err);
    raw = [];
  }

  const librosInitial = raw.map((item) => ({
    id: item.id_producto ?? item.id ?? null,
    titulo:
      item.titulo ?? item.nombre ?? dict.book_labels?.no_title ?? "Sin título",
    autor:
      ((item.autor ?? "").toString().trim() ||
        dict.book_labels?.unknown_author) ??
      "Autor desconocido",
    portada: item.imagen ?? item.portada ?? "/placeholder.png",
    total_vendido: item.total_vendido ?? 0,
    precio: item.precio ?? null,
    raw: item,
  }));

  return (
    <LandingClient
      initialLibros={librosInitial}
      locale={currentLocale}
      dict={dict}
    />
  );
}
