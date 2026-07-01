// src/app/api/compras/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { compraSchema } from "@/lib/schemas";
import { auth0 } from "@/lib/auth0";

/* Helper: intentar obtener sesión con ambas firmas posibles */
async function getSessionSafe(request) {
    try {
        return await auth0.getSession(request);
    } catch (e) {
        try {
            return await auth0.getSession();
        } catch (err) {
            console.error("auth0.getSession errors:", e, err);
            return null;
        }
    }
}

/* Util: parsear precio (acepta "12.34", "12,34", número) */
function parsePrecioRaw(v) {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    const s = String(v).trim().replace(/\s/g, "");
    // cambiar coma decimal por punto
    const normalized = s.replace(",", ".");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
}

/* Intentar insertar usando diferentes nombres de columna para el total */
async function insertCompraWithTotal(payload, totalValue) {
    // intentamos con 'total' primero
    try {
        const { data, error } = await supabase
            .from("compra")
            .insert([{ ...payload, total: totalValue }])
            .select()
            .single();
        if (error) throw error;
        return { data, usedColumn: "total" };
    } catch (err) {
        // si la causa es columna inexistente, intentamos con 'total_compra'
        const msg = String(err?.message ?? err);
        if (/column .* total .* does not exist/i.test(msg) || /column "total" of relation "compra" does not exist/i.test(msg)) {
            try {
                const { data, error } = await supabase
                    .from("compra")
                    .insert([{ ...payload, total_compra: totalValue }])
                    .select()
                    .single();
                if (error) throw error;
                return { data, usedColumn: "total_compra" };
            } catch (err2) {
                throw err2;
            }
        }
        throw err;
    }
}

