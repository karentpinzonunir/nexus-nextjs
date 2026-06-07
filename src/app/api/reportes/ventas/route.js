// src/app/api/reportes/ventas/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const desde = searchParams.get('desde')
        const hasta = searchParams.get('hasta')

        let query = supabase.from('compra').select('total, fecha_compra')

        if (desde) query = query.gte('fecha_compra', desde)
        if (hasta) query = query.lte('fecha_compra', hasta)

        const { data, error } = await query

        if (error) throw error

        const stats = {
            total_ventas_monto: data.reduce((sum, item) => sum + parseFloat(item.total), 0),
            cantidad_compras: data.length,
            promedio_ticket: data.length > 0 ? (data.reduce((sum, item) => sum + parseFloat(item.total), 0) / data.length) : 0
        }

        return NextResponse.json({ data: stats }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: 'Error al generar reporte de ventas' }, { status: 500 })
    }
}