// src/lib/reports.js
import { supabase } from "./db";

/**
 * Devuelve los productos más vendidos (top ventas).
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getTopVentas(limit = 10) {
    try {
        const { data, error } = await supabase
            .from("detalle_compra")
            .select(`
        producto_id,
        cantidad,
        producto_editorial (
          id_producto,
          titulo,
          autor,
          precio,
          imagen_url
        )
      `);

        if (error) throw error;

        if (!Array.isArray(data) || data.length === 0) return [];

        const resumen = data.reduce((acc, current) => {
            const pid = current.producto_id ?? current.productoId ?? null;
            const cantidad = Number(current.cantidad ?? 0);
            const producto = current.producto_editorial ?? {};

            if (!pid) return acc;

            if (!acc[pid]) {
                acc[pid] = {
                    id_producto: pid,
                    titulo: producto.titulo ?? producto.nombre ?? `Producto ${pid}`,
                    autor: producto.autor ?? producto.author ?? "Desconocido",
                    imagen: producto.imagen_url ?? producto.imagen ?? null,
                    total_vendido: 0,
                };
            }

            acc[pid].total_vendido += isFinite(cantidad) ? cantidad : 0;
            return acc;
        }, {});

        const topVentas = Object.values(resumen)
            .sort((a, b) => b.total_vendido - a.total_vendido)
            .slice(0, limit);

        return topVentas;
    } catch (err) {
        // No romper el build: devolver fallback vacío y loguear para debugging
        // eslint-disable-next-line no-console
        console.error("getTopVentas error:", err?.message ?? err);
        return [];
    }
}