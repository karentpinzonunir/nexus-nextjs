// src/app/api/reservas/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { reservaSchema } from '@/lib/schemas'

// GET /api/reservas?usuario=5&fecha=2024-06-10
export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const usuario = searchParams.get('usuario')
    const fecha = searchParams.get('fecha')

    let query = supabase.from('reserva').select('*, espacio_coworking(nombre)')

    if (usuario) query = query.eq('usuario_id', usuario)
    if (fecha) {
        query = query.gte('fecha_hora_inicio', `${fecha}T00:00:00Z`)
            .lte('fecha_hora_inicio', `${fecha}T23:59:59Z`)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 200 })
}

// POST /api/reservas → Con lógica de NO SOLAPAMIENTO
export async function POST(request) {
    try {
        const body = await request.json()
        const { usuario_id, espacio_id, fecha_hora_inicio, fecha_hora_fin } = reservaSchema.parse(body)

        // LÓGICA DE SOLAPAMIENTO: Buscamos si ya hay una reserva para ese espacio en ese rango
        const { data: solapada, error: errCheck } = await supabase
            .from('reserva')
            .select('id_reserva')
            .eq('espacio_id', espacio_id)
            .is('fecha_cancelacion', null) // Solo reservas no canceladas
            .or(`fecha_hora_inicio.lt.${fecha_hora_fin},fecha_hora_fin.gt.${fecha_hora_inicio}`)

        // Nota técnica: En una lógica real de solapamiento de intervalos la condición es:
        // (InicioA < FinB) AND (FinA > InicioB)
        const { data: ocupado } = await supabase
            .from('reserva')
            .select('*')
            .eq('espacio_id', espacio_id)
            .is('fecha_cancelacion', null)
            .filter('fecha_hora_inicio', 'lt', fecha_hora_fin)
            .filter('fecha_hora_fin', 'gt', fecha_hora_inicio)

        if (ocupado && ocupado.length > 0) {
            return NextResponse.json({ error: 'El espacio ya está reservado en ese horario' }, { status: 409 })
        }

        // Si está libre, insertamos
        const { data, error } = await supabase
            .from('reserva')
            .insert([{ usuario_id, espacio_id, fecha_hora_inicio, fecha_hora_fin }])
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ data }, { status: 201 })

    } catch (error) {
        if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 })
        return NextResponse.json({ error: 'Error al procesar reserva' }, { status: 500 })
    }
}