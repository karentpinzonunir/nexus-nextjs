// src/app/api/top-ventas/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const limite = parseInt(searchParams.get('limite') || '10')

        // Consultamos detalle_compra trayendo la información del producto asociado
        const { data, error } = await supabase
            .from('detalle_compra')
            .select(`
        producto_id,
        cantidad,
        producto_editorial (
          id_producto,
          titulo,
          precio,
          imagen_url
        )
      `)

        if (error) throw error

        // Agrupamos y sumamos cantidades por producto_id
        const resumen = data.reduce((acc, current) => {
            const pid = current.producto_id
            if (!acc[pid]) {
                acc[pid] = {
                    id_producto: pid,
                    titulo: current.producto_editorial.titulo,
                    total_vendido: 0
                }
            }
            acc[pid].total_vendido += current.cantidad
            return acc
        }, {})

        // Convertimos a array, ordenamos de mayor a menor y limitamos
        const topVentas = Object.values(resumen)
            .sort((a, b) => b.total_vendido - a.total_vendido)
            .slice(0, limite)

        return NextResponse.json({ data: topVentas }, { status: 200 })
    } catch (error) {
        console.error('Error en Top Ventas:', error)
        return NextResponse.json({ error: 'Error al generar el reporte' }, { status: 500 })
    }
}