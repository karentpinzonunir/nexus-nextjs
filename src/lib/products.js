// src/lib/products.js
import { supabase } from "./db";

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

export async function getProductoById(id) {
    try {
        if (!id) return null;
        const idStr = String(id);
        const idNum = Number(idStr);

        const maybeSingle = async (queryBuilder) => {
            if (typeof queryBuilder.maybeSingle === "function") {
                return queryBuilder.maybeSingle();
            }
            try {
                return await queryBuilder.limit(1).single();
            } catch (err) {
                return { data: null, error: null };
            }
        };

        if (!Number.isNaN(idNum)) {
            try {
                const qb = supabase
                    .from("producto_editorial")
                    .select("*")
                    .eq("id_producto", idNum);
                const res = await maybeSingle(qb);
                if (!res.error && res.data) return normalizeProducto(res.data);
            } catch (err) {
                console.warn("getProductoById: intento numérico falló:", err?.message ?? err);
            }
        }

        try {
            const qb2 = supabase
                .from("producto_editorial")
                .select("*")
                .eq("id_producto", idStr);
            const res2 = await maybeSingle(qb2);
            if (!res2.error && res2.data) return normalizeProducto(res2.data);
        } catch (err) {
            console.warn("getProductoById: intento por string en producto_editorial falló:", err?.message ?? err);
        }

        try {
            const qb3 = supabase
                .from("productos")
                .select("*")
                .or(`id_producto.eq.${idStr},id.eq.${idStr}`);
            const res3 = await maybeSingle(qb3);
            if (!res3.error && res3.data) return normalizeProducto(res3.data);
        } catch (err) {
            console.warn("getProductoById: intento en productos falló:", err?.message ?? err);
        }

        return null;
    } catch (err) {
        console.error("getProductoById error:", err?.message ?? err);
        return null;
    }
}