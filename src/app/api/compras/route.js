// src/app/api/compras/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { compraSchema } from '@/lib/schemas'

// GET /api/compras → Listar todas las compras
export async function GET() {
    const { data, error } = await supabase
        .from('compra')
        .select('*, detalle_compra(*)')
        .order('fecha_compra', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 200 })
}

// POST /api/compras → Registrar compra + detalles + stock
export async function POST(request) {
    try {
        const body = await request.json()
        const validData = compraSchema.parse(body)
        const { usuario_id, detalle } = validData

        // 1. Calcular el total de la compra
        const total = detalle.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0)

        // 2. Insertar en la tabla 'compra'
        const { data: nuevaCompra, error: errCompra } = await supabase
            .from('compra')
            .insert([{ usuario_id, total }])
            .select()
            .single()

        if (errCompra) throw errCompra

        const id_compra = nuevaCompra.id_compra

        // 3. Insertar detalles y actualizar stock paso a paso
        for (const item of detalle) {
            // A. Insertar detalle
            const { error: errDetalle } = await supabase
                .from('detalle_compra')
                .insert([{
                    compra_id: id_compra,
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    subtotal: item.cantidad * item.precio_unitario
                }])

            if (errDetalle) throw errDetalle

            // B. Actualizar Stock en 'producto_editorial' utilizando la función rpc de postgres
            // (Opcional: puedes hacerlo con update directo si no quieres usar rpc)
            const { data: producto } = await supabase
                .from('producto_editorial')
                .select('stock')
                .eq('id_producto', item.producto_id)
                .single()

            await supabase
                .from('producto_editorial')
                .update({ stock: (producto.stock - item.cantidad) })
                .eq('id_producto', item.producto_id)
        }

        return NextResponse.json({
            message: 'Compra registrada con éxito',
            id_compra,
            total
        }, { status: 201 })

    } catch (error) {
        if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 })
        console.error(error)
        return NextResponse.json({ error: 'Error al procesar la compra' }, { status: 500 })
    }
}