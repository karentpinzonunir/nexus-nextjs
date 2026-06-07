// src/app/api/espacios/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/db'
import { espacioSchema } from '@/lib/schemas'

export async function GET(request) {
    const { searchParams } = new URL(request.url)
    const capacidad_min = searchParams.get('capacidad_min')
    const ubicacion = searchParams.get('ubicacion')

    let query = supabase.from('espacio_coworking').select('*')

    if (capacidad_min) query = query.gte('capacidad', parseInt(capacidad_min))
    if (ubicacion) query = query.ilike('ubicacion', `%${ubicacion}%`)

    const { data, error } = await query.order('nombre')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 200 })
}

export async function POST(request) {
    try {
        const body = await request.json()
        const validData = espacioSchema.parse(body)
        const { data, error } = await supabase.from('espacio_coworking').insert([validData]).select().single()
        if (error) throw error
        return NextResponse.json({ data }, { status: 201 })
    } catch (error) {
        if (error.name === 'ZodError') return NextResponse.json({ error: error.errors }, { status: 400 })
        return NextResponse.json({ error: 'Error al crear espacio' }, { status: 500 })
    }
}