/* GET: devolver compras del usuario autenticado (seguro) */
export async function GET(request) {
    try {
        const session = await getSessionSafe(request);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }
        const auth0Sub = session.user.sub;

        // Si el cliente pasa ?usuarioId=..., sólo permitimos si coincide con el sub de la sesión
        const { searchParams } = new URL(request.url);
        const qUsuarioId = searchParams.get("usuarioId") ?? searchParams.get("usuario_id");

        if (qUsuarioId && qUsuarioId !== auth0Sub) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        // Consultar compras del usuario (usuario_id guarda el sub de Auth0)
        const { data, error } = await supabase
            .from("compra")
            .select("*, detalle_compra(*)")
            .eq("usuario_id", auth0Sub)
            .order("fecha_compra", { ascending: false });

        if (error) {
            console.error("GET /api/compras supabase error:", error);
            return NextResponse.json({ error: error.message ?? "Error al consultar compras" }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (err) {
        console.error("GET /api/compras unexpected error:", err);
        return NextResponse.json({ error: "Error del servidor", details: String(err) }, { status: 500 });
    }
}

/* POST: registrar compra asociada al usuario de la sesión (usa session.user.sub) */
export async function POST(request) {
    try {
        const session = await getSessionSafe(request);
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }
        const usuario_id = session.user.sub; // guardamos el sub de Auth0 (string)

        const body = await request.json();

        // Construir detalle: aceptar payload simple (producto único) o estructura completa
        let detalle = [];

        if (
            body &&
            (body.libroId || body.productoId || body.producto_id)
        ) {
            const producto_id = Number(body.libroId ?? body.productoId ?? body.producto_id);
            const cantidad = Number(body.cantidad ?? 1);
            if (!Number.isFinite(producto_id) || !Number.isFinite(cantidad) || cantidad <= 0) {
                return NextResponse.json({ error: "usuarioId o productoId o cantidad inválidos" }, { status: 400 });
            }
            detalle = [
                {
                    producto_id,
                    cantidad,
                    precio_unitario: parsePrecioRaw(body.precioUnitario ?? body.precio_unitario ?? 0),
                },
            ];
        } else if (Array.isArray(body.detalle)) {
            detalle = body.detalle.map((it) => ({
                producto_id: Number(it.producto_id ?? it.productoId ?? it.libroId ?? it.id),
                cantidad: Number(it.cantidad ?? 1),
                precio_unitario: parsePrecioRaw(it.precio_unitario ?? it.precioUnitario ?? it.precio ?? 0),
            }));
        } else {
            // Si usas Zod schema
            if (compraSchema) {
                try {
                    const valid = compraSchema.parse(body);
                    detalle = valid.detalle.map((it) => ({
                        producto_id: Number(it.producto_id ?? it.productoId ?? it.libroId ?? it.id),
                        cantidad: Number(it.cantidad ?? 1),
                        precio_unitario: parsePrecioRaw(it.precio_unitario ?? it.precioUnitario ?? it.precio ?? 0),
                    }));
                } catch (zErr) {
                    console.error("Zod error:", zErr);
                    return NextResponse.json({ error: "Payload inválido", details: zErr.errors ?? zErr }, { status: 400 });
                }
            } else {
                return NextResponse.json({ error: "Detalle de compra inválido" }, { status: 400 });
            }
        }

        if (!Array.isArray(detalle) || detalle.length === 0) {
            return NextResponse.json({ error: "Detalle inválido para la compra" }, { status: 400 });
        }

        // Validaciones por producto (stock, precio) y normalización
        const detalleNormalizado = [];
        for (const item of detalle) {
            const producto_id = Number(item.producto_id);
            const cantidad = Number(item.cantidad ?? 1);
            const precio_unitario = parsePrecioRaw(item.precio_unitario);

            if (!Number.isFinite(producto_id) || !Number.isFinite(cantidad) || cantidad <= 0) {
                return NextResponse.json({ error: "Detalle inválido en la compra" }, { status: 400 });
            }

            const { data: producto, error: errProducto } = await supabase
                .from("producto_editorial")
                .select("stock, precio")
                .eq("id_producto", producto_id)
                .single();

            if (errProducto) {
                console.error("Error consultando producto:", errProducto);
                throw errProducto;
            }
            if (!producto) {
                return NextResponse.json({ error: `Producto ${producto_id} no encontrado` }, { status: 404 });
            }
            if ((producto.stock ?? 0) < cantidad) {
                return NextResponse.json({ error: `Stock insuficiente para el producto ${producto_id}` }, { status: 400 });
            }

            // si precio_unitario es 0, intentar tomar precio por defecto del producto
            const finalPrecio = precio_unitario > 0 ? precio_unitario : parsePrecioRaw(producto.precio ?? 0);

            detalleNormalizado.push({
                producto_id,
                cantidad,
                precio_unitario: Number(Number(finalPrecio).toFixed(2)),
            });
        }

        // Calcular total con robustez
        const total = detalleNormalizado.reduce(
            (acc, it) => acc + Number(it.cantidad) * Number(it.precio_unitario),
            0
        );
        const totalNormalized = Number(Number(total).toFixed(2));

        console.log("DEBUG detalleNormalizado:", detalleNormalizado);
        console.log("DEBUG totalNormalized:", totalNormalized, "usuario_id(session.sub):", usuario_id);

        // Insertar compra (intentamos 'total' y si falla por nombre de columna intentamos 'total_compra')
        const payloadBase = { usuario_id };
        let nuevaCompra;
        let usedColumn = null;
        try {
            const result = await insertCompraWithTotal(payloadBase, totalNormalized);
            nuevaCompra = result.data;
            usedColumn = result.usedColumn;
        } catch (err) {
            console.error("Error insertando compra (ambos intentos):", err);
            return NextResponse.json({ error: "Error al insertar compra", details: String(err) }, { status: 500 });
        }

        const id_compra = nuevaCompra.id_compra ?? nuevaCompra.id ?? null;
        console.log("DEBUG nuevaCompra:", nuevaCompra, "usedColumn:", usedColumn);

        // Insertar detalle_compra y actualizar stock
        for (const item of detalleNormalizado) {
            const subtotal = Number((item.cantidad * item.precio_unitario).toFixed(2));

            const { error: errDetalle } = await supabase
                .from("detalle_compra")
                .insert([
                    {
                        compra_id: id_compra,
                        producto_id: item.producto_id,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario,
                        subtotal,
                    },
                ]);

            if (errDetalle) {
                console.error("Error insertando detalle_compra:", errDetalle);
                throw errDetalle;
            }

            // actualizar stock
            const { data: productoActual, error: errProductoActual } = await supabase
                .from("producto_editorial")
                .select("stock")
                .eq("id_producto", item.producto_id)
                .single();

            if (errProductoActual) {
                console.error("Error consultando productoActual:", errProductoActual);
                throw errProductoActual;
            }

            const nuevoStock = Math.max(0, (productoActual?.stock ?? 0) - item.cantidad);
            const { error: errUpdateStock } = await supabase
                .from("producto_editorial")
                .update({ stock: nuevoStock })
                .eq("id_producto", item.producto_id);

            if (errUpdateStock) {
                console.error("Error actualizando stock:", errUpdateStock);
                throw errUpdateStock;
            }
        }

        // Respuesta final
        return NextResponse.json(
            {
                message: "Compra registrada con éxito",
                id_compra,
                total: totalNormalized,
                usedTotalColumn: usedColumn,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/compras unexpected error:", error);
        return NextResponse.json(
            { error: error?.message || "Error al procesar la compra", details: String(error) },
            { status: 500 }
        );
    }
}