// src/app/libro/[id]/page.jsx
import VistaLibro from "@/components/VistaLibro";
import { getProductoById } from "@/lib/products";
import { getTopVentas } from "@/lib/reports";

export const revalidate = 3600; // ISR 1 hora

// Opcional: prerenderizar los top N libros (mejores ventas)
export async function generateStaticParams() {
  try {
    const top = await getTopVentas(5); // [{ id_producto, ... }, ...]
    if (!Array.isArray(top)) return [];
    return top
      .map((t) => ({ id: String(t.id_producto ?? t.id ?? t.producto_id ?? "") }))
      .filter((p) => p.id); // filtrar vacíos
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("generateStaticParams getTopVentas fallo:", err?.message ?? err);
    return [];
  }
}

export default async function LibroDetallePage({ params }) {
  // params es una Promise en esta versión — hay que desempaquetarla
  const { id } = await params;

  // logs temporales para depuración (puedes quitar en producción)
  // eslint-disable-next-line no-console
  console.log("LibroDetallePage params.id =", id);

  if (!id) {
    // Si por alguna razón no hay id, devolvemos una UI mínima (evita fallos)
    // eslint-disable-next-line no-console
    console.warn("LibroDetallePage: id ausente en params");
    return <VistaLibro id={null} modoCompleto={true} initialLibro={null} />;
  }

  const libro = await getProductoById(id);

  // eslint-disable-next-line no-console
  console.log("Libro obtenido:", !!libro, libro && (libro.id_producto ?? libro.id));

  // Pasamos initialLibro al componente cliente para evitar fetch extra
  return <VistaLibro id={id} modoCompleto={true} initialLibro={libro} />;
}