// src/app/api/reportes/reservas/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'

export async function GET(request) {
    try {
        const { data, error } = await supabase
            .from('reserva')
            .select('id_reserva, espacio_id, fecha_hora_inicio, fecha_hora_fin')

        if (error) throw error

        // Contamos reservas por espacio
        const porEspacio = data.reduce((acc, curr) => {
            acc[curr.espacio_id] = (acc[curr.espacio_id] || 0) + 1
            return acc
        }, {})

        return NextResponse.json({
            data: {
                total_reservas: data.length,
                reservas_por_espacio: porEspacio
            }
        }, { status: 200 })
    } catch (error) {
        return NextResponse.json({ error: 'Error al generar reporte de reservas' }, { status: 500 })
    }
}