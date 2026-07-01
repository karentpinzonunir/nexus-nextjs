import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { compraSchema } from "@/lib/schemas";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const usuarioIdRaw = searchParams.get("usuarioId") ?? searchParams.get("usuario_id");

        let query = supabase
            .from("compra")
            .select("*, detalle_compra(*)")
            .order("fecha_compra", { ascending: false });

        if (usuarioIdRaw) {
            const usuarioId = Number(usuarioIdRaw);
            if (Number.isNaN(usuarioId)) {
                return NextResponse.json(
                    { error: "usuarioId inválido" },
                    { status: 400 }
                );
            }

            query = query.eq("usuario_id", usuarioId);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Error al consultar compras" },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();

        let usuario_id = null;
        let detalle = [];

        if (
            body &&
            (body.usuarioId || body.usuario_id) &&
            (body.libroId || body.productoId || body.producto_id)
        ) {
            usuario_id = Number(body.usuarioId ?? body.usuario_id);
            const producto_id = Number(
                body.libroId ?? body.productoId ?? body.producto_id
            );
            const cantidad = Number(body.cantidad ?? 1);

            if (!Number.isFinite(usuario_id) || !Number.isFinite(producto_id)) {
                return NextResponse.json(
                    { error: "usuarioId o productoId inválido" },
                    { status: 400 }
                );
            }

            if (!Number.isFinite(cantidad) || cantidad <= 0) {
                return NextResponse.json(
                    { error: "La cantidad debe ser mayor a 0" },
                    { status: 400 }
                );
            }

            const { data: producto, error: errProducto } = await supabase
                .from("producto_editorial")
                .select("stock, precio")
                .eq("id_producto", producto_id)
                .single();

            if (errProducto) throw errProducto;

            if (!producto) {
                return NextResponse.json(
                    { error: "Producto no encontrado" },
                    { status: 404 }
                );
            }

            if ((producto.stock ?? 0) < cantidad) {
                return NextResponse.json(
                    { error: "Stock insuficiente" },
                    { status: 400 }
                );
            }

            detalle = [
                {
                    producto_id,
                    cantidad,
                    precio_unitario: Number(
                        body.precioUnitario ?? body.precio_unitario ?? producto.precio ?? 0
                    ),
                },
            ];
        } else {
            const validData = compraSchema.parse(body);
            usuario_id = validData.usuario_id;
            detalle = validData.detalle;
        }

        if (!usuario_id || !Array.isArray(detalle) || detalle.length === 0) {
            return NextResponse.json(
                { error: "Datos inválidos para la compra" },
                { status: 400 }
            );
        }

        const detalleNormalizado = [];

        for (const item of detalle) {
            const producto_id = Number(
                item.producto_id ?? item.productoId ?? item.libroId ?? item.id
            );
            const cantidad = Number(item.cantidad ?? 1);

            if (!Number.isFinite(producto_id) || !Number.isFinite(cantidad) || cantidad <= 0) {
                return NextResponse.json(
                    { error: "Detalle inválido en la compra" },
                    { status: 400 }
                );
            }

            const { data: producto, error: errProducto } = await supabase
                .from("producto_editorial")
                .select("stock, precio")
                .eq("id_producto", producto_id)
                .single();

            if (errProducto) throw errProducto;

            if (!producto) {
                return NextResponse.json(
                    { error: `Producto ${producto_id} no encontrado` },
                    { status: 404 }
                );
            }

            if ((producto.stock ?? 0) < cantidad) {
                return NextResponse.json(
                    { error: `Stock insuficiente para el producto ${producto_id}` },
                    { status: 400 }
                );
            }

            const precio_unitario = Number(
                item.precio_unitario ?? item.precioUnitario ?? item.precio ?? producto.precio ?? 0
            );

            detalleNormalizado.push({
                producto_id,
                cantidad,
                precio_unitario,
            });
        }

        const total = detalleNormalizado.reduce(
            (acc, item) => acc + item.cantidad * item.precio_unitario,
            0
        );

        const { data: nuevaCompra, error: errCompra } = await supabase
            .from("compra")
            .insert([{ usuario_id, total }])
            .select()
            .single();

        if (errCompra) throw errCompra;

        const id_compra = nuevaCompra.id_compra ?? nuevaCompra.id;

        for (const item of detalleNormalizado) {
            const { error: errDetalle } = await supabase
                .from("detalle_compra")
                .insert([
                    {
                        compra_id: id_compra,
                        producto_id: item.producto_id,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario,
                        subtotal: item.cantidad * item.precio_unitario,
                    },
                ]);

            if (errDetalle) throw errDetalle;

            const { data: productoActual, error: errProductoActual } = await supabase
                .from("producto_editorial")
                .select("stock")
                .eq("id_producto", item.producto_id)
                .single();

            if (errProductoActual) throw errProductoActual;

            const nuevoStock = Math.max(
                0,
                (productoActual?.stock ?? 0) - item.cantidad
            );

            const { error: errUpdateStock } = await supabase
                .from("producto_editorial")
                .update({ stock: nuevoStock })
                .eq("id_producto", item.producto_id);

            if (errUpdateStock) throw errUpdateStock;
        }

        return NextResponse.json(
            {
                message: "Compra registrada con éxito",
                id_compra,
                total,
            },
            { status: 201 }
        );
    } catch (error) {
        if (error?.name === "ZodError") {
            return NextResponse.json(
                { error: error.errors ?? error.issues ?? "Error de validación" },
                { status: 400 }
            );
        }

        console.error(error);
        return NextResponse.json(
            { error: error?.message || "Error al procesar la compra" },
            { status: 500 }
        );
    }
}