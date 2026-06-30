// src/lib/products.js
import { supabase } from "./db";

/**
 * Normaliza una fila de producto para la UI.
 * Declarada primero para evitar problemas de referencia en build.
 */
function normalizeProducto(row) {
    return {
        id_producto: row.id_producto ?? row.id ?? row.producto_id ?? null,
        id: row.id_producto ?? row.id ?? row.producto_id ?? null,
        titulo: row.titulo ?? row.nombre ?? row.nombre_producto ?? null,
        descripcion: row.descripcion ?? row.resumen ?? null,
        tipo_producto: row.tipo_producto ?? row.tipo ?? null,
        autor: row.autor ?? row.author ?? null,
        editorial: row.editorial ?? row.editor ?? null,
        fecha_publicacion: row.fecha_publicacion ?? row.publish_date ?? null,
        year: row.fecha_publicacion ? new Date(row.fecha_publicacion).getFullYear() : (row.year ?? null),
        precio: Number(row.precio ?? row.price ?? 0),
        stock: Number(row.stock ?? row.cantidad ?? 0),
        imagen_url: row.imagen_url ?? row.imagen ?? row.portada ?? null,
        categoria_id: row.categoria_id ?? row.id_categoria ?? null,
        raw: row,
    };
}

/**
 * Obtiene un producto/libro por id desde la DB (server).
 * Intenta varias estrategias y tablas para ser tolerante al esquema.
 * Devuelve objeto normalizado o null.
 */
export async function getProductoById(id) {
    try {
        if (!id) return null;
        const idStr = String(id);
        const idNum = Number(idStr);

        // Helper para usar maybeSingle() si está disponible, sino usar single() con manejo
        const maybeSingle = async (queryBuilder) => {
            // 'queryBuilder' es el builder resultante de supabase.from(...).select(...)
            // Intentamos ejecutar .maybeSingle si existe, si no hacemos .limit(1).single() en try/catch
            if (typeof queryBuilder.maybeSingle === "function") {
                return queryBuilder.maybeSingle();
            }
            // Fallback: intentar single() dentro de try/catch
            try {
                return await queryBuilder.limit(1).single();
            } catch (err) {
                // Si single falla (no encontrado), intentamos devolver null sin lanzar
                return { data: null, error: null };
            }
        };

        // Intento 1: buscar por id numérico en producto_editorial (si id convertible a número)
        if (!Number.isNaN(idNum)) {
            try {
                const qb = supabase
                    .from("producto_editorial")
                    .select("*")
                    .eq("id_producto", idNum);
                const res = await maybeSingle(qb);
                if (!res.error && res.data) return normalizeProducto(res.data);
            } catch (err) {
                // ignora y sigue con siguiente intento
                // eslint-disable-next-line no-console
                console.warn("getProductoById: intento numérico falló:", err?.message ?? err);
            }
        }

        // Intento 2: buscar por string en producto_editorial
        try {
            const qb2 = supabase
                .from("producto_editorial")
                .select("*")
                .eq("id_producto", idStr);
            const res2 = await maybeSingle(qb2);
            if (!res2.error && res2.data) return normalizeProducto(res2.data);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn("getProductoById: intento por string en producto_editorial falló:", err?.message ?? err);
        }

        // Intento 3: fallback a tabla 'productos' buscando por id/id_producto
        try {
            const qb3 = supabase
                .from("productos")
                .select("*")
                .or(`id_producto.eq.${idStr},id.eq.${idStr}`);
            const res3 = await maybeSingle(qb3);
            if (!res3.error && res3.data) return normalizeProducto(res3.data);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn("getProductoById: intento en productos falló:", err?.message ?? err);
        }

        // No encontrado
        return null;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error("getProductoById error:", err?.message ?? err);
        return null;
    }
}