// src/app/[locale]/libro/[id]/page.jsx
import VistaLibro from "@/components/VistaLibro";
import { getProductoById } from "@/lib/products";
import { getTopVentas } from "@/lib/reports";
import { getDictionary } from "@/lib/get-dictionary";
import { LOCALES } from "@/lib/i18n";

export const revalidate = 3600; 

export async function generateStaticParams() {
  try {
    const top = await getTopVentas(5);
    const ids = Array.isArray(top)
      ? top.map((t) => String(t.id_producto ?? t.id ?? t.producto_id ?? "")).filter(Boolean)
      : [];

    if (ids.length === 0) return [];

    const params = [];
    for (const locale of (LOCALES || [])) {
      for (const id of ids) {
        params.push({ locale, id });
      }
    }
    return params;
  } catch (err) {
    console.warn("generateStaticParams getTopVentas fallo:", err?.message ?? err);
    return [];
  }
}

export default async function LibroDetallePage({ params }) {
  const resolved = await params;
  const { locale = "es-ES", id } = resolved || {};

  const dict = (await getDictionary(locale)) || {};

  console.log("LibroDetallePage locale =", locale, "id =", id);

  if (!id) {
    console.warn("LibroDetallePage: id ausente en params");
    return <VistaLibro id={null} modoCompleto={true} initialLibro={null} dict={dict} locale={locale} />;
  }

  const libro = await getProductoById(id);

  console.log("Libro obtenido:", !!libro, libro && (libro.id_producto ?? libro.id));

  return <VistaLibro id={id} modoCompleto={true} initialLibro={libro} dict={dict} locale={locale} />;
